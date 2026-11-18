package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "wallets",
    indexes = {
        @Index(name = "idx_wallet_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_wallet_user", columnList = "user_public_id", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "user_public_id", nullable = false, unique = true, length = 36)
    private String userPublicId;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "user_role", nullable = false, length = 30)
    private String userRole;

    @Column(name = "balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "escrow_balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal escrowBalance = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID().toString();
        }
        if (this.balance == null) {
            this.balance = BigDecimal.ZERO;
        }
        if (this.escrowBalance == null) {
            this.escrowBalance = BigDecimal.ZERO;
        }
        if (this.currency == null) {
            this.currency = "INR";
        }
    }
}
