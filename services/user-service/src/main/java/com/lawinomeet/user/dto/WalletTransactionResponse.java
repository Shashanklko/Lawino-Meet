package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.TransactionStatus;
import com.lawinomeet.user.entity.TransactionType;
import com.lawinomeet.user.entity.WalletTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransactionResponse {
    private String publicId;
    private String userPublicId;
    private BigDecimal amount;
    private TransactionType type;
    private TransactionStatus status;
    private String referenceId;
    private String description;
    private String paymentMethod;
    private BigDecimal balanceAfter;
    private Instant createdAt;

    public static WalletTransactionResponse fromEntity(WalletTransaction tx) {
        if (tx == null) return null;
        return WalletTransactionResponse.builder()
                .publicId(tx.getPublicId())
                .userPublicId(tx.getUserPublicId())
                .amount(tx.getAmount())
                .type(tx.getType())
                .status(tx.getStatus())
                .referenceId(tx.getReferenceId())
                .description(tx.getDescription())
                .paymentMethod(tx.getPaymentMethod())
                .balanceAfter(tx.getBalanceAfter())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
