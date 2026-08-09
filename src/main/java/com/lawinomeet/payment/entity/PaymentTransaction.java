package com.lawinomeet.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long consultationId;
    private String meetingCode; // e.g. SAM-SHASHI-01072006
    private String earningType; // ONLINE_CHAT, ONLINE_VIDEO, OFFLINE_OFFICE

    private Long clientId;
    private Long lawyerId;

    private Double totalAmount;
    private Double lawyerShare; // 80% for Online, 90% for Offline
    private Double serviceFee;  // 20% for Online, 10% for Offline

    private String status = "SUCCESS"; // SUCCESS, REFUNDED
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConsultationId() { return consultationId; }
    public void setConsultationId(Long consultationId) { this.consultationId = consultationId; }

    public String getMeetingCode() { return meetingCode; }
    public void setMeetingCode(String meetingCode) { this.meetingCode = meetingCode; }

    public String getEarningType() { return earningType; }
    public void setEarningType(String earningType) { this.earningType = earningType; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getLawyerId() { return lawyerId; }
    public void setLawyerId(Long lawyerId) { this.lawyerId = lawyerId; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getLawyerShare() { return lawyerShare; }
    public void setLawyerShare(Double lawyerShare) { this.lawyerShare = lawyerShare; }

    public Double getServiceFee() { return serviceFee; }
    public void setServiceFee(Double serviceFee) { this.serviceFee = serviceFee; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
