package com.lawinomeet.payment.repository;

import com.lawinomeet.payment.entity.PayoutRequest;
import com.lawinomeet.payment.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {
    List<PayoutRequest> findByLawyerId(Long lawyerId);
    List<PayoutRequest> findByStatus(PayoutStatus status);
}
