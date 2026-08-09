package com.LawEZY.consultation.dto;

import com.LawEZY.consultation.enums.ConsultationMode;
import com.LawEZY.consultation.enums.ConsultationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsultationResponse {
    private Long id;
    private String meetingCode; // e.g. SAM-SHASHI-01072006
    private Long clientId;
    private Long lawyerId;

    private String clientName;
    private String location;
    private String query;
    private LocalDateTime requestedTimeSlot;

    // Contact details (Masked if not paid)
    private String clientPhoneNumber;
    private String clientEmail;
    private Boolean isContactInfoDisclosed;

    private ConsultationMode mode;
    private Double customFee;

    private Boolean isRoomActive;
    private String videoRoomUrl;
    private String lawyerOfficeAddress;

    private ConsultationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
