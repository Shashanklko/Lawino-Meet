package com.LawEZY.payment.controller;

import com.LawEZY.common.response.ApiResponse;
import com.LawEZY.payment.entity.PaymentTransaction;
import com.LawEZY.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout/{consultationId}")
    public ResponseEntity<ApiResponse<PaymentTransaction>> processCheckout(@PathVariable Long consultationId) {
        PaymentTransaction transaction = paymentService.processCheckout(consultationId);
        return ResponseEntity.ok(ApiResponse.success(transaction, "Payment checkout completed. Contact info disclosed & receipt emailed."));
    }
}
