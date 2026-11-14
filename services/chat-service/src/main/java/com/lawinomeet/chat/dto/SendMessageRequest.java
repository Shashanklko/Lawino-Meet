package com.lawinomeet.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "Recipient user public ID is required")
    private String recipientUserPublicId;

    private String recipientUsername;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content;
}
