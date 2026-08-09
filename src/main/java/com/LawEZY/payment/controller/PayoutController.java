package com.LawEZY.payment.controller;

import com.LawEZY.common.response.ApiResponse;
import com.LawEZY.payment.entity.PayoutRequest;
import com.LawEZY.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payouts")
@RequiredArgsConstructor
public class PayoutController {

    private final PaymentService paymentService;

    @GetMapping("/wallet/{lawyerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWalletDetails(@PathVariable Long lawyerId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getLawyerWalletDetails(lawyerId), "Lawyer wallet breakdown retrieved."));
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<PayoutRequest>> requestPayout(@RequestParam Long lawyerId, 
                                                                     @RequestParam Double amount, 
                                                                     @RequestParam String bankDetails) {
        PayoutRequest request = paymentService.requestPayout(lawyerId, amount, bankDetails);
        return ResponseEntity.ok(ApiResponse.success(request, "Payout request submitted for Admin review."));
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<ApiResponse<List<PayoutRequest>>> getLawyerPayoutRequests(@PathVariable Long lawyerId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getLawyerPayoutRequests(lawyerId), "Lawyer payout requests retrieved."));
    }
}
