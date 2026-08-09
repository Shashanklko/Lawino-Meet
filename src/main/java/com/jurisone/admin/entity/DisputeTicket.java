package com.jurisone.admin.entity;

import com.jurisone.admin.enums.DisputeStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisputeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long consultationId;
    private String meetingCode; // e.g. SAM-SHASHI-01072006
    private Long raisedByUserId;

    private String issueCategory; // NO_SHOW_4HR, VIDEO_FAILED, PAYMENT_ERROR
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String adminResolutionNotes;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;
}
