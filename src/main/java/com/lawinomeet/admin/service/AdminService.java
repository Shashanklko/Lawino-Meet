package com.lawinomeet.admin.service;

import com.lawinomeet.admin.entity.DisputeTicket;
import com.lawinomeet.payment.entity.PayoutRequest;
import com.lawinomeet.user.entity.ProfessionalProfile;

import java.util.List;

public interface AdminService {
    List<DisputeTicket> getAllDisputes();
    DisputeTicket resolveDispute(Long ticketId, Boolean approveRefund, String adminNotes);
    ProfessionalProfile toggleLawyerVerification(Long lawyerUserId, Boolean isVerified);
    List<PayoutRequest> getPendingPayouts();
    PayoutRequest approvePayout(Long payoutRequestId);
}
