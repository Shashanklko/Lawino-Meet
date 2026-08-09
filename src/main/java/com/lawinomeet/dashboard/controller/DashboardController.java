package com.lawinomeet.dashboard.controller;

import com.lawinomeet.admin.repository.DisputeTicketRepository;
import com.lawinomeet.common.response.ApiResponse;
import com.lawinomeet.consultation.service.ConsultationService;
import com.lawinomeet.payment.repository.PaymentTransactionRepository;
import com.lawinomeet.payment.repository.PayoutRequestRepository;
import com.lawinomeet.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ConsultationService consultationService;
    private final PaymentService paymentService;
    private final DisputeTicketRepository disputeTicketRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PayoutRequestRepository payoutRequestRepository;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClientDashboard(@PathVariable Long clientId) {
        Map<String, Object> map = new HashMap<>();
        map.put("consultations", consultationService.getClientConsultations(clientId));
        return ResponseEntity.ok(ApiResponse.success(map, "Client dashboard metrics retrieved."));
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLawyerDashboard(@PathVariable Long lawyerId) {
        Map<String, Object> map = new HashMap<>();
        map.put("wallet", paymentService.getLawyerWalletDetails(lawyerId));
        map.put("consultations", consultationService.getLawyerConsultations(lawyerId));
        map.put("payoutRequests", paymentService.getLawyerPayoutRequests(lawyerId));
        return ResponseEntity.ok(ApiResponse.success(map, "Lawyer dashboard metrics retrieved."));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboard() {
        Map<String, Object> map = new HashMap<>();
        map.put("totalDisputesCount", disputeTicketRepository.count());
        map.put("totalTransactionsCount", paymentTransactionRepository.count());
        map.put("pendingPayoutsCount", payoutRequestRepository.findByStatus(com.lawinomeet.payment.enums.PayoutStatus.PENDING).size());
        
        // Sum total platform service fees (20% Online / 10% Offline)
        double totalPlatformServiceFee = paymentTransactionRepository.findAll().stream()
                .filter(tx -> "SUCCESS".equalsIgnoreCase(tx.getStatus()))
                .mapToDouble(tx -> tx.getServiceFee() != null ? tx.getServiceFee() : 0.0)
                .sum();
        
        map.put("totalPlatformServiceFeesCollected", totalPlatformServiceFee);
        return ResponseEntity.ok(ApiResponse.success(map, "Admin dashboard metrics retrieved."));
    }
}
