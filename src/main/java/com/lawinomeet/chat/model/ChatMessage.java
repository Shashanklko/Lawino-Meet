package com.lawinomeet.chat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.lawinomeet.chat.enums.MessageType;

import lombok.Data;

@Data
@Document(collection = "chat_messages")
public class ChatMessage {
    
    @Id
    private String id;
    private String chatSessionId;
    private Long senderId;
    private Long receiverId;
    private MessageType type;
    private String content;
    private Boolean isLocked = false;
    private java.time.LocalDateTime timestamp;
    
}
