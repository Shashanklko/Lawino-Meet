package com.lawinomeet.appointment.service;

import com.lawinomeet.appointment.dto.*;
import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.entity.AvailabilitySlot;
import com.lawinomeet.appointment.entity.ConsultationType;
import com.lawinomeet.appointment.entity.SlotStatus;
import com.lawinomeet.appointment.exception.ApiException;
import com.lawinomeet.appointment.repository.AppointmentRepository;
import com.lawinomeet.appointment.repository.AvailabilitySlotRepository;
import com.lawinomeet.appointment.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository slotRepository;

    @Transactional
    public AppointmentResponse bookAppointment(UserPrincipal client, CreateAppointmentRequest request) {
        AvailabilitySlot slot = slotRepository.findByPublicId(request.getSlotPublicId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND", "Availability slot not found."));

        if (!slot.getStartTime().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SLOT_EXPIRED", "Selected slot is in the past.");
        }

        if (slot.getSlotStatus() != SlotStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE", "Selected slot is no longer available.");
        }

        // Prevent client from booking appointment with themselves if lawyer user ID matches
        if (slot.getLawyerUserPublicId().equals(client.getPublicId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_BOOKING", "You cannot book an appointment with yourself.");
        }

        // Concurrency check 1: Check active conflict for lawyer
        if (appointmentRepository.hasLawyerActiveAppointmentConflict(
                slot.getLawyerUserPublicId(), slot.getStartTime(), slot.getEndTime())) {
            throw new ApiException(HttpStatus.CONFLICT, "LAWYER_CONFLICT",
                    "Lawyer already has an active appointment during this time.");
        }

        // Concurrency check 2: Check active conflict for client
        if (appointmentRepository.hasClientActiveAppointmentConflict(
                client.getPublicId(), slot.getStartTime(), slot.getEndTime())) {
            throw new ApiException(HttpStatus.CONFLICT, "CLIENT_CONFLICT",
                    "You already have an active appointment scheduled during this time window.");
        }

        // ATOMIC SLOT RESERVATION: Race condition safe update
        Instant now = Instant.now();
        int updatedRows = slotRepository.updateSlotStatusConditionally(
                slot.getPublicId(), SlotStatus.AVAILABLE, SlotStatus.PENDING, now);

        if (updatedRows == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE",
                    "Selected slot was just reserved or booked by another user.");
        }

        // Re-read slot to reflect PENDING status
        slot.setSlotStatus(SlotStatus.PENDING);
        slot.setUpdatedAt(now);

        Appointment appointment = Appointment.builder()
                .publicId(UUID.randomUUID().toString())
                .clientUserPublicId(client.getPublicId())
                .clientUsername(client.getUsername())
                .lawyerUserPublicId(slot.getLawyerUserPublicId())
                .firmPublicId(request.getFirmPublicId())
                .serviceId(request.getServiceId())
                .slot(slot)
                .consultationType(request.getConsultationType() != null ? request.getConsultationType() : ConsultationType.ONLINE)
                .consultationReason(request.getConsultationReason())
                .appointmentStatus(AppointmentStatus.PENDING)
                .requestedAt(now)
                .responseDeadline(now.plus(24, ChronoUnit.HOURS))
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Client {} requested appointment {} for slot {}",
                client.getUsername(), saved.getPublicId(), slot.getPublicId());

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse acceptAppointment(UserPrincipal lawyer, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the assigned lawyer can accept this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Only pending appointments can be accepted. Current status: " + appointment.getAppointmentStatus());
        }

        if (Instant.now().isAfter(appointment.getResponseDeadline())) {
            expireSingleAppointment(appointment);
            throw new ApiException(HttpStatus.GONE, "APPOINTMENT_EXPIRED",
                    "Response deadline for this appointment request has passed.");
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.CONFIRMED);
        appointment.setAcceptedAt(now);

        // Update slot to BOOKED
        slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.BOOKED, now);
        appointment.getSlot().setSlotStatus(SlotStatus.BOOKED);

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} accepted appointment {}", lawyer.getUsername(), appointmentPublicId);
        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse rejectAppointment(UserPrincipal lawyer, String appointmentPublicId, RejectAppointmentRequest request) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the assigned lawyer can reject this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Only pending appointments can be rejected. Current status: " + appointment.getAppointmentStatus());
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.REJECTED);
        appointment.setRejectedAt(now);
        appointment.setRejectionReason(request != null ? request.getReason() : null);

        // Release slot back to AVAILABLE if start time is in future
        if (appointment.getSlot().getStartTime().isAfter(now)) {
            slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.AVAILABLE, now);
            appointment.getSlot().setSlotStatus(SlotStatus.AVAILABLE);
        } else {
            slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.BLOCKED, now);
            appointment.getSlot().setSlotStatus(SlotStatus.BLOCKED);
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} rejected appointment {}", lawyer.getUsername(), appointmentPublicId);
        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UserPrincipal principal, String appointmentPublicId, CancelAppointmentRequest request) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        boolean isClient = appointment.getClientUserPublicId().equals(principal.getPublicId());
        boolean isLawyer = appointment.getLawyerUserPublicId().equals(principal.getPublicId());
        boolean isAdmin = "ROLE_PLATFORM_ADMIN".equals(principal.getRole());

        if (!isClient && !isLawyer && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not authorized to cancel this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.PENDING &&
            appointment.getAppointmentStatus() != AppointmentStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Cannot cancel appointment with status: " + appointment.getAppointmentStatus());
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(now);
        appointment.setCancellationReason(request != null ? request.getReason() : null);

        // Release slot if future
        if (appointment.getSlot().getStartTime().isAfter(now)) {
            slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.AVAILABLE, now);
            appointment.getSlot().setSlotStatus(SlotStatus.AVAILABLE);
        } else {
            slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.BLOCKED, now);
            appointment.getSlot().setSlotStatus(SlotStatus.BLOCKED);
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("User {} cancelled appointment {}", principal.getUsername(), appointmentPublicId);
        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse completeAppointment(UserPrincipal lawyer, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only the assigned lawyer can mark this appointment as complete.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.CONFIRMED &&
            appointment.getAppointmentStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Only confirmed or in-progress appointments can be completed. Current status: " + appointment.getAppointmentStatus());
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.COMPLETED);
        appointment.setCompletedAt(now);

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} completed appointment {}", lawyer.getUsername(), appointmentPublicId);
        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointment(UserPrincipal principal, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        boolean isClient = appointment.getClientUserPublicId().equals(principal.getPublicId());
        boolean isLawyer = appointment.getLawyerUserPublicId().equals(principal.getPublicId());
        boolean isFirmAdmin = "FIRM_ADMIN".equalsIgnoreCase(principal.getRole());
        boolean isPlatformAdmin = "PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole());

        if (!isClient && !isLawyer && !isFirmAdmin && !isPlatformAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You do not have permission to view this appointment.");
        }

        return AppointmentResponse.fromEntity(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClientAppointments(String clientPublicId) {
        List<Appointment> list = appointmentRepository.findByClientUserPublicIdOrderByRequestedAtDesc(clientPublicId);
        return list.stream().map(AppointmentResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getLawyerAppointments(String lawyerPublicId, AppointmentStatus status) {
        List<Appointment> list;
        if (status != null) {
            list = appointmentRepository.findByLawyerUserPublicIdAndAppointmentStatusOrderByRequestedAtDesc(lawyerPublicId, status);
        } else {
            list = appointmentRepository.findByLawyerUserPublicIdOrderByRequestedAtDesc(lawyerPublicId);
        }
        return list.stream().map(AppointmentResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getFirmAppointments(String firmPublicId) {
        List<Appointment> list = appointmentRepository.findByFirmPublicIdOrderByRequestedAtDesc(firmPublicId);
        return list.stream().map(AppointmentResponse::fromEntity).toList();
    }

    @Transactional
    public int expirePendingAppointments() {
        Instant now = Instant.now();
        List<Appointment> overdue = appointmentRepository
                .findByAppointmentStatusAndResponseDeadlineBefore(AppointmentStatus.PENDING, now);

        for (Appointment apt : overdue) {
            expireSingleAppointment(apt);
        }
        return overdue.size();
    }

    private void expireSingleAppointment(Appointment apt) {
        Instant now = Instant.now();
        apt.setAppointmentStatus(AppointmentStatus.EXPIRED);
        if (apt.getSlot().getStartTime().isAfter(now)) {
            slotRepository.updateSlotStatusById(apt.getSlot().getId(), SlotStatus.AVAILABLE, now);
            apt.getSlot().setSlotStatus(SlotStatus.AVAILABLE);
        } else {
            slotRepository.updateSlotStatusById(apt.getSlot().getId(), SlotStatus.BLOCKED, now);
            apt.getSlot().setSlotStatus(SlotStatus.BLOCKED);
        }
        appointmentRepository.save(apt);
        log.info("Expired appointment {} due to passed response deadline", apt.getPublicId());
    }

    private Appointment getAppointmentOrThrow(String publicId) {
        return appointmentRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "APPOINTMENT_NOT_FOUND", "Appointment not found."));
    }
}
