package com.lawinomeet.admin.service;

import com.lawinomeet.admin.entity.DisputeTicket;
import com.lawinomeet.admin.enums.DisputeStatus;
import com.lawinomeet.admin.repository.DisputeTicketRepository;
import com.lawinomeet.common.exception.ResourceNotFoundException;
import com.lawinomeet.common.service.AuditLogService;
import com.lawinomeet.consultation.entity.Consultation;
import com.lawinomeet.consultation.enums.ConsultationStatus;
import com.lawinomeet.consultation.repository.ConsultationRepository;
import com.lawinomeet.payment.entity.PaymentTransaction;
import com.lawinomeet.payment.entity.PayoutRequest;
import com.lawinomeet.payment.enums.PayoutStatus;
import com.lawinomeet.payment.repository.PaymentTransactionRepository;
import com.lawinomeet.payment.repository.PayoutRequestRepository;
import com.lawinomeet.user.entity.ProfessionalProfile;
import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

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
