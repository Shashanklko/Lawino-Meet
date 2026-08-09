package com.LawEZY.payment.repository;

import com.LawEZY.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByConsultationId(Long consultationId);
    List<PaymentTransaction> findByLawyerId(Long lawyerId);
    List<PaymentTransaction> findByClientId(Long clientId);
}
