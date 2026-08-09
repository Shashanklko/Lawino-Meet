package com.LawEZY.admin.service;

import com.LawEZY.admin.entity.DisputeTicket;
import com.LawEZY.payment.entity.PayoutRequest;
import com.LawEZY.user.entity.ProfessionalProfile;

import java.util.List;

public interface AdminService {
    List<DisputeTicket> getAllDisputes();
    DisputeTicket resolveDispute(Long ticketId, Boolean approveRefund, String adminNotes);
    ProfessionalProfile toggleLawyerVerification(Long lawyerUserId, Boolean isVerified);
    List<PayoutRequest> getPendingPayouts();
    PayoutRequest approvePayout(Long payoutRequestId);
}
