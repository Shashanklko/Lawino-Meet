package com.lawinomeetMeetmeet.payment.entity;

import com.lawinomeetMeetmeet.payment.enums.PayoutStatus;
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
}
