package com.lawinomeet.chat.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.lawinomeet.chat.enums.ChatStatus;

import lombok.Data;

@Data
@Document(collection = "chat_sessions")
public class ChatSession {
    @Id
    private String id;
    
    private Long userId;
    private Long professionalId;
    private ChatStatus status;
    private Integer tokensGranted;
    private Integer tokensConsumed;
    private Boolean professionalEndedChat;
    private Boolean isAppointmentPaid = false; // Tracks if an official appointment has been booked and paid
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdateAt;
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getProfessionalId() { return professionalId; }
    public void setProfessionalId(Long professionalId) { this.professionalId = professionalId; }

    public ChatStatus getStatus() { return status; }
    public void setStatus(ChatStatus status) { this.status = status; }

    public Integer getTokensGranted() { return tokensGranted; }
    public void setTokensGranted(Integer tokensGranted) { this.tokensGranted = tokensGranted; }

    public Integer getTokensConsumed() { return tokensConsumed; }
    public void setTokensConsumed(Integer tokensConsumed) { this.tokensConsumed = tokensConsumed; }

    public Boolean getProfessionalEndedChat() { return professionalEndedChat; }
    public void setProfessionalEndedChat(Boolean professionalEndedChat) { this.professionalEndedChat = professionalEndedChat; }

    public Boolean getIsAppointmentPaid() { return isAppointmentPaid; }
    public void setIsAppointmentPaid(Boolean isAppointmentPaid) { this.isAppointmentPaid = isAppointmentPaid; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUpdateAt() { return lastUpdateAt; }
    public void setLastUpdateAt(LocalDateTime lastUpdateAt) { this.lastUpdateAt = lastUpdateAt; }
}
