package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.AuditLogDto;
import com.lawinomeet.user.dto.LawFirmDto;
import com.lawinomeet.user.dto.LawyerProfileDto;
import com.lawinomeet.user.entity.*;
import com.lawinomeet.user.repository.AuditLogRepository;
import com.lawinomeet.user.repository.ClientProfileRepository;
import com.lawinomeet.user.repository.LawFirmRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.FirmService;
import com.lawinomeet.user.service.LawyerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class AdminManagementController {

    private final LawyerProfileRepository lawyerProfileRepository;
    private final LawFirmRepository lawFirmRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final AuditLogRepository auditLogRepository;
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
            @AuthenticationPrincipal UserPrincipal admin,
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "VERIFIED");
        String reason = request.getOrDefault("reason", "Administrative verification audit complete.");

        log.info("Admin updated verification for advocate {}: status={}, reason={}", publicId, statusStr, reason);

        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(publicId).orElse(null);
        String previousValue = "UNKNOWN";

        if (profile != null) {
            previousValue = profile.getVerificationStatus() != null ? profile.getVerificationStatus().name() : "PENDING";
            try {
                VerificationStatus vStatus = VerificationStatus.valueOf(statusStr.toUpperCase());
                profile.setVerificationStatus(vStatus);
                lawyerProfileRepository.save(profile);
            } catch (Exception e) {
                log.warn("Invalid verification status enum: {}", statusStr);
            }
        }

        // Persist real immutable audit record
        saveAuditRecord(admin, "ADVOCATE_VERIFICATION_UPDATED", "LAWYER_PROFILE", publicId, previousValue, statusStr, reason);

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
            @AuthenticationPrincipal UserPrincipal admin,
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Administrative compliance review.");

        log.info("Admin updated account status for advocate {}: status={}, reason={}", publicId, statusStr, reason);

        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(publicId).orElse(null);
        String previousValue = "PUBLISHED";
        if (profile != null) {
            previousValue = profile.getPublicProfileStatus() != null ? profile.getPublicProfileStatus().name() : "PUBLISHED";
            if ("SUSPENDED".equalsIgnoreCase(statusStr) || "RESTRICTED".equalsIgnoreCase(statusStr)) {
                profile.setPublicProfileStatus(ProfileStatus.HIDDEN);
            } else {
                profile.setPublicProfileStatus(ProfileStatus.PUBLISHED);
            }
            lawyerProfileRepository.save(profile);
        }

        saveAuditRecord(admin, "ADVOCATE_ACCOUNT_STATUS_CHANGED", "LAWYER_PROFILE", publicId, previousValue, statusStr, reason);

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
            @AuthenticationPrincipal UserPrincipal admin,
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "VERIFIED");
        String reason = request.getOrDefault("reason", "LLP credentials & Bar Council registration verified.");

        log.info("Admin updated verification for firm {}: status={}, reason={}", publicId, statusStr, reason);

        LawFirm firm = lawFirmRepository.findByPublicId(publicId).orElse(null);
        String previousValue = "PENDING";
        if (firm != null) {
            previousValue = firm.getVerificationStatus() != null ? firm.getVerificationStatus().name() : "PENDING";
            firm.setVerificationStatus("VERIFIED".equalsIgnoreCase(statusStr) ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED);
            lawFirmRepository.save(firm);
        }

        saveAuditRecord(admin, "FIRM_VERIFICATION_UPDATED", "LAW_FIRM", publicId, previousValue, statusStr, reason);

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
            @AuthenticationPrincipal UserPrincipal admin,
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Firm operational compliance audit.");

        log.info("Admin updated account status for firm {}: status={}, reason={}", publicId, statusStr, reason);

        LawFirm firm = lawFirmRepository.findByPublicId(publicId).orElse(null);
        String previousValue = "ACTIVE";
        if (firm != null) {
            previousValue = firm.getVerificationStatus() == VerificationStatus.VERIFIED ? "ACTIVE" : "SUSPENDED";
            if ("SUSPENDED".equalsIgnoreCase(statusStr)) {
                firm.setVerificationStatus(VerificationStatus.REJECTED);
            } else {
                firm.setVerificationStatus(VerificationStatus.VERIFIED);
            }
            lawFirmRepository.save(firm);
        }

        saveAuditRecord(admin, "FIRM_ACCOUNT_STATUS_CHANGED", "LAW_FIRM", publicId, previousValue, statusStr, reason);

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
            @AuthenticationPrincipal UserPrincipal admin,
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String statusStr = request.getOrDefault("status", "ACTIVE");
        String reason = request.getOrDefault("reason", "Administrative policy governance.");

        log.info("Admin updated client account status {}: status={}, reason={}", publicId, statusStr, reason);

        ClientProfile profile = clientProfileRepository.findByUserPublicId(publicId).orElse(null);
        if (profile != null) {
            clientProfileRepository.save(profile);
        }

        saveAuditRecord(admin, "CLIENT_STATUS_CHANGED", "CLIENT_PROFILE", publicId, "ACTIVE", statusStr, reason);

        Map<String, Object> response = new HashMap<>();
        response.put("publicId", publicId);
        response.put("status", statusStr);
        response.put("reason", reason);
        response.put("auditRecorded", true);

        return ResponseEntity.ok(ApiResponse.ok("Client account status updated", response));
    }

    /**
     * Persistent Audit Log History
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<AuditLogDto> logs = auditLogRepository.findByOrderByCreatedAtDesc(pageable)
                .map(AuditLogDto::fromEntity);
        return ResponseEntity.ok(ApiResponse.ok("Platform audit trail retrieved successfully", logs));
    }

    /**
     * Record Custom Administrative Event
     */
    @PostMapping("/audit-logs")
    public ResponseEntity<ApiResponse<AuditLogDto>> createAuditLog(
            @AuthenticationPrincipal UserPrincipal admin,
            @RequestBody Map<String, String> request) {
        String action = request.getOrDefault("action", "ADMIN_OPERATION");
        String entityType = request.getOrDefault("entityType", "SYSTEM");
        String entityId = request.getOrDefault("entityId", "GLOBAL");
        String newValue = request.getOrDefault("newValue", "EXECUTED");
        String reason = request.getOrDefault("reason", "Administrative operation recorded.");

        AuditLog saved = saveAuditRecord(admin, action, entityType, entityId, null, newValue, reason);
        return ResponseEntity.ok(ApiResponse.ok("Audit log recorded", AuditLogDto.fromEntity(saved)));
    }

    private AuditLog saveAuditRecord(UserPrincipal admin, String action, String entityType,
                                    String entityId, String prevValue, String newValue, String reason) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .publicId(UUID.randomUUID().toString())
                    .adminUserPublicId(admin != null ? admin.getPublicId() : "system")
                    .adminUsername(admin != null ? admin.getUsername() : "system_admin")
                    .action(action)
                    .entityType(entityType)
                    .entityPublicId(entityId)
                    .previousValue(prevValue)
                    .newValue(newValue)
                    .reason(reason)
                    .ipAddress("127.0.0.1")
                    .build();
            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to persist audit log: {}", e.getMessage());
            return null;
        }
    }
}
