package com.lawinomeet.consultation.controller;

import com.lawinomeet.common.response.ApiResponse;
import com.lawinomeet.consultation.dto.ConsultationRequest;
import com.lawinomeet.consultation.dto.ConsultationResponse;
import com.lawinomeet.consultation.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<ConsultationResponse>> createRequest(@Valid @RequestBody ConsultationRequest request) {
        ConsultationResponse response = consultationService.createRequest(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Consultation inquiry submitted successfully. Contact details masked for privacy."));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ConsultationResponse>> approveRequest(@PathVariable Long id, @RequestParam Double customFee) {
        ConsultationResponse response = consultationService.approveRequestAndSetFee(id, customFee);
        return ResponseEntity.ok(ApiResponse.success(response, "Consultation request approved and fee set successfully."));
    }

    @PostMapping("/{id}/toggle-room")
    public ResponseEntity<ApiResponse<ConsultationResponse>> toggleRoom(@PathVariable Long id, @RequestParam Boolean isRoomActive) {
        ConsultationResponse response = consultationService.toggleRoomActive(id, isRoomActive);
        return ResponseEntity.ok(ApiResponse.success(response, "Room status updated to: " + (isRoomActive ? "ACTIVE" : "INACTIVE")));
    }

    @PostMapping("/{id}/no-show-appeal")
    public ResponseEntity<ApiResponse<ConsultationResponse>> raiseNoShowAppeal(@PathVariable Long id) {
        ConsultationResponse response = consultationService.raiseNoShowAppeal(id);
        return ResponseEntity.ok(ApiResponse.success(response, "No-show appeal submitted successfully for Admin review."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getConsultationById(id), "Consultation details retrieved."));
    }

    @GetMapping("/code/{meetingCode}")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getByCode(@PathVariable String meetingCode) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getConsultationByMeetingCode(meetingCode), "Consultation details retrieved."));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getClientConsultations(@PathVariable Long clientId) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getClientConsultations(clientId), "Client consultations retrieved."));
    }

    @GetMapping("/lawyer-inbox/{lawyerId}")
    public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getLawyerInbox(@PathVariable Long lawyerId) {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getLawyerConsultations(lawyerId), "Lawyer consultation inbox retrieved."));
    }
}
