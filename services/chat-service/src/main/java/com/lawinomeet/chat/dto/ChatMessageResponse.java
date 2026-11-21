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
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
    private Long attachmentSize;
    private String messageType;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant readAt;
    private Instant createdAt;

    private String replyToMessagePublicId;
    private String replyToSenderName;
    private String replyToContent;

    private boolean deletedForEveryone;
    private boolean deletedForMe;

    public static ChatMessageResponse fromEntity(ChatMessage message, String currentUserPublicId) {
        if (message == null) {
            return null;
        }
        boolean isDelEveryone = message.isDeletedForEveryone();
        boolean isDelMe = currentUserPublicId != null &&
                message.getDeletedForUserIds() != null &&
                java.util.Arrays.asList(message.getDeletedForUserIds().split(",")).contains(currentUserPublicId);

        String effectiveContent = isDelEveryone ? "This message was deleted" : message.getContent();
        String effectiveAttachmentUrl = isDelEveryone ? null : message.getAttachmentUrl();
        String effectiveAttachmentName = isDelEveryone ? null : message.getAttachmentName();
        String effectiveAttachmentType = isDelEveryone ? null : message.getAttachmentType();
        Long effectiveAttachmentSize = isDelEveryone ? null : message.getAttachmentSize();

        return ChatMessageResponse.builder()
                .publicId(message.getPublicId())
                .conversationPublicId(message.getConversation() != null ? message.getConversation().getPublicId() : null)
                .senderUserPublicId(message.getSenderUserPublicId())
                .senderUsername(message.getSenderUsername())
                .recipientUserPublicId(message.getRecipientUserPublicId())
                .recipientUsername(message.getRecipientUsername())
                .content(effectiveContent)
                .attachmentUrl(effectiveAttachmentUrl)
                .attachmentName(effectiveAttachmentName)
                .attachmentType(effectiveAttachmentType)
                .attachmentSize(effectiveAttachmentSize)
                .messageType(isDelEveryone ? "DELETED" : message.getMessageType())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .replyToMessagePublicId(message.getReplyToMessagePublicId())
                .replyToSenderName(message.getReplyToSenderName())
                .replyToContent(message.getReplyToContent())
                .deletedForEveryone(isDelEveryone)
                .deletedForMe(isDelMe)
                .build();
    }

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        return fromEntity(message, null);
    }
}
