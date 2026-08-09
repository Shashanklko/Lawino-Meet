package com.lawinomeet.payment.entity;

import com.lawinomeet.payment.enums.PayoutStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payout_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lawyerId;
    private Double requestedAmount;
    private String bankAccountDetails;

    @Enumerated(EnumType.STRING)
    private PayoutStatus status = PayoutStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime processedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLawyerId() { return lawyerId; }
    public void setLawyerId(Long lawyerId) { this.lawyerId = lawyerId; }

    public Double getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(Double requestedAmount) { this.requestedAmount = requestedAmount; }

    public String getBankAccountDetails() { return bankAccountDetails; }
    public void setBankAccountDetails(String bankAccountDetails) { this.bankAccountDetails = bankAccountDetails; }

    public PayoutStatus getStatus() { return status; }
    public void setStatus(PayoutStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}
