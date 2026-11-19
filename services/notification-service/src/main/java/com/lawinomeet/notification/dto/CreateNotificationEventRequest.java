package com.lawinomeet.notification.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.lawinomeet.notification.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationEventRequest {

    @NotBlank(message = "Recipient user public ID is required")
    private String recipientUserPublicId;

    private String recipientUsername;

    @NotNull(message = "Notification type is required")
    @JsonAlias({"type"})
    private NotificationType notificationType;

    @NotBlank(message = "Notification title is required")
    private String title;

    @NotBlank(message = "Notification message is required")
    private String message;

    @JsonAlias({"relatedEntityType"})
    private String referenceType;

    @JsonAlias({"relatedEntityPublicId"})
    private String referenceId;
}
