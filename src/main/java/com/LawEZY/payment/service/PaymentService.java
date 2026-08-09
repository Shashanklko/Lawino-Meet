package com.LawEZY.payment.service;

import com.LawEZY.payment.entity.PaymentTransaction;
import com.LawEZY.payment.entity.PayoutRequest;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    PaymentTransaction processCheckout(Long consultationId);
    PayoutRequest requestPayout(Long lawyerId, Double amount, String bankDetails);
    Map<String, Object> getLawyerWalletDetails(Long lawyerId);
    List<PayoutRequest> getLawyerPayoutRequests(Long lawyerId);
}
