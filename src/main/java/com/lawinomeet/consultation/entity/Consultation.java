package com.lawinomeet.consultation.entity;

import com.lawinomeet.consultation.enums.ConsultationMode;
import com.lawinomeet.consultation.enums.ConsultationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String meetingCode;

    private Long clientId;
    private Long lawyerId;

    private String clientName;
    private String location;
    @Column(columnDefinition = "TEXT")
    private String query;
    private LocalDateTime requestedTimeSlot;

    private String clientPhoneNumber;
    private String clientEmail;
    private Boolean isContactInfoDisclosed = false;

    @Enumerated(EnumType.STRING)
    private ConsultationMode mode;

    private Double customFee;

    private Boolean isRoomActive = false;
    private String videoRoomUrl;
    private String lawyerOfficeAddress;

    @Enumerated(EnumType.STRING)
    private ConsultationStatus status = ConsultationStatus.SUBMITTED;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime paidAt;

    // Explicit Getters and Setters for 100% Java Compilation Safety
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMeetingCode() { return meetingCode; }
    public void setMeetingCode(String meetingCode) { this.meetingCode = meetingCode; }

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

    public Boolean getIsContactInfoDisclosed() { return isContactInfoDisclosed; }
    public void setIsContactInfoDisclosed(Boolean isContactInfoDisclosed) { this.isContactInfoDisclosed = isContactInfoDisclosed; }

    public ConsultationMode getMode() { return mode; }
    public void setMode(ConsultationMode mode) { this.mode = mode; }

    public Double getCustomFee() { return customFee; }
    public void setCustomFee(Double customFee) { this.customFee = customFee; }

    public Boolean getIsRoomActive() { return isRoomActive; }
    public void setIsRoomActive(Boolean isRoomActive) { this.isRoomActive = isRoomActive; }

    public String getVideoRoomUrl() { return videoRoomUrl; }
    public void setVideoRoomUrl(String videoRoomUrl) { this.videoRoomUrl = videoRoomUrl; }

    public String getLawyerOfficeAddress() { return lawyerOfficeAddress; }
    public void setLawyerOfficeAddress(String lawyerOfficeAddress) { this.lawyerOfficeAddress = lawyerOfficeAddress; }

    public ConsultationStatus getStatus() { return status; }
    public void setStatus(ConsultationStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
