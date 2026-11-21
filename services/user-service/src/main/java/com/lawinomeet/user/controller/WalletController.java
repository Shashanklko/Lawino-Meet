package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletResponse>> getMyWallet(
            @AuthenticationPrincipal UserPrincipal principal) {
        WalletResponse response = walletService.getMyWallet(principal);
        return ResponseEntity.ok(ApiResponse.ok("Wallet details retrieved successfully", response));
    }

    @PostMapping("/add-funds")
    public ResponseEntity<ApiResponse<WalletResponse>> addFunds(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddFundsRequest request) {
        WalletResponse response = walletService.addFunds(principal, request);
        return ResponseEntity.ok(ApiResponse.ok("Funds added successfully to wallet", response));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<WalletTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WalletTransactionResponse> response = walletService.getTransactions(principal);
        return ResponseEntity.ok(ApiResponse.ok("Wallet transactions retrieved successfully", response));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WalletResponse>> withdraw(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody WithdrawFundsRequest request) {
        WalletResponse response = walletService.withdraw(principal, request);
        return ResponseEntity.ok(ApiResponse.ok("Withdrawal request processed successfully", response));
    }

    // Inter-service / Appointment settlement endpoints
    @PostMapping("/deduct-appointment")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> deductAppointment(
            @Valid @RequestBody DeductFundsRequest request) {
        WalletTransactionResponse response = walletService.deductForAppointment(request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment payment deducted from wallet", response));
    }

    @PostMapping("/settle-appointment")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> settleAppointment(
            @Valid @RequestBody SettleFundsRequest request) {
        WalletTransactionResponse response = walletService.settleToLawyer(request);
        return ResponseEntity.ok(ApiResponse.ok("Consultation fee settled to lawyer wallet", response));
    }

    @PostMapping("/refund-appointment")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> refundAppointment(
            @Valid @RequestBody RefundFundsRequest request) {
        WalletTransactionResponse response = walletService.refundForAppointment(request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment payment refunded to client wallet", response));
    }
}
