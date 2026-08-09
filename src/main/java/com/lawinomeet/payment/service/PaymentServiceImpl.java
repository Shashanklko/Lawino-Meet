package com.lawinomeet.payment.service;

import com.lawinomeet.common.exception.ResourceNotFoundException;
import com.lawinomeet.common.service.AuditLogService;
import com.lawinomeet.common.service.EmailService;
import com.lawinomeet.consultation.entity.Consultation;
import com.lawinomeet.consultation.enums.ConsultationMode;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final ConsultationRepository consultationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PayoutRequestRepository payoutRequestRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Override
    @Transactional
    public PaymentTransaction processCheckout(Long consultationId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found ID: " + consultationId));

        if (consultation.getCustomFee() == null || consultation.getCustomFee() <= 0) {
            throw new RuntimeException("Cannot process payment. Lawyer has not set a fee for this consultation.");
        }

        Double totalAmount = consultation.getCustomFee();
        ConsultationMode mode = consultation.getMode();

        // Calculate Dynamic Split: Online = 80/20 | Offline = 90/10 (10% dedicated platform fee)
        double lawyerPercentage = (mode == ConsultationMode.OFFLINE_OFFICE) ? 0.90 : 0.80;
        double servicePercentage = (mode == ConsultationMode.OFFLINE_OFFICE) ? 0.10 : 0.20;

        double lawyerShare = totalAmount * lawyerPercentage;
        double serviceFee = totalAmount * servicePercentage;

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setConsultationId(consultation.getId());
        transaction.setMeetingCode(consultation.getMeetingCode());
        transaction.setEarningType(mode.name());
        transaction.setClientId(consultation.getClientId());
        transaction.setLawyerId(consultation.getLawyerId());
        transaction.setTotalAmount(totalAmount);
        transaction.setLawyerShare(lawyerShare);
        transaction.setServiceFee(serviceFee);
        transaction.setStatus("SUCCESS");

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);

        // Credit Lawyer Wallet Balance & Categorized Earnings
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(consultation.getLawyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer profile not found for ID: " + consultation.getLawyerId()));

        if (mode == ConsultationMode.OFFLINE_OFFICE) {
            Double currOffline = profile.getOfflineEarnings() != null ? profile.getOfflineEarnings() : 0.0;
            profile.setOfflineEarnings(currOffline + lawyerShare);
        } else {
            Double currOnline = profile.getOnlineEarnings() != null ? profile.getOnlineEarnings() : 0.0;
            profile.setOnlineEarnings(currOnline + lawyerShare);
        }

        Double currentWallet = profile.getWalletBalance() != null ? profile.getWalletBalance() : 0.0;
        profile.setWalletBalance(currentWallet + lawyerShare);
        professionalProfileRepository.save(profile);

        // Post-Payment Updates on Consultation
        consultation.setIsContactInfoDisclosed(true);
        consultation.setStatus(ConsultationStatus.PAID_CONFIRMED);
        consultation.setPaidAt(LocalDateTime.now());

        // Generate Jitsi Video Room Link if Online Video mode
        if (mode == ConsultationMode.ONLINE_VIDEO) {
            consultation.setVideoRoomUrl("https://meet.jit.si/" + consultation.getMeetingCode());
        }

        consultationRepository.save(consultation);

        // Dispatch Email Confirmation Pass
        emailService.sendAppointmentConfirmationEmail(
                consultation.getClientEmail(),
                consultation.getClientName(),
                consultation.getMeetingCode(),
                mode.name(),
                consultation.getRequestedTimeSlot().toString(),
                consultation.getVideoRoomUrl(),
                consultation.getLawyerOfficeAddress()
        );

        auditLogService.logAudit("PAYMENT_SUCCESS", "Paid ₹" + totalAmount + " for code: " + consultation.getMeetingCode(), null, String.valueOf(consultation.getClientId()), "CLIENT");
        log.info("[PAYMENT] Successfully processed checkout for Meeting Code: {} | Lawyer Share ({}%): ₹{}", consultation.getMeetingCode(), (int)(lawyerPercentage * 100), lawyerShare);

        return savedTx;
    }

    @Override
    @Transactional
    public PayoutRequest requestPayout(Long lawyerId, Double amount, String bankDetails) {
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(lawyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer profile not found for ID: " + lawyerId));

        Double currentBalance = profile.getWalletBalance() != null ? profile.getWalletBalance() : 0.0;
        if (currentBalance < amount) {
            throw new RuntimeException("Insufficient wallet balance for withdrawal. Current balance: ₹" + currentBalance);
        }

        PayoutRequest request = new PayoutRequest();
        request.setLawyerId(lawyerId);
        request.setRequestedAmount(amount);
        request.setBankAccountDetails(bankDetails);
        request.setStatus(PayoutStatus.PENDING);

        PayoutRequest saved = payoutRequestRepository.save(request);
        log.info("[PAYOUT] Lawyer ID: {} requested payout of ₹{}", lawyerId, amount);
        auditLogService.logAudit("PAYOUT_REQUEST", "Lawyer requested payout of ₹" + amount, null, String.valueOf(lawyerId), "LAWYER");

        return saved;
    }

    @Override
    public Map<String, Object> getLawyerWalletDetails(Long lawyerId) {
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(lawyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lawyer profile not found for ID: " + lawyerId));

        Map<String, Object> map = new HashMap<>();
        map.put("lawyerId", lawyerId);
        map.put("onlineEarnings", profile.getOnlineEarnings() != null ? profile.getOnlineEarnings() : 0.0);
        map.put("offlineEarnings", profile.getOfflineEarnings() != null ? profile.getOfflineEarnings() : 0.0);
        map.put("availableWalletBalance", profile.getWalletBalance() != null ? profile.getWalletBalance() : 0.0);
        map.put("totalWithdrawn", profile.getTotalWithdrawn() != null ? profile.getTotalWithdrawn() : 0.0);
        return map;
    }

    @Override
    public List<PayoutRequest> getLawyerPayoutRequests(Long lawyerId) {
        return payoutRequestRepository.findByLawyerId(lawyerId);
    }
}
