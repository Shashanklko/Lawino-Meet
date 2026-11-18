package com.lawinomeet.user.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawFundsRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100.00", message = "Minimum withdrawal amount is ₹100.00")
    private BigDecimal amount;

    private String payoutMethod; // BANK, UPI
    private String accountHolder;
    private String accountNumber;
    private String ifsc;
    private String upiId;
}
