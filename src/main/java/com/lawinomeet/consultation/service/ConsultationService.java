package com.lawinomeet.consultation.service;

import com.lawinomeet.consultation.dto.ConsultationRequest;
import com.lawinomeet.consultation.dto.ConsultationResponse;
import com.lawinomeet.consultation.entity.Consultation;

import java.util.List;

public interface ConsultationService {
    ConsultationResponse createRequest(ConsultationRequest request);
    ConsultationResponse approveRequestAndSetFee(Long consultationId, Double customFee);
    ConsultationResponse toggleRoomActive(Long consultationId, Boolean isRoomActive);
    ConsultationResponse raiseNoShowAppeal(Long consultationId);
    ConsultationResponse getConsultationById(Long id);
    ConsultationResponse getConsultationByMeetingCode(String meetingCode);
    List<ConsultationResponse> getClientConsultations(Long clientId);
    List<ConsultationResponse> getLawyerConsultations(Long lawyerId);
    Consultation getEntityById(Long id);
}
