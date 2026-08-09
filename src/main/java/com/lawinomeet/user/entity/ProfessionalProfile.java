package com.lawinomeet.user.entity;

import com.lawinomeet.user.enums.Role;
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

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Role getCategory() { return category; }
    public void setCategory(Role category) { this.category = category; }

    public String getCustomGreeting() { return customGreeting; }
    public void setCustomGreeting(String customGreeting) { this.customGreeting = customGreeting; }

    public String getOfficeAddress() { return officeAddress; }
    public void setOfficeAddress(String officeAddress) { this.officeAddress = officeAddress; }

    public Double getChatUnlockFee() { return chatUnlockFee; }
    public void setChatUnlockFee(Double chatUnlockFee) { this.chatUnlockFee = chatUnlockFee; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

    public Double getOnlineEarnings() { return onlineEarnings; }
    public void setOnlineEarnings(Double onlineEarnings) { this.onlineEarnings = onlineEarnings; }

    public Double getOfflineEarnings() { return offlineEarnings; }
    public void setOfflineEarnings(Double offlineEarnings) { this.offlineEarnings = offlineEarnings; }

    public Double getWalletBalance() { return walletBalance; }
    public void setWalletBalance(Double walletBalance) { this.walletBalance = walletBalance; }

    public Double getTotalWithdrawn() { return totalWithdrawn; }
    public void setTotalWithdrawn(Double totalWithdrawn) { this.totalWithdrawn = totalWithdrawn; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
