package com.lawinomeet.consultation.service;

import com.lawinomeet.common.exception.ResourceNotFoundException;
import com.lawinomeet.common.service.AuditLogService;
import com.lawinomeet.consultation.dto.ConsultationRequest;
import com.lawinomeet.consultation.dto.ConsultationResponse;
import com.lawinomeet.consultation.entity.Consultation;
import com.lawinomeet.consultation.enums.ConsultationMode;
import com.lawinomeet.consultation.enums.ConsultationStatus;
import com.lawinomeet.consultation.repository.ConsultationRepository;
import com.lawinomeet.user.entity.User;
import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeet.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationServiceImpl.class);

    private final ConsultationRepository consultationRepository;
    private final UserRepository userRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ConsultationResponse createRequest(ConsultationRequest request) {
        User client = userRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client user not found with ID: " + request.getClientId()));
        User lawyer = userRepository.findById(request.getLawyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer user not found with ID: " + request.getLawyerId()));

        // Generate Structured Meeting Code: [CLIENT_FIRSTNAME]-[LAWYER_FIRSTNAME]-[DDMMYYYY]
        String clientFirstName = client.getFirstname() != null ? client.getFirstname().toUpperCase().replaceAll("\\s+", "") : "CLIENT";
        String lawyerFirstName = lawyer.getFirstname() != null ? lawyer.getFirstname().toUpperCase().replaceAll("\\s+", "") : "LAWYER";
        String dateStr = request.getRequestedTimeSlot().format(DateTimeFormatter.ofPattern("ddMMyyyy"));
        String meetingCode = clientFirstName + "-" + lawyerFirstName + "-" + dateStr;

        Consultation consultation = new Consultation();
        consultation.setMeetingCode(meetingCode);
        consultation.setClientId(client.getId());
        consultation.setLawyerId(lawyer.getId());
        consultation.setClientName(request.getClientName());
        consultation.setLocation(request.getLocation());
        consultation.setQuery(request.getQuery());
        consultation.setRequestedTimeSlot(request.getRequestedTimeSlot());
        
        // Contact details stored privately (Masked prior to payment)
        consultation.setClientPhoneNumber(request.getClientPhoneNumber());
        consultation.setClientEmail(request.getClientEmail());
        consultation.setIsContactInfoDisclosed(false);
        consultation.setMode(request.getMode());
        consultation.setStatus(ConsultationStatus.SUBMITTED);

        // Retrieve Lawyer Office Address if Offline mode
        if (request.getMode() == ConsultationMode.OFFLINE_OFFICE) {
            professionalProfileRepository.findByUserId(lawyer.getId()).ifPresent(prof -> {
                consultation.setLawyerOfficeAddress(prof.getOfficeAddress() != null ? prof.getOfficeAddress() : "Consultation Chambers");
            });
        }

        Consultation saved = consultationRepository.save(consultation);
        log.info("[CONSULTATION] Created Request ID: {} | Meeting Code: {}", saved.getId(), saved.getMeetingCode());
        auditLogService.logAudit("CONSULTATION_REQUEST", "Client submitted query: " + saved.getMeetingCode(), null, String.valueOf(client.getId()), "CLIENT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ConsultationResponse approveRequestAndSetFee(Long consultationId, Double customFee) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + consultationId));

        consultation.setCustomFee(customFee);
        consultation.setStatus(ConsultationStatus.LAWYER_APPROVED);
        Consultation saved = consultationRepository.save(consultation);
        log.info("[CONSULTATION] Lawyer Approved Request ID: {} | Set Fee: ₹{}", consultationId, customFee);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ConsultationResponse toggleRoomActive(Long consultationId, Boolean isRoomActive) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + consultationId));

        consultation.setIsRoomActive(isRoomActive);
        Consultation saved = consultationRepository.save(consultation);
        log.info("[CONSULTATION] Room Toggled Active: {} for Meeting Code: {}", isRoomActive, saved.getMeetingCode());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ConsultationResponse raiseNoShowAppeal(Long consultationId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + consultationId));

        // Check if 24 hours have passed since scheduled time slot
        if (LocalDateTime.now().isBefore(consultation.getRequestedTimeSlot().plusHours(24))) {
            throw new RuntimeException("No-show appeal can only be raised after 24 hours from scheduled time slot.");
        }

        if (Boolean.TRUE.equals(consultation.getIsRoomActive())) {
            throw new RuntimeException("Lawyer activated the room. No-show appeal invalid.");
        }

        consultation.setStatus(ConsultationStatus.NO_SHOW_APPEALED);
        Consultation saved = consultationRepository.save(consultation);
        auditLogService.logSecurityAlert("NO_SHOW_APPEAL", "Client raised no-show appeal for: " + saved.getMeetingCode(), null, String.valueOf(saved.getClientId()), "CLIENT");
        return mapToResponse(saved);
    }

    @Override
    public ConsultationResponse getConsultationById(Long id) {
        return mapToResponse(getEntityById(id));
    }

    @Override
    public ConsultationResponse getConsultationByMeetingCode(String meetingCode) {
        Consultation consultation = consultationRepository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found for code: " + meetingCode));
        return mapToResponse(consultation);
    }

    @Override
    public List<ConsultationResponse> getClientConsultations(Long clientId) {
        return consultationRepository.findByClientId(clientId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ConsultationResponse> getLawyerConsultations(Long lawyerId) {
        return consultationRepository.findByLawyerId(lawyerId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public Consultation getEntityById(Long id) {
        return consultationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + id));
    }

    private ConsultationResponse mapToResponse(Consultation c) {
        ConsultationResponse res = new ConsultationResponse();
        res.setId(c.getId());
        res.setMeetingCode(c.getMeetingCode());
        res.setClientId(c.getClientId());
        res.setLawyerId(c.getLawyerId());
        res.setClientName(c.getClientName());
        res.setLocation(c.getLocation());
        res.setQuery(c.getQuery());
        res.setRequestedTimeSlot(c.getRequestedTimeSlot());
        
        // Enforce Privacy Masking: Show Phone & Email ONLY after payment confirmation
        res.setIsContactInfoDisclosed(c.getIsContactInfoDisclosed());
        if (Boolean.TRUE.equals(c.getIsContactInfoDisclosed())) {
            res.setClientPhoneNumber(c.getClientPhoneNumber());
            res.setClientEmail(c.getClientEmail());
        } else {
            res.setClientPhoneNumber("XXXXX-XXXXX (Hidden until payment)");
            res.setClientEmail("xxxxxx@masked.com (Hidden until payment)");
        }

        res.setMode(c.getMode());
        res.setCustomFee(c.getCustomFee());
        res.setIsRoomActive(c.getIsRoomActive());
        res.setVideoRoomUrl(c.getVideoRoomUrl());
        res.setLawyerOfficeAddress(c.getLawyerOfficeAddress());
        res.setStatus(c.getStatus());
        res.setCreatedAt(c.getCreatedAt());
        res.setPaidAt(c.getPaidAt());
        return res;
    }
}
