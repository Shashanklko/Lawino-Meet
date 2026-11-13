package com.lawinomeet.appointment.controller;

import com.lawinomeet.appointment.dto.ApiResponse;
import com.lawinomeet.appointment.dto.AvailabilitySlotResponse;
import com.lawinomeet.appointment.dto.BatchCreateSlotsRequest;
import com.lawinomeet.appointment.dto.CreateSlotRequest;
import com.lawinomeet.appointment.security.UserPrincipal;
import com.lawinomeet.appointment.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/api/availability")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<AvailabilitySlotResponse>> createSlot(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateSlotRequest request) {
        AvailabilitySlotResponse response = availabilityService.createSlot(principal.getPublicId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Availability slot created successfully", response));
    }

    @PostMapping("/api/availability/batch")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotResponse>>> batchCreateSlots(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BatchCreateSlotsRequest request) {
        List<AvailabilitySlotResponse> response = availabilityService.batchCreateSlots(principal.getPublicId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Availability slots created successfully", response));
    }

    @GetMapping("/api/availability/my")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotResponse>>> getMySlots(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate) {
        List<AvailabilitySlotResponse> slots = availabilityService.getMySlots(principal.getPublicId(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok("Availability slots retrieved successfully", slots));
    }

    @DeleteMapping("/api/availability/{slotPublicId}")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slotPublicId) {
        availabilityService.deleteSlot(principal.getPublicId(), slotPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Availability slot deleted successfully", null));
    }

    @GetMapping("/api/lawyers/{lawyerPublicId}/slots")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotResponse>>> getLawyerAvailableSlots(
            @PathVariable String lawyerPublicId) {
        List<AvailabilitySlotResponse> slots = availabilityService.getAvailableSlotsForLawyer(lawyerPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Lawyer available slots retrieved successfully", slots));
    }
}
