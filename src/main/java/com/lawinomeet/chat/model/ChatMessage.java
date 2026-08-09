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
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getChatSessionId() { return chatSessionId; }
    public void setChatSessionId(String chatSessionId) { this.chatSessionId = chatSessionId; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Boolean getIsLocked() { return isLocked; }
    public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }

    public java.time.LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(java.time.LocalDateTime timestamp) { this.timestamp = timestamp; }
}
