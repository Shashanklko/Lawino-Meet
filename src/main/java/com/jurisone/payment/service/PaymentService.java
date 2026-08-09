package com.jurisone.payment.service;

import com.jurisone.payment.entity.PaymentTransaction;
import com.jurisone.payment.entity.PayoutRequest;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    PaymentTransaction processCheckout(Long consultationId);
    PayoutRequest requestPayout(Long lawyerId, Double amount, String bankDetails);
    Map<String, Object> getLawyerWalletDetails(Long lawyerId);
    List<PayoutRequest> getLawyerPayoutRequests(Long lawyerId);
}
