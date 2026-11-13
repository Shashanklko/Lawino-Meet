package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.FirmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/firms")
@RequiredArgsConstructor
public class FirmController {

    private final FirmService firmService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LawFirmDto>>> getAllFirms(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LawFirmDto> firms = firmService.getAllFirms(pageable);
        return ResponseEntity.ok(ApiResponse.ok(firms));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<ApiResponse<LawFirmDto>> getFirmDetails(
            @PathVariable String identifier) {
        LawFirmDto firm = firmService.getFirmDetails(identifier);
        return ResponseEntity.ok(ApiResponse.ok(firm));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<LawFirmDto>> createFirm(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLawFirmRequest request) {
        LawFirmDto firm = firmService.createFirm(principal.getPublicId(), request);
        return new ResponseEntity<>(ApiResponse.ok("Law firm registered successfully", firm), HttpStatus.CREATED);
    }

    @PutMapping("/{firmPublicId}")
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<LawFirmDto>> updateFirm(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String firmPublicId,
            @Valid @RequestBody UpdateLawFirmRequest request) {
        LawFirmDto firm = firmService.updateFirm(principal.getPublicId(), firmPublicId, request);
        return ResponseEntity.ok(ApiResponse.ok("Firm profile updated successfully", firm));
    }

    @PostMapping("/{firmPublicId}/members/invitations")
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<FirmMemberDto>> inviteLawyer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String firmPublicId,
            @Valid @RequestBody InviteMemberRequest request) {
        FirmMemberDto member = firmService.inviteLawyer(principal.getPublicId(), firmPublicId, request);
        return new ResponseEntity<>(ApiResponse.ok("Invitation sent to lawyer", member), HttpStatus.CREATED);
    }

    @PatchMapping("/members/{invitationId}/accept")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<FirmMemberDto>> acceptInvitation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long invitationId) {
        FirmMemberDto member = firmService.acceptInvitation(principal.getPublicId(), invitationId);
        return ResponseEntity.ok(ApiResponse.ok("Firm membership invitation accepted", member));
    }

    @PatchMapping("/members/{invitationId}/reject")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<FirmMemberDto>> rejectInvitation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long invitationId) {
        FirmMemberDto member = firmService.rejectInvitation(principal.getPublicId(), invitationId);
        return ResponseEntity.ok(ApiResponse.ok("Firm membership invitation rejected", member));
    }

    @DeleteMapping("/{firmPublicId}/members/{memberId}")
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String firmPublicId,
            @PathVariable Long memberId) {
        firmService.deactivateMember(principal.getPublicId(), firmPublicId, memberId);
        return ResponseEntity.ok(ApiResponse.ok("Firm member deactivated", null));
    }

    @PostMapping("/{firmPublicId}/services")
    @PreAuthorize("hasAnyRole('FIRM_ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<LegalServiceDto>> addFirmService(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String firmPublicId,
            @Valid @RequestBody CreateLegalServiceRequest request) {
        LegalServiceDto service = firmService.addFirmService(principal.getPublicId(), firmPublicId, request);
        return new ResponseEntity<>(ApiResponse.ok("Firm consultation service created", service), HttpStatus.CREATED);
    }
}
