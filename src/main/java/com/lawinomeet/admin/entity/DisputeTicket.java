package com.lawinomeet.admin.entity;

import com.lawinomeet.admin.enums.DisputeStatus;
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConsultationId() { return consultationId; }
    public void setConsultationId(Long consultationId) { this.consultationId = consultationId; }

    public String getMeetingCode() { return meetingCode; }
    public void setMeetingCode(String meetingCode) { this.meetingCode = meetingCode; }

    public Long getRaisedByUserId() { return raisedByUserId; }
    public void setRaisedByUserId(Long raisedByUserId) { this.raisedByUserId = raisedByUserId; }

    public String getIssueCategory() { return issueCategory; }
    public void setIssueCategory(String issueCategory) { this.issueCategory = issueCategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public DisputeStatus getStatus() { return status; }
    public void setStatus(DisputeStatus status) { this.status = status; }

    public String getAdminResolutionNotes() { return adminResolutionNotes; }
    public void setAdminResolutionNotes(String adminResolutionNotes) { this.adminResolutionNotes = adminResolutionNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
