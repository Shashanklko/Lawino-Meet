package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.FirmMember;
import com.lawinomeet.user.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FirmMemberRepository extends JpaRepository<FirmMember, Long> {

    List<FirmMember> findAllByFirmId(Long firmId);

    List<FirmMember> findAllByFirmPublicIdAndMembershipStatus(String firmPublicId, MembershipStatus status);

    List<FirmMember> findAllByLawyerUserPublicId(String lawyerUserPublicId);

    Optional<FirmMember> findByFirmIdAndLawyerUserPublicId(Long firmId, String lawyerUserPublicId);

    Optional<FirmMember> findByLawyerUserPublicIdAndMembershipStatus(String lawyerUserPublicId, MembershipStatus status);

    boolean existsByFirmIdAndLawyerUserPublicIdAndMembershipStatus(Long firmId, String lawyerUserPublicId, MembershipStatus status);
}
