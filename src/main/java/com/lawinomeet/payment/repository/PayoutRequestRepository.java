package com.lawinomeetMeetmeet.payment.repository;

import com.lawinomeetMeetmeet.payment.entity.PayoutRequest;
import com.lawinomeetMeetmeet.payment.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {
    List<PayoutRequest> findByLawyerId(Long lawyerId);
    List<PayoutRequest> findByStatus(PayoutStatus status);
}
