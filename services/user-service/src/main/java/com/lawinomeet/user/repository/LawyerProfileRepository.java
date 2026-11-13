package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.LawyerProfile;
import com.lawinomeet.user.entity.ProfileStatus;
import com.lawinomeet.user.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LawyerProfileRepository extends JpaRepository<LawyerProfile, Long> {

    Optional<LawyerProfile> findByUserPublicId(String userPublicId);

    Optional<LawyerProfile> findByUsernameIgnoreCase(String username);

    Optional<LawyerProfile> findBySlugIgnoreCase(String slug);

    boolean existsByUserPublicId(String userPublicId);

    boolean existsBySlugIgnoreCase(String slug);

    Page<LawyerProfile> findAllByVerificationStatusAndPublicProfileStatus(
            VerificationStatus verificationStatus,
            ProfileStatus publicProfileStatus,
            Pageable pageable
    );

    @Query("SELECT DISTINCT l FROM LawyerProfile l " +
           "LEFT JOIN l.specializations s " +
           "WHERE l.verificationStatus = 'VERIFIED' " +
           "AND l.publicProfileStatus = 'PUBLISHED' " +
           "AND (:query IS NULL OR LOWER(l.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(l.biography) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:city IS NULL OR LOWER(l.city) = LOWER(:city)) " +
           "AND (:specializationId IS NULL OR s.id = :specializationId) " +
           "AND (:minExperience IS NULL OR l.experienceYears >= :minExperience)")
    Page<LawyerProfile> searchLawyers(
            @Param("query") String query,
            @Param("city") String city,
            @Param("specializationId") Long specializationId,
            @Param("minExperience") Integer minExperience,
            Pageable pageable
    );
}
