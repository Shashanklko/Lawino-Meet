package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByUserPublicIdOrderByCreatedAtDesc(String userPublicId);

    List<WalletTransaction> findByReferenceId(String referenceId);
}
