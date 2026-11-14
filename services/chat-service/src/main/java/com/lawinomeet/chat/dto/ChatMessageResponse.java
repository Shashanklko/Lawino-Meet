package com.lawinomeet.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lawinomeet.chat.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private String publicId;
    private String conversationPublicId;
    private String senderUserPublicId;
    private String senderUsername;
    private String recipientUserPublicId;
    private String recipientUsername;
    private String content;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant readAt;
    private Instant createdAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        if (message == null) {
            return null;
        }
        return ChatMessageResponse.builder()
                .publicId(message.getPublicId())
                .conversationPublicId(message.getConversation() != null ? message.getConversation().getPublicId() : null)
                .senderUserPublicId(message.getSenderUserPublicId())
                .senderUsername(message.getSenderUsername())
                .recipientUserPublicId(message.getRecipientUserPublicId())
                .recipientUsername(message.getRecipientUsername())
                .content(message.getContent())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
