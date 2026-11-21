package com.lawinomeet.chat.dto;

import com.lawinomeet.chat.entity.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private String publicId;
    private String appointmentPublicId;
    private String otherParticipantPublicId;
    private String otherParticipantUsername;
    private String lastMessageContent;
    private Instant lastMessageAt;
    private long unreadMessagesCount;
    private boolean isClosed;

    public static ConversationResponse fromEntity(Conversation conv, String currentUserId, long unreadCount) {
        if (conv == null) {
            return null;
        }
        return ConversationResponse.builder()
                .publicId(conv.getPublicId())
                .appointmentPublicId(conv.getAppointmentPublicId())
                .otherParticipantPublicId(conv.getOtherParticipantPublicId(currentUserId))
                .otherParticipantUsername(conv.getOtherParticipantUsername(currentUserId))
                .lastMessageContent(conv.getLastMessageContent())
                .lastMessageAt(conv.getLastMessageAt())
                .unreadMessagesCount(unreadCount)
                .isClosed(conv.isClosed())
                .build();
    }
}
