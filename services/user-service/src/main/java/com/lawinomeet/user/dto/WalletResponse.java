package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.Wallet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private String publicId;
    private String userPublicId;
    private String username;
    private String userRole;
    private BigDecimal balance;
    private BigDecimal escrowBalance;
    private String currency;
    private List<WalletTransactionResponse> recentTransactions;
    private Instant updatedAt;

    public static WalletResponse fromEntity(Wallet wallet, List<WalletTransactionResponse> transactions) {
        if (wallet == null) return null;
        return WalletResponse.builder()
                .publicId(wallet.getPublicId())
                .userPublicId(wallet.getUserPublicId())
                .username(wallet.getUsername())
                .userRole(wallet.getUserRole())
                .balance(wallet.getBalance())
                .escrowBalance(wallet.getEscrowBalance())
                .currency(wallet.getCurrency())
                .recentTransactions(transactions)
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
