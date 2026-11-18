package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserPublicId(String userPublicId);

    Optional<Wallet> findByPublicId(String publicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userPublicId = :userPublicId")
    Optional<Wallet> findByUserPublicIdForUpdate(@Param("userPublicId") String userPublicId);
}
