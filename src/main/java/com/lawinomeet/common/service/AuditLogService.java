package com.lawinomeet.common.service;

import com.lawinomeet.common.entity.AuditLog;
import com.lawinomeet.common.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(String eventType, String summary, String details, String userId, String userRole) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setTimestamp(LocalDateTime.now());
            logEntry.setEventType(eventType != null ? eventType : "AUDIT_EVENT");
            logEntry.setSummary(summary != null ? summary : "Audit Event");
            logEntry.setDetails(details != null ? details : "");
            logEntry.setUserId(userId);
            logEntry.setUserRole(userRole != null ? userRole : "USER");

            auditLogRepository.save(logEntry);
            log.info("[AUDIT LOG] {}: {}", eventType, summary);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCriticalError(String summary, String details) {
        logAudit("CRITICAL_ERROR", summary, details, "SYSTEM", "SYSTEM");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSecurityAlert(String summary, String details, String ipAddress, String userId, String userRole) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setTimestamp(LocalDateTime.now());
            logEntry.setEventType("SECURITY_ALERT");
            logEntry.setSummary(summary);
            logEntry.setDetails(details);
            logEntry.setIpAddress(ipAddress);
            logEntry.setUserId(userId);
            logEntry.setUserRole(userRole);

            auditLogRepository.save(logEntry);
            log.info("SECURITY ALERT SAVED: {}", summary);
        } catch (Exception e) {
            log.error("FAILED TO SAVE SECURITY ALERT: {}", e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAiBlock(String prompt, String violationDetails, String ipAddress, String userId) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setTimestamp(LocalDateTime.now());
            logEntry.setEventType("SECURITY_BLOCK");
            logEntry.setSummary("Blocked policy violation: " + prompt);
            logEntry.setDetails(violationDetails);
            logEntry.setIpAddress(ipAddress);
            logEntry.setUserId(userId);

            auditLogRepository.save(logEntry);
            log.warn("SECURITY BLOCK AUDITED: {}", prompt);
        } catch (Exception e) {
            log.error("FAILED TO SAVE BLOCK AUDIT: {}", e.getMessage(), e);
        }
    }
}
