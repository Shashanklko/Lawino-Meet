package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.LawyerService;
import com.lawinomeet.user.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/lawyers")
@RequiredArgsConstructor
public class LawyerController {

    private final LawyerService lawyerService;
    private final StorageService storageService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LawyerProfileDto>>> getPublicLawyers(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LawyerProfileDto> lawyers = lawyerService.getPublicLawyers(pageable);
        return ResponseEntity.ok(ApiResponse.ok(lawyers));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<ApiResponse<LawyerProfileDto>> getLawyerProfile(
            @PathVariable String identifier) {
        LawyerProfileDto profile = lawyerService.getLawyerPublicProfile(identifier);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/{identifier}/services")
    public ResponseEntity<ApiResponse<java.util.List<LegalServiceDto>>> getLawyerServices(
            @PathVariable String identifier) {
        java.util.List<LegalServiceDto> services = lawyerService.getLawyerServices(identifier);
        return ResponseEntity.ok(ApiResponse.ok(services));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<LawyerProfileDto>> getMyLawyerProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        LawyerProfileDto profile = lawyerService.getOrCreateMyProfile(principal.getPublicId(), principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping({"/profile", "/me"})
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<LawyerProfileDto>> updateMyLawyerProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateLawyerProfileRequest request) {
        LawyerProfileDto updated = lawyerService.updateMyProfile(principal.getPublicId(), principal.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Professional profile updated successfully", updated));
    }

    @PostMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePhoto(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = storageService.storeProfilePhoto(file, principal.getPublicId());
        lawyerService.updateProfilePhoto(principal.getPublicId(), url);
        return ResponseEntity.ok(ApiResponse.ok("Profile photo uploaded successfully", Map.of("profileImageUrl", url)));
    }

    @PatchMapping("/messaging-setting")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleMessaging(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam boolean enabled) {
        boolean result = lawyerService.toggleMessaging(principal.getPublicId(), enabled);
        return ResponseEntity.ok(ApiResponse.ok("Messaging preference updated", Map.of(
                "messagingEnabled", result
        )));
    }

    @PostMapping("/services")
    @PreAuthorize("hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<LegalServiceDto>> addLegalService(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLegalServiceRequest request) {
        LegalServiceDto service = lawyerService.addLegalService(principal.getPublicId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Legal consultation service added", service));
    }
}
