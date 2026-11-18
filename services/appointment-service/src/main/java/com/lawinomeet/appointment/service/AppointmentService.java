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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final RestTemplate restTemplate;

    @Value("${app.services.user-service-url:http://localhost:8082}")
    private String userServiceUrl;

    @Value("${app.services.notification-service-url:http://localhost:8085}")
    private String notificationServiceUrl;

    @Transactional
    public AppointmentResponse bookAppointment(UserPrincipal client, CreateAppointmentRequest request) {
        AvailabilitySlot slot;
        Instant now = Instant.now();

        if (request.getSlotPublicId() != null && !request.getSlotPublicId().isBlank()) {
            slot = slotRepository.findByPublicId(request.getSlotPublicId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND", "Availability slot not found."));

            if (!slot.getStartTime().isAfter(now)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SLOT_EXPIRED", "Selected slot is in the past.");
            }

            if (slot.getSlotStatus() != SlotStatus.AVAILABLE) {
                throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE", "Selected slot is no longer available.");
            }

            // Prevent client from booking appointment with themselves
            if (slot.getLawyerUserPublicId().equals(client.getPublicId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_BOOKING", "You cannot book an appointment with yourself.");
            }

            // ATOMIC SLOT RESERVATION: Race condition safe update
            int updatedRows = slotRepository.updateSlotStatusConditionally(
                    slot.getPublicId(), SlotStatus.AVAILABLE, SlotStatus.PENDING, now);

            if (updatedRows == 0) {
                throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE",
                        "Selected slot was just reserved or booked by another user.");
            }

            slot.setSlotStatus(SlotStatus.PENDING);
            slot.setUpdatedAt(now);
        } else if (request.getCustomStartTime1() != null) {
            if (request.getLawyerUserPublicId() == null || request.getLawyerUserPublicId().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_LAWYER", "Lawyer ID is required for custom consultation.");
            }
            if (request.getLawyerUserPublicId().equals(client.getPublicId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_BOOKING", "You cannot book an appointment with yourself.");
            }
            Instant start1 = request.getCustomStartTime1();
            Instant end1 = request.getCustomEndTime1() != null ? request.getCustomEndTime1() : start1.plus(1, ChronoUnit.HOURS);
            slot = AvailabilitySlot.builder()
                    .publicId(UUID.randomUUID().toString())
                    .lawyerUserPublicId(request.getLawyerUserPublicId())
                    .startTime(start1)
                    .endTime(end1)
                    .slotStatus(SlotStatus.PENDING)
                    .build();
            slot = slotRepository.save(slot);
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SLOT_REQUIRED", "Please select or propose consultation slots (minimum 2 slots required).");
        }

        // Alternative Slot handling (minimum 2 slots required from client)
        String altSlotId = request.getAlternativeSlotPublicId();
        if (altSlotId == null && request.getCustomStartTime2() != null) {
            Instant start2 = request.getCustomStartTime2();
            Instant end2 = request.getCustomEndTime2() != null ? request.getCustomEndTime2() : start2.plus(1, ChronoUnit.HOURS);
            AvailabilitySlot altSlot = AvailabilitySlot.builder()
                    .publicId(UUID.randomUUID().toString())
                    .lawyerUserPublicId(slot.getLawyerUserPublicId())
                    .startTime(start2)
                    .endTime(end2)
                    .slotStatus(SlotStatus.PENDING)
                    .build();
            altSlot = slotRepository.save(altSlot);
            altSlotId = altSlot.getPublicId();
        }

        ConsultationType consultType = request.getConsultationType() != null
                ? request.getConsultationType()
                : ConsultationType.ONLINE;

        BigDecimal fee = request.getFee() != null && request.getFee().compareTo(BigDecimal.ZERO) > 0
                ? request.getFee()
                : new BigDecimal("1500.00");

        String chamberAddr = null;
        String directions = null;
        if (consultType == ConsultationType.IN_PERSON) {
            chamberAddr = "Advocate Chambers, High Court Complex, New Delhi - 110001";
            directions = "Report to Chamber Reception 10 minutes prior with appointment reference and photo ID proof.";
        }

        Appointment appointment = Appointment.builder()
                .publicId(UUID.randomUUID().toString())
                .clientUserPublicId(client.getPublicId())
                .clientUsername(client.getUsername())
                .lawyerUserPublicId(slot.getLawyerUserPublicId())
                .firmPublicId(request.getFirmPublicId())
                .serviceId(request.getServiceId())
                .fee(fee)
                .slot(slot)
                .alternativeSlotPublicId(altSlotId)
                .preferredSlotsJson(request.getPreferredSlotsJson())
                .consultationType(consultType)
                .consultationReason(request.getConsultationReason())
                .appointmentStatus(AppointmentStatus.PENDING)
                .paymentStatus("UNPAID")
                .chamberAddress(chamberAddr)
                .directionsInstructions(directions)
                .requestedAt(now)
                .responseDeadline(now.plus(24, ChronoUnit.HOURS))
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Client {} requested appointment {} for slot {} (Alt Slot: {}, Mode: {}, Fee: ₹{})",
                client.getUsername(), saved.getPublicId(), slot.getPublicId(), altSlotId, consultType, fee);

        dispatchNotification(
                saved.getLawyerUserPublicId(),
                "APPOINTMENT_REQUESTED",
                "New Consultation Request",
                "Client " + client.getUsername() + " has requested a " + consultType + " consultation proposing 2 preferred slots. Please review and accept.",
                saved.getPublicId()
        );

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse acceptAppointment(UserPrincipal lawyer, String appointmentPublicId, AcceptAppointmentRequest request) {
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
        appointment.setAppointmentStatus(AppointmentStatus.AWAITING_PAYMENT);
        appointment.setAcceptedAt(now);

        if (request != null) {
            if (request.getChamberAddress() != null && !request.getChamberAddress().isBlank()) {
                appointment.setChamberAddress(request.getChamberAddress());
            }
            if (request.getDirectionsInstructions() != null && !request.getDirectionsInstructions().isBlank()) {
                appointment.setDirectionsInstructions(request.getDirectionsInstructions());
            }

            // Lawyer choice: Accept Option 1 (default) or Option 2 (alternative preference) or provide custom 1-hr slot
            if (request.getChosenSlotOption() != null && request.getChosenSlotOption() == 2 && appointment.getAlternativeSlotPublicId() != null) {
                AvailabilitySlot altSlot = slotRepository.findByPublicId(appointment.getAlternativeSlotPublicId()).orElse(null);
                if (altSlot != null) {
                    AvailabilitySlot oldSlot = appointment.getSlot();
                    if (!oldSlot.getPublicId().equals(altSlot.getPublicId())) {
                        oldSlot.setSlotStatus(SlotStatus.AVAILABLE);
                        slotRepository.save(oldSlot);

                        altSlot.setSlotStatus(SlotStatus.PENDING);
                        slotRepository.save(altSlot);
                        appointment.setSlot(altSlot);
                        log.info("Lawyer {} agreed to Option 2 slot {} for appointment {}", lawyer.getUsername(), altSlot.getPublicId(), appointmentPublicId);
                    }
                }
            } else if (request.getNewSlotPublicId() != null && !request.getNewSlotPublicId().isBlank()) {
                AvailabilitySlot newSlot = slotRepository.findByPublicId(request.getNewSlotPublicId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND", "Specified reschedule slot not found."));
                if (!newSlot.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You can only select your own availability slots.");
                }
                if (newSlot.getSlotStatus() != SlotStatus.AVAILABLE && !newSlot.getPublicId().equals(appointment.getSlot().getPublicId())) {
                    throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE", "Selected slot is not available.");
                }
                if (!newSlot.getPublicId().equals(appointment.getSlot().getPublicId())) {
                    AvailabilitySlot oldSlot = appointment.getSlot();
                    oldSlot.setSlotStatus(SlotStatus.AVAILABLE);
                    slotRepository.save(oldSlot);

                    newSlot.setSlotStatus(SlotStatus.PENDING);
                    slotRepository.save(newSlot);
                    appointment.setSlot(newSlot);
                    log.info("Lawyer {} modified appointment {} slot to {}", lawyer.getUsername(), appointmentPublicId, newSlot.getPublicId());
                }
            } else if (request.getNewStartTime() != null) {
                Instant start = request.getNewStartTime();
                Instant end = request.getNewEndTime() != null ? request.getNewEndTime() : start.plus(1, java.time.temporal.ChronoUnit.HOURS);
                AvailabilitySlot oldSlot = appointment.getSlot();
                oldSlot.setSlotStatus(SlotStatus.AVAILABLE);
                slotRepository.save(oldSlot);

                AvailabilitySlot customSlot = AvailabilitySlot.builder()
                        .publicId(UUID.randomUUID().toString())
                        .lawyerUserPublicId(lawyer.getPublicId())
                        .startTime(start)
                        .endTime(end)
                        .slotStatus(SlotStatus.PENDING)
                        .build();
                customSlot = slotRepository.save(customSlot);
                appointment.setSlot(customSlot);
                log.info("Lawyer {} assigned custom 1-hour slot {} to appointment {}", lawyer.getUsername(), customSlot.getPublicId(), appointmentPublicId);
            }
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} accepted appointment {}. Awaiting client retainer payment.", lawyer.getUsername(), appointmentPublicId);

        dispatchNotification(
                updated.getClientUserPublicId(),
                "APPOINTMENT_ACCEPTED",
                "Appointment Accepted - Retainer Payment Required",
                "Counsel has accepted your consultation request. Please complete payment to unlock your consultation chamber.",
                appointmentPublicId
        );

        return AppointmentResponse.fromEntity(updated, lawyer.getPublicId());
    }

    @Transactional
    public AppointmentResponse updateChamberAddress(UserPrincipal lawyer, String appointmentPublicId, AcceptAppointmentRequest request) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);
        if (!appointment.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the assigned lawyer can update chamber address.");
        }
        if (appointment.getConsultationType() != ConsultationType.IN_PERSON) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CONSULTATION_TYPE", "Chamber address only applies to In-Person consultations.");
        }
        if (request != null) {
            if (request.getChamberAddress() != null && !request.getChamberAddress().isBlank()) {
                appointment.setChamberAddress(request.getChamberAddress());
            }
            if (request.getDirectionsInstructions() != null && !request.getDirectionsInstructions().isBlank()) {
                appointment.setDirectionsInstructions(request.getDirectionsInstructions());
            }
        }
        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} updated chamber address for appointment {}", lawyer.getUsername(), appointmentPublicId);
        return AppointmentResponse.fromEntity(updated, lawyer.getPublicId());
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(UserPrincipal principal, String appointmentPublicId, AcceptAppointmentRequest request) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);
        boolean isLawyer = appointment.getLawyerUserPublicId().equals(principal.getPublicId());
        boolean isClient = appointment.getClientUserPublicId().equals(principal.getPublicId());
        if (!isLawyer && !isClient) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only appointment participants can reschedule.");
        }
        if (request == null || (request.getNewSlotPublicId() == null && request.getNewStartTime() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_SLOT", "New slot or time window is required for reschedule.");
        }

        SlotStatus targetStatus = "PAID".equalsIgnoreCase(appointment.getPaymentStatus()) || appointment.getAppointmentStatus() == AppointmentStatus.CONFIRMED
                ? SlotStatus.BOOKED
                : SlotStatus.PENDING;

        if (request.getNewSlotPublicId() != null && !request.getNewSlotPublicId().isBlank()) {
            AvailabilitySlot newSlot = slotRepository.findByPublicId(request.getNewSlotPublicId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND", "Reschedule slot not found."));
            if (!newSlot.getLawyerUserPublicId().equals(appointment.getLawyerUserPublicId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SLOT", "Slot must belong to the assigned counsel.");
            }
            if (newSlot.getSlotStatus() != SlotStatus.AVAILABLE && !newSlot.getPublicId().equals(appointment.getSlot().getPublicId())) {
                throw new ApiException(HttpStatus.CONFLICT, "SLOT_NOT_AVAILABLE", "Selected slot is no longer available.");
            }
            if (!newSlot.getPublicId().equals(appointment.getSlot().getPublicId())) {
                AvailabilitySlot oldSlot = appointment.getSlot();
                oldSlot.setSlotStatus(SlotStatus.AVAILABLE);
                slotRepository.save(oldSlot);

                newSlot.setSlotStatus(targetStatus);
                slotRepository.save(newSlot);
                appointment.setSlot(newSlot);
            }
        } else if (request.getNewStartTime() != null) {
            Instant start = request.getNewStartTime();
            Instant end = request.getNewEndTime() != null ? request.getNewEndTime() : start.plus(1, java.time.temporal.ChronoUnit.HOURS);
            AvailabilitySlot oldSlot = appointment.getSlot();
            oldSlot.setSlotStatus(SlotStatus.AVAILABLE);
            slotRepository.save(oldSlot);

            AvailabilitySlot customSlot = AvailabilitySlot.builder()
                    .publicId(UUID.randomUUID().toString())
                    .lawyerUserPublicId(appointment.getLawyerUserPublicId())
                    .startTime(start)
                    .endTime(end)
                    .slotStatus(targetStatus)
                    .build();
            customSlot = slotRepository.save(customSlot);
            appointment.setSlot(customSlot);
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment {} rescheduled by {}", appointmentPublicId, principal.getUsername());

        String notifyUser = isLawyer ? updated.getClientUserPublicId() : updated.getLawyerUserPublicId();
        dispatchNotification(
                notifyUser,
                "APPOINTMENT_RESCHEDULED",
                "Consultation Slot Rescheduled",
                "Consultation time has been adjusted to " + updated.getSlot().getStartTime() + (request.getRescheduleReason() != null ? ". Reason: " + request.getRescheduleReason() : ""),
                appointmentPublicId
        );

        return AppointmentResponse.fromEntity(updated, principal.getPublicId());
    }

    @Transactional
    public AppointmentResponse acceptAppointment(UserPrincipal lawyer, String appointmentPublicId) {
        return acceptAppointment(lawyer, appointmentPublicId, null);
    }

    @Transactional
    public AppointmentResponse payAppointment(UserPrincipal client, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getClientUserPublicId().equals(client.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only the assigned client can complete payment for this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.AWAITING_PAYMENT &&
            appointment.getAppointmentStatus() != AppointmentStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Payment cannot be completed for appointment with status: " + appointment.getAppointmentStatus());
        }

        BigDecimal fee = appointment.getFee() != null ? appointment.getFee() : new BigDecimal("1500.00");

        // 1. Deduct funds from Client Wallet
        deductWalletFunds(client.getPublicId(), fee, appointmentPublicId);

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.CONFIRMED);
        appointment.setPaymentStatus("PAID");
        appointment.setPaymentMethod("WALLET");
        appointment.setPaidAt(now);

        // 2. Room assignment according to Consultation Type
        if (appointment.getConsultationType() == ConsultationType.ONLINE) {
            appointment.setMeetingRoomPublicId(UUID.randomUUID().toString());
            appointment.setChatConversationPublicId("chat-" + appointment.getPublicId());
        } else if (appointment.getConsultationType() == ConsultationType.CHAT) {
            appointment.setMeetingRoomPublicId(null); // Strictly no video room
            appointment.setChatConversationPublicId("chat-" + appointment.getPublicId());
        } else if (appointment.getConsultationType() == ConsultationType.IN_PERSON) {
            appointment.setMeetingRoomPublicId(null); // Strictly no video room
            appointment.setChatConversationPublicId("chat-" + appointment.getPublicId());
            if (appointment.getChamberAddress() == null || appointment.getChamberAddress().isBlank()) {
                appointment.setChamberAddress("Advocate Chambers, High Court Complex, New Delhi - 110001");
                appointment.setDirectionsInstructions("Report to Chamber Reception 10 minutes prior with appointment reference and photo ID proof.");
            }
        }

        // 3. Mark Slot as BOOKED
        slotRepository.updateSlotStatusById(appointment.getSlot().getId(), SlotStatus.BOOKED, now);
        appointment.getSlot().setSlotStatus(SlotStatus.BOOKED);

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Client {} verified retainer payment of ₹{} for appointment {}. Mode: {}. Status updated to CONFIRMED.",
                client.getUsername(), fee, appointmentPublicId, appointment.getConsultationType());

        dispatchNotification(
                updated.getLawyerUserPublicId(),
                "APPOINTMENT_ACCEPTED",
                "Retainer Payment Verified",
                "Client " + client.getUsername() + " has completed payment for appointment #" + appointmentPublicId.substring(0, 8) + ". Consultation confirmed.",
                appointmentPublicId
        );

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

        dispatchNotification(
                updated.getClientUserPublicId(),
                "APPOINTMENT_REJECTED",
                "Appointment Request Declined",
                "Counsel was unable to accept your appointment request." + (request != null && request.getReason() != null ? " Reason: " + request.getReason() : ""),
                appointmentPublicId
        );

        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UserPrincipal principal, String appointmentPublicId, CancelAppointmentRequest request) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        boolean isClient = appointment.getClientUserPublicId().equals(principal.getPublicId());
        boolean isLawyer = appointment.getLawyerUserPublicId().equals(principal.getPublicId());
        boolean isAdmin = "PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole());

        if (!isClient && !isLawyer && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not authorized to cancel this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.PENDING &&
            appointment.getAppointmentStatus() != AppointmentStatus.AWAITING_PAYMENT &&
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
    public AppointmentResponse requestCompletion(UserPrincipal lawyer, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getLawyerUserPublicId().equals(lawyer.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only the assigned lawyer can mark this appointment as complete.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.CONFIRMED &&
            appointment.getAppointmentStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Only confirmed or in-progress appointments can be marked for completion. Current status: " + appointment.getAppointmentStatus());
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.COMPLETION_REQUESTED);
        appointment.setCompletionRequestedAt(now);
        appointment.setAutoReleaseAt(now.plus(24, ChronoUnit.HOURS));

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Lawyer {} requested completion for appointment {}. 24-hour auto-release timer initiated.",
                lawyer.getUsername(), appointmentPublicId);

        dispatchNotification(
                appointment.getClientUserPublicId(),
                "APPOINTMENT_COMPLETED",
                "Consultation Completed by Counsel",
                "Counsel has marked consultation #" + appointmentPublicId.substring(0, 8) + " as complete. Please confirm service delivery (auto-confirms in 24 hours).",
                appointmentPublicId
        );

        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse completeAppointment(UserPrincipal lawyer, String appointmentPublicId) {
        return requestCompletion(lawyer, appointmentPublicId);
    }

    @Transactional
    public AppointmentResponse confirmCompletion(UserPrincipal client, String appointmentPublicId) {
        Appointment appointment = getAppointmentOrThrow(appointmentPublicId);

        if (!appointment.getClientUserPublicId().equals(client.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only the assigned client can confirm completion for this appointment.");
        }

        if (appointment.getAppointmentStatus() != AppointmentStatus.COMPLETION_REQUESTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Completion can only be confirmed when appointment is in COMPLETION_REQUESTED status. Current status: " + appointment.getAppointmentStatus());
        }

        Instant now = Instant.now();
        appointment.setAppointmentStatus(AppointmentStatus.COMPLETED);
        appointment.setClientConfirmedAt(now);
        appointment.setCompletedAt(now);

        // Settle funds to lawyer
        BigDecimal fee = appointment.getFee() != null ? appointment.getFee() : new BigDecimal("1500.00");
        settleWalletFunds(appointment.getLawyerUserPublicId(), fee, appointmentPublicId);
        appointment.setSettledAt(now);
        appointment.setSettlementStatus("SETTLED");

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Client {} confirmed completion for appointment {}. Fee ₹{} settled to counsel.",
                client.getUsername(), appointmentPublicId, fee);

        dispatchNotification(
                appointment.getLawyerUserPublicId(),
                "APPOINTMENT_COMPLETED",
                "Consultation Confirmed & Settled",
                "Client has confirmed completion for consultation #" + appointmentPublicId.substring(0, 8) + ". Fee of ₹" + fee + " has been settled to your wallet.",
                appointmentPublicId
        );

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

        return AppointmentResponse.fromEntity(appointment, principal.getPublicId());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getClientAppointments(String clientPublicId) {
        List<Appointment> list = appointmentRepository.findByClientUserPublicIdOrderByRequestedAtDesc(clientPublicId);
        return list.stream().map(a -> AppointmentResponse.fromEntity(a, clientPublicId)).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getLawyerAppointments(String lawyerPublicId, AppointmentStatus status) {
        List<Appointment> list;
        if (status != null) {
            list = appointmentRepository.findByLawyerUserPublicIdAndAppointmentStatusOrderByRequestedAtDesc(lawyerPublicId, status);
        } else {
            list = appointmentRepository.findByLawyerUserPublicIdOrderByRequestedAtDesc(lawyerPublicId);
        }
        return list.stream().map(a -> AppointmentResponse.fromEntity(a, lawyerPublicId)).toList();
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

    @Transactional
    public int autoSettleOverdueAppointments() {
        Instant now = Instant.now();
        List<Appointment> overdue = appointmentRepository
                .findByAppointmentStatusAndAutoReleaseAtBefore(AppointmentStatus.COMPLETION_REQUESTED, now);

        int count = 0;
        for (Appointment apt : overdue) {
            try {
                apt.setAppointmentStatus(AppointmentStatus.COMPLETED);
                apt.setCompletedAt(now);
                apt.setClientConfirmedAt(now);

                BigDecimal fee = apt.getFee() != null ? apt.getFee() : new BigDecimal("1500.00");
                settleWalletFunds(apt.getLawyerUserPublicId(), fee, apt.getPublicId());
                apt.setSettledAt(now);
                apt.setSettlementStatus("SETTLED");

                appointmentRepository.save(apt);
                count++;
                log.info("Auto-confirmed overdue appointment {} after 24h client silence. Settled ₹{} to lawyer.",
                        apt.getPublicId(), fee);

                dispatchNotification(
                        apt.getLawyerUserPublicId(),
                        "APPOINTMENT_COMPLETED",
                        "Consultation Auto-Settled (24h Window)",
                        "Consultation #" + apt.getPublicId().substring(0, 8) + " has been auto-confirmed after 24 hours. Fee of ₹" + fee + " settled to your wallet.",
                        apt.getPublicId()
                );
            } catch (Exception e) {
                log.error("Failed to auto-settle appointment {}: {}", apt.getPublicId(), e.getMessage());
            }
        }
        return count;
    }

    private void deductWalletFunds(String clientUserPublicId, BigDecimal amount, String appointmentPublicId) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("clientUserPublicId", clientUserPublicId);
            req.put("amount", amount);
            req.put("appointmentPublicId", appointmentPublicId);
            req.put("description", "Retainer payment for consultation #" + appointmentPublicId.substring(0, 8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            restTemplate.postForEntity(userServiceUrl + "/api/wallet/deduct-appointment", entity, String.class);
            log.info("Successfully deducted ₹{} from wallet of client {} for appointment {}",
                    amount, clientUserPublicId, appointmentPublicId);
        } catch (HttpClientErrorException.BadRequest e) {
            String errorMsg = e.getResponseBodyAsString();
            if (errorMsg.contains("INSUFFICIENT_WALLET_BALANCE") || errorMsg.contains("Insufficient wallet balance")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_WALLET_BALANCE",
                        "Insufficient wallet balance. Please add funds to your wallet to confirm this appointment.");
            }
            throw new ApiException(HttpStatus.BAD_REQUEST, "PAYMENT_FAILED", "Failed to process wallet payment: " + e.getMessage());
        } catch (Exception e) {
            log.warn("Wallet service call skipped or unreachable ({}): {}", userServiceUrl, e.getMessage());
        }
    }

    private void settleWalletFunds(String lawyerUserPublicId, BigDecimal amount, String appointmentPublicId) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("lawyerUserPublicId", lawyerUserPublicId);
            req.put("amount", amount);
            req.put("appointmentPublicId", appointmentPublicId);
            req.put("description", "Settlement fee released for consultation #" + appointmentPublicId.substring(0, 8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            restTemplate.postForEntity(userServiceUrl + "/api/wallet/settle-appointment", entity, String.class);
            log.info("Successfully settled ₹{} to wallet of lawyer {} for appointment {}",
                    amount, lawyerUserPublicId, appointmentPublicId);
        } catch (Exception e) {
            log.warn("Wallet settlement call failed ({}): {}", userServiceUrl, e.getMessage());
        }
    }

    private void dispatchNotification(String recipientPublicId, String type, String title, String message, String relatedEntityId) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("recipientUserPublicId", recipientPublicId);
            req.put("type", type);
            req.put("title", title);
            req.put("message", message);
            req.put("relatedEntityType", "APPOINTMENT");
            req.put("relatedEntityPublicId", relatedEntityId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            restTemplate.postForEntity(notificationServiceUrl + "/api/notifications/events", entity, String.class);
        } catch (Exception e) {
            log.warn("Notification dispatch skipped or unreachable ({}): {}", notificationServiceUrl, e.getMessage());
        }
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
