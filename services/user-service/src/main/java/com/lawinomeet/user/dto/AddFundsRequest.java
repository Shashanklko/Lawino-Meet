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
public class AddFundsRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum deposit amount is ₹1.00")
    private BigDecimal amount;

    private String paymentMethod; // RAZORPAY, UPI, CARD, NETBANKING
    private String transactionReference;
}
