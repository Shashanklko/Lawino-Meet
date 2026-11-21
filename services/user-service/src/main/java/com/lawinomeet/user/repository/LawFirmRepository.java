package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.LawFirm;
import com.lawinomeet.user.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LawFirmRepository extends JpaRepository<LawFirm, Long> {

    Optional<LawFirm> findByPublicId(String publicId);

    Optional<LawFirm> findByShortUid(String shortUid);

    Optional<LawFirm> findBySlugIgnoreCase(String slug);

    Optional<LawFirm> findByAdminUserPublicId(String adminUserPublicId);

    boolean existsByFirmNameIgnoreCase(String firmName);

    boolean existsBySlugIgnoreCase(String slug);

    Page<LawFirm> findAllByVerificationStatus(VerificationStatus status, Pageable pageable);

    @Query("SELECT f FROM LawFirm f " +
           "WHERE f.verificationStatus = 'VERIFIED' " +
           "AND (:query IS NULL OR LOWER(f.firmName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(f.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:city IS NULL OR LOWER(f.city) = LOWER(:city))")
    Page<LawFirm> searchFirms(
            @Param("query") String query,
            @Param("city") String city,
            Pageable pageable
    );
}
