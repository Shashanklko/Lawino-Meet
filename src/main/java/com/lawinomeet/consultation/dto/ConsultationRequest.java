package com.lawinomeet.consultation.dto;

import com.lawinomeet.consultation.enums.ConsultationMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsultationRequest {
    @NotNull
    private Long clientId;
    @NotNull
    private Long lawyerId;

    @NotBlank
    private String clientName;
    @NotBlank
    private String location;
    @NotBlank
    private String query;
    @NotNull
    private LocalDateTime requestedTimeSlot;

    @NotBlank
    private String clientPhoneNumber;
    @NotBlank
    private String clientEmail;

    @NotNull
    private ConsultationMode mode; // ONLINE_CHAT, ONLINE_VIDEO, OFFLINE_OFFICE

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getLawyerId() { return lawyerId; }
    public void setLawyerId(Long lawyerId) { this.lawyerId = lawyerId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public LocalDateTime getRequestedTimeSlot() { return requestedTimeSlot; }
    public void setRequestedTimeSlot(LocalDateTime requestedTimeSlot) { this.requestedTimeSlot = requestedTimeSlot; }

    public String getClientPhoneNumber() { return clientPhoneNumber; }
    public void setClientPhoneNumber(String clientPhoneNumber) { this.clientPhoneNumber = clientPhoneNumber; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public ConsultationMode getMode() { return mode; }
    public void setMode(ConsultationMode mode) { this.mode = mode; }
}
