package com.lawinomeetMeetmeet.consultation.entity;

import com.lawinomeetMeetmeet.consultation.enums.ConsultationMode;
import com.lawinomeetMeetmeet.consultation.enums.ConsultationStatus;
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
    private String meetingCode; // Structured Code: e.g. SAM-SHASHI-01072006

    private Long clientId;
    private Long lawyerId;

    // Client Form Information
    private String clientName;
    private String location;
    @Column(columnDefinition = "TEXT")
    private String query;
    private LocalDateTime requestedTimeSlot;

    // Privacy Protected Contact Information (Masked prior to payment)
    private String clientPhoneNumber;
    private String clientEmail;
    private Boolean isContactInfoDisclosed = false;

    @Enumerated(EnumType.STRING)
    private ConsultationMode mode; // ONLINE_CHAT, ONLINE_VIDEO, OFFLINE_OFFICE

    private Double customFee;

    // Room Activation & Virtual/Physical Address Attributes
    private Boolean isRoomActive = false;
    private String videoRoomUrl; // Generated for ONLINE_VIDEO e.g. https://meet.jit.si/...
    private String lawyerOfficeAddress; // Dispatched for OFFLINE_OFFICE

    @Enumerated(EnumType.STRING)
    private ConsultationStatus status = ConsultationStatus.SUBMITTED;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime paidAt;
}
