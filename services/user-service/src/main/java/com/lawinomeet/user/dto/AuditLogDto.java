package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {

    private String publicId;
    private String adminUserPublicId;
    private String adminUsername;
    private String action;
    private String entityType;
    private String entityPublicId;
    private String previousValue;
    private String newValue;
    private String reason;
    private String ipAddress;
    private Instant createdAt;

    public static AuditLogDto fromEntity(AuditLog log) {
        if (log == null) return null;
        return AuditLogDto.builder()
                .publicId(log.getPublicId())
                .adminUserPublicId(log.getAdminUserPublicId())
                .adminUsername(log.getAdminUsername())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityPublicId(log.getEntityPublicId())
                .previousValue(log.getPreviousValue())
                .newValue(log.getNewValue())
                .reason(log.getReason())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
