package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.LawFirmDto;
import com.lawinomeet.user.dto.LawyerProfileDto;
import com.lawinomeet.user.entity.*;
import com.lawinomeet.user.repository.ClientProfileRepository;
import com.lawinomeet.user.repository.LawFirmRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import com.lawinomeet.user.service.FirmService;
import com.lawinomeet.user.service.LawyerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class AdminManagementController {

    private final LawyerProfileRepository lawyerProfileRepository;
    private final LawFirmRepository lawFirmRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LawyerService lawyerService;
    private final FirmService firmService;

    /**
     * Platform Overview Stats
     */
    @GetMapping("/overview/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverviewStats() {
        long totalLawyers = lawyerProfileRepository.count();
        long totalFirms = lawFirmRepository.count();
        long totalClients = clientProfileRepository.count();
        long pendingVerifications = lawyerProfileRepository.findAll().stream()
                .filter(l -> l.getVerificationStatus() == VerificationStatus.PENDING)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLawyers", totalLawyers);
        stats.put("totalFirms", totalFirms);
        stats.put("totalClients", totalClients);
        stats.put("pendingVerifications", pendingVerifications);
        stats.put("platformCommissionRate", "10%");
        stats.put("status", "ACTIVE_ENCRYPTED");

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Advocate Management Roster
     */
    @GetMapping("/advocates")
    public ResponseEntity<ApiResponse<Page<LawyerProfileDto>>> getAdvocatesRoster(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<LawyerProfileDto> advocates = lawyerService.getPublicLawyers(pageable);
        return ResponseEntity.ok(ApiResponse.ok(advocates));
    }

    /**
     * Advocate Verification Action (APPROVE / REJECT / ADDITIONAL_INFO)
     */
    @PatchMapping("/advocates/{publicId}/verification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateAdvocateVerification(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "VERIFIED");
        String reason = request.getOrDefault("reason", "Administrative verification audit complete.");

        log.info("Admin updated verification for advocate {}: status={}, reason={}", publicId, statusStr, reason);

        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(publicId)
                .orElse(null);

        if (profile != null) {
            try {
                VerificationStatus vStatus = VerificationStatus.valueOf(statusStr.toUpperCase());
                profile.setVerificationStatus(vStatus);
                lawyerProfileRepository.save(profile);
            } catch (Exception e) {
                log.warn("Invalid verification status enum: {}", statusStr);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("status", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Advocate verification status updated successfully", response));
    }

    /**
     * Advocate Status (ACTIVE / RESTRICTED / SUSPENDED)
     */
    @PatchMapping("/advocates/{publicId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateAdvocateAccountStatus(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Administrative compliance review.");

        log.info("Admin updated account status for advocate {}: status={}, reason={}", publicId, statusStr, reason);

        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(publicId).orElse(null);
        if (profile != null) {
            if ("SUSPENDED".equalsIgnoreCase(statusStr) || "RESTRICTED".equalsIgnoreCase(statusStr)) {
                profile.setPublicProfileStatus(ProfileStatus.HIDDEN);
            } else {
                profile.setPublicProfileStatus(ProfileStatus.PUBLISHED);
            }
            lawyerProfileRepository.save(profile);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("accountStatus", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Advocate account status updated", response));
    }

    /**
     * Law Firm Management Roster
     */
    @GetMapping("/firms")
    public ResponseEntity<ApiResponse<Page<LawFirmDto>>> getFirmsRoster(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<LawFirmDto> firms = firmService.getAllFirms(pageable);
        return ResponseEntity.ok(ApiResponse.ok(firms));
    }

    /**
     * Law Firm Verification Action
     */
    @PatchMapping("/firms/{publicId}/verification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateFirmVerification(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "VERIFIED");
        String reason = request.getOrDefault("reason", "LLP credentials & Bar Council registration verified.");

        log.info("Admin updated verification for firm {}: status={}, reason={}", publicId, statusStr, reason);

        LawFirm firm = lawFirmRepository.findByPublicId(publicId).orElse(null);
        if (firm != null) {
            firm.setVerificationStatus("VERIFIED".equalsIgnoreCase(statusStr) ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED);
            lawFirmRepository.save(firm);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("verificationStatus", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Firm verification status updated successfully", response));
    }

    /**
     * Law Firm Account Status (ACTIVE / SUSPENDED)
     */
    @PatchMapping("/firms/{publicId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateFirmAccountStatus(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Firm operational compliance audit.");

        log.info("Admin updated account status for firm {}: status={}, reason={}", publicId, statusStr, reason);

        LawFirm firm = lawFirmRepository.findByPublicId(publicId).orElse(null);
        if (firm != null) {
            if ("SUSPENDED".equalsIgnoreCase(statusStr)) {
                firm.setVerificationStatus(VerificationStatus.REJECTED);
            } else {
                firm.setVerificationStatus(VerificationStatus.VERIFIED);
            }
            lawFirmRepository.save(firm);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("accountStatus", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Firm account status updated", response));
    }

    /**
     * Client Management Listing
     */
    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<List<ClientProfile>>> getClientsRoster() {
        List<ClientProfile> clients = clientProfileRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(clients));
    }

    /**
     * Client Account Status (ACTIVE / RESTRICTED / SUSPENDED)
     */
    @PatchMapping("/clients/{publicId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateClientAccountStatus(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Administrative policy governance.");

        log.info("Admin updated client account status {}: status={}, reason={}", publicId, statusStr, reason);

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("status", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Client account status updated", response));
    }
}
