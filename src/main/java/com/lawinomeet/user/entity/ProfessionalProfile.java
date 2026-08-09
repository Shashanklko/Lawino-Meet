package com.lawinomeetMeetmeet.user.entity;

import com.lawinomeetMeetmeet.user.enums.Role;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private Role category; // LAWYER, CA, or OTHER

    private String customGreeting;
    private String officeAddress;
    private Double chatUnlockFee = 99.0;
    private Double consultationFee = 499.0;
    
    // Categorized Earnings & Digital Wallet Balance
    private Double onlineEarnings = 0.0;
    private Double offlineEarnings = 0.0;
    private Double walletBalance = 0.0;
    private Double totalWithdrawn = 0.0;
    
    private Boolean isVerified = false;
    private String specialization;
    private String bio;
}
