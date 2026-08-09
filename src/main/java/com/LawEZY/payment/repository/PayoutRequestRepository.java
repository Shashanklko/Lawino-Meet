package com.LawEZY.payment.repository;

import com.LawEZY.payment.entity.PayoutRequest;
import com.LawEZY.payment.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {
    List<PayoutRequest> findByLawyerId(Long lawyerId);
    List<PayoutRequest> findByStatus(PayoutStatus status);
}
