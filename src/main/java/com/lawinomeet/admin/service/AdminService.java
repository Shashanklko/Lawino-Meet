package com.lawinomeetMeetmeet.admin.service;

import com.lawinomeetMeetmeet.admin.entity.DisputeTicket;
import com.lawinomeetMeetmeet.payment.entity.PayoutRequest;
import com.lawinomeetMeetmeet.user.entity.ProfessionalProfile;

import java.util.List;

public interface AdminService {
    List<DisputeTicket> getAllDisputes();
    DisputeTicket resolveDispute(Long ticketId, Boolean approveRefund, String adminNotes);
    ProfessionalProfile toggleLawyerVerification(Long lawyerUserId, Boolean isVerified);
    List<PayoutRequest> getPendingPayouts();
    PayoutRequest approvePayout(Long payoutRequestId);
}
