package com.jurisone.consultation.dto;

import com.jurisone.consultation.enums.ConsultationMode;
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
}
