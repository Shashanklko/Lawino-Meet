package com.jurisone.admin.controller;

import com.jurisone.admin.entity.DisputeTicket;
import com.jurisone.admin.service.AdminService;
import com.jurisone.common.response.ApiResponse;
import com.jurisone.payment.entity.PayoutRequest;
import com.jurisone.user.entity.ProfessionalProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/disputes")
    public ResponseEntity<ApiResponse<List<DisputeTicket>>> getAllDisputes() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllDisputes(), "Dispute tickets retrieved."));
    }

    @PostMapping("/disputes/{id}/resolve")
    public ResponseEntity<ApiResponse<DisputeTicket>> resolveDispute(@PathVariable Long id, 
                                                                      @RequestParam Boolean approveRefund, 
                                                                      @RequestParam String adminNotes) {
        DisputeTicket ticket = adminService.resolveDispute(id, approveRefund, adminNotes);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Dispute ticket resolved successfully."));
    }

    @PutMapping("/users/{lawyerUserId}/verify")
    public ResponseEntity<ApiResponse<ProfessionalProfile>> toggleVerification(@PathVariable Long lawyerUserId, 
                                                                                @RequestParam Boolean isVerified) {
        ProfessionalProfile profile = adminService.toggleLawyerVerification(lawyerUserId, isVerified);
        return ResponseEntity.ok(ApiResponse.success(profile, "Lawyer verification status updated."));
    }

    @GetMapping("/payouts/pending")
    public ResponseEntity<ApiResponse<List<PayoutRequest>>> getPendingPayouts() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingPayouts(), "Pending payout requests retrieved."));
    }

    @PostMapping("/payouts/{id}/approve")
    public ResponseEntity<ApiResponse<PayoutRequest>> approvePayout(@PathVariable Long id) {
        PayoutRequest request = adminService.approvePayout(id);
        return ResponseEntity.ok(ApiResponse.success(request, "Payout request approved and wallet balance updated."));
    }
}
