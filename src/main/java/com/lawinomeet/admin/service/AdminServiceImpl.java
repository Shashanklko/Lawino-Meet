package com.lawinomeetMeetmeet.admin.service;

import com.lawinomeetMeetmeet.admin.entity.DisputeTicket;
import com.lawinomeetMeetmeet.admin.enums.DisputeStatus;
import com.lawinomeetMeetmeet.admin.repository.DisputeTicketRepository;
import com.lawinomeetMeetmeet.common.exception.ResourceNotFoundException;
import com.lawinomeetMeetmeet.common.service.AuditLogService;
import com.lawinomeetMeetmeet.consultation.entity.Consultation;
import com.lawinomeetMeetmeet.consultation.enums.ConsultationStatus;
import com.lawinomeetMeetmeet.consultation.repository.ConsultationRepository;
import com.lawinomeetMeetmeet.payment.entity.PaymentTransaction;
import com.lawinomeetMeetmeet.payment.entity.PayoutRequest;
import com.lawinomeetMeetmeet.payment.enums.PayoutStatus;
import com.lawinomeetMeetmeet.payment.repository.PaymentTransactionRepository;
import com.lawinomeetMeetmeet.payment.repository.PayoutRequestRepository;
import com.lawinomeetMeetmeet.user.entity.ProfessionalProfile;
import com.lawinomeetMeetmeet.user.repository.ProfessionalProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final DisputeTicketRepository disputeTicketRepository;
    private final ConsultationRepository consultationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final PayoutRequestRepository payoutRequestRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<DisputeTicket> getAllDisputes() {
        return disputeTicketRepository.findAll();
    }

    @Override
    @Transactional
    public DisputeTicket resolveDispute(Long ticketId, Boolean approveRefund, String adminNotes) {
        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute Ticket not found ID: " + ticketId));

        ticket.setAdminResolutionNotes(adminNotes);
        ticket.setResolvedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(approveRefund)) {
            ticket.setStatus(DisputeStatus.RESOLVED_REFUNDED);

            // Fetch Consultation and Payment Transaction to execute refund & wallet debit
            Consultation consultation = consultationRepository.findById(ticket.getConsultationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + ticket.getConsultationId()));

            consultation.setStatus(ConsultationStatus.REFUNDED);
            consultationRepository.save(consultation);

            paymentTransactionRepository.findByConsultationId(consultation.getId()).ifPresent(tx -> {
                tx.setStatus("REFUNDED");
                paymentTransactionRepository.save(tx);

                // Debit Lawyer Wallet Balance
                professionalProfileRepository.findByUserId(consultation.getLawyerId()).ifPresent(prof -> {
                    Double currentBalance = prof.getWalletBalance() != null ? prof.getWalletBalance() : 0.0;
                    prof.setWalletBalance(Math.max(0.0, currentBalance - tx.getLawyerShare()));
                    professionalProfileRepository.save(prof);
                    log.info("[DISPUTE] Approved refund for code: {}. Debited ₹{} from Lawyer ID: {}", consultation.getMeetingCode(), tx.getLawyerShare(), consultation.getLawyerId());
                });
            });

            auditLogService.logAudit("DISPUTE_REFUNDED", "Approved refund for ticket ID: " + ticketId, null, "ADMIN", "ADMIN");
        } else {
            ticket.setStatus(DisputeStatus.REJECTED);
            auditLogService.logAudit("DISPUTE_REJECTED", "Rejected dispute ticket ID: " + ticketId, null, "ADMIN", "ADMIN");
        }

        return disputeTicketRepository.save(ticket);
    }

    @Override
    @Transactional
    public ProfessionalProfile toggleLawyerVerification(Long lawyerUserId, Boolean isVerified) {
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(lawyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer profile not found for user ID: " + lawyerUserId));

        profile.setIsVerified(isVerified);
        log.info("[ADMIN] Set Lawyer ID: {} Verification status to: {}", lawyerUserId, isVerified);
        return professionalProfileRepository.save(profile);
    }

    @Override
    public List<PayoutRequest> getPendingPayouts() {
        return payoutRequestRepository.findByStatus(PayoutStatus.PENDING);
    }

    @Override
    @Transactional
    public PayoutRequest approvePayout(Long payoutRequestId) {
        PayoutRequest request = payoutRequestRepository.findById(payoutRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout Request not found ID: " + payoutRequestId));

        request.setStatus(PayoutStatus.PROCESSED);
        request.setProcessedAt(LocalDateTime.now());

        // Deduct from Lawyer Wallet Balance and add to Total Withdrawn
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(request.getLawyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer profile not found for user ID: " + request.getLawyerId()));

        Double currentWallet = profile.getWalletBalance() != null ? profile.getWalletBalance() : 0.0;
        Double currentWithdrawn = profile.getTotalWithdrawn() != null ? profile.getTotalWithdrawn() : 0.0;

        profile.setWalletBalance(Math.max(0.0, currentWallet - request.getRequestedAmount()));
        profile.setTotalWithdrawn(currentWithdrawn + request.getRequestedAmount());
        professionalProfileRepository.save(profile);

        log.info("[ADMIN] Approved payout request ID: {} for Lawyer ID: {} | Amount: ₹{}", payoutRequestId, request.getLawyerId(), request.getRequestedAmount());
        auditLogService.logAudit("PAYOUT_APPROVED", "Approved payout of ₹" + request.getRequestedAmount() + " for lawyer: " + request.getLawyerId(), null, "ADMIN", "ADMIN");

        return payoutRequestRepository.save(request);
    }
}
