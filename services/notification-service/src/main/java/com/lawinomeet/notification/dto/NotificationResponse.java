package com.lawinomeet.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lawinomeet.notification.entity.Notification;
import com.lawinomeet.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String publicId;
    private String recipientUserPublicId;
    private String recipientUsername;
    private NotificationType notificationType;
    private String title;
    private String message;
    private String referenceType;
    private String referenceId;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant readAt;
    private Instant createdAt;

    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) {
            return null;
        }
        return NotificationResponse.builder()
                .publicId(entity.getPublicId())
                .recipientUserPublicId(entity.getRecipientUserPublicId())
                .recipientUsername(entity.getRecipientUsername())
                .notificationType(entity.getNotificationType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .referenceType(entity.getReferenceType())
                .referenceId(entity.getReferenceId())
                .isRead(entity.isRead())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
