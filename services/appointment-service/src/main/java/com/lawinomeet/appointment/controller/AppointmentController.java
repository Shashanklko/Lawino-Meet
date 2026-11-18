package com.lawinomeet.appointment.controller;

import com.lawinomeet.appointment.dto.*;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.security.UserPrincipal;
import com.lawinomeet.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.bookAppointment(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Appointment requested successfully", response));
    }

    @GetMapping("/{appointmentPublicId}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.getAppointment(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Appointment details retrieved successfully", response));
    }

    @GetMapping({"/my", "/me", "/client"})
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AppointmentResponse> list = appointmentService.getClientAppointments(principal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok("Client appointments retrieved successfully", list));
    }

    @GetMapping({"/lawyer", "/lawyer/me"})
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getLawyerAppointments(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) AppointmentStatus status) {
        List<AppointmentResponse> list = appointmentService.getLawyerAppointments(principal.getPublicId(), status);
        return ResponseEntity.ok(ApiResponse.ok("Lawyer appointments retrieved successfully", list));
    }

    @GetMapping("/firm/{firmPublicId}")
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getFirmAppointments(
            @PathVariable String firmPublicId) {
        List<AppointmentResponse> list = appointmentService.getFirmAppointments(firmPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Firm appointments retrieved successfully", list));
    }

    @PatchMapping("/{appointmentPublicId}/accept")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> acceptAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId,
            @Valid @RequestBody(required = false) AcceptAppointmentRequest request) {
        AppointmentResponse response = appointmentService.acceptAppointment(principal, appointmentPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment accepted. Client notified to complete retainer payment.", response));
    }

    @PatchMapping("/{appointmentPublicId}/chamber-address")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateChamberAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId,
            @Valid @RequestBody AcceptAppointmentRequest request) {
        AppointmentResponse response = appointmentService.updateChamberAddress(principal, appointmentPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Chamber address updated successfully.", response));
    }

    @PatchMapping("/{appointmentPublicId}/reschedule")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId,
            @Valid @RequestBody AcceptAppointmentRequest request) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(principal, appointmentPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully.", response));
    }

    @PostMapping("/{appointmentPublicId}/pay")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> payAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.payAppointment(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Retainer payment verified from wallet. Consultation confirmed.", response));
    }

    @PatchMapping("/{appointmentPublicId}/pay")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> payAppointmentPatch(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.payAppointment(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Retainer payment verified from wallet. Consultation confirmed.", response));
    }

    @PatchMapping("/{appointmentPublicId}/reject")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rejectAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId,
            @Valid @RequestBody(required = false) RejectAppointmentRequest request) {
        AppointmentResponse response = appointmentService.rejectAppointment(principal, appointmentPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rejected successfully", response));
    }

    @PatchMapping("/{appointmentPublicId}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId,
            @Valid @RequestBody(required = false) CancelAppointmentRequest request) {
        AppointmentResponse response = appointmentService.cancelAppointment(principal, appointmentPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully", response));
    }

    @PatchMapping("/{appointmentPublicId}/request-completion")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> requestCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.requestCompletion(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Consultation marked completed. Client notified to confirm delivery within 24 hours.", response));
    }

    @PatchMapping("/{appointmentPublicId}/complete")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.completeAppointment(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Consultation marked completed. Client notified to confirm delivery.", response));
    }

    @PatchMapping("/{appointmentPublicId}/confirm-completion")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        AppointmentResponse response = appointmentService.confirmCompletion(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Consultation completion confirmed. Retainer fee released and settled to counsel.", response));
    }
}
