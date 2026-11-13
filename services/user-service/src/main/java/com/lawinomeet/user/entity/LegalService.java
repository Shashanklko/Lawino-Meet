package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "legal_services", indexes = {
        @Index(name = "idx_legal_services_lawyer", columnList = "lawyer_profile_id"),
        @Index(name = "idx_legal_services_firm", columnList = "firm_id"),
        @Index(name = "idx_legal_services_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lawyer_profile_id")
    private LawyerProfile lawyerProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firm_id")
    private LawFirm firm;

    @Column(name = "service_name", nullable = false, length = 150)
    private String serviceName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type", nullable = false, length = 30)
    @Builder.Default
    private ConsultationType consultationType = ConsultationType.ONLINE;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
