package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.LegalService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LegalServiceRepository extends JpaRepository<LegalService, Long> {

    List<LegalService> findAllByLawyerProfileIdAndIsActiveTrue(Long lawyerProfileId);

    List<LegalService> findAllByFirmIdAndIsActiveTrue(Long firmId);

    List<LegalService> findAllByFirmPublicIdAndIsActiveTrue(String firmPublicId);
}
