package com.jurisone.admin.service;

import com.jurisone.admin.entity.DisputeTicket;
import com.jurisone.payment.entity.PayoutRequest;
import com.jurisone.user.entity.ProfessionalProfile;

import java.util.List;

public interface AdminService {
    List<DisputeTicket> getAllDisputes();
    DisputeTicket resolveDispute(Long ticketId, Boolean approveRefund, String adminNotes);
    ProfessionalProfile toggleLawyerVerification(Long lawyerUserId, Boolean isVerified);
    List<PayoutRequest> getPendingPayouts();
    PayoutRequest approvePayout(Long payoutRequestId);
}
