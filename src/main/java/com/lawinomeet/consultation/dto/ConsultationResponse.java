package com.lawinomeet.consultation.dto;

import com.lawinomeet.consultation.enums.ConsultationMode;
import com.lawinomeet.consultation.enums.ConsultationStatus;
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

    // Explicit Getters/Setters for Boolean and Contact fields
    public Boolean getIsContactInfoDisclosed() { return isContactInfoDisclosed; }
    public void setIsContactInfoDisclosed(Boolean isContactInfoDisclosed) { this.isContactInfoDisclosed = isContactInfoDisclosed; }

    public String getClientPhoneNumber() { return clientPhoneNumber; }
    public void setClientPhoneNumber(String clientPhoneNumber) { this.clientPhoneNumber = clientPhoneNumber; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public Boolean getIsRoomActive() { return isRoomActive; }
    public void setIsRoomActive(Boolean isRoomActive) { this.isRoomActive = isRoomActive; }
}
