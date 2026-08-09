package com.jurisone.payment.entity;

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
}
