package com.lawinomeet.chat.dto;

import org.springframework.data.annotation.Id;

import com.lawinomeet.chat.enums.ChatStatus;
import com.lawinomeet.chat.enums.MessageType;

import lombok.Data;

@Data
public class ChatMessageResponse {
    
    private String id;
    private String chatSessionId;
    private Long senderId;
    private Long receiverId;
    private MessageType type;
    private String content;
    private Boolean isLocked = false;
    private java.time.LocalDateTime timestamp;
    private ChatStatus status;
}
