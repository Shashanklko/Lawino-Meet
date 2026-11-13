package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.FirmMember;
import com.lawinomeet.user.entity.FirmRole;
import com.lawinomeet.user.entity.MembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirmMemberDto {
    private Long id;
    private String lawyerUserPublicId;
    private String lawyerUsername;
    private String lawyerFullName;
    private MembershipStatus membershipStatus;
    private FirmRole roleInFirm;
    private Instant invitedAt;
    private Instant acceptedAt;

    public static FirmMemberDto fromEntity(FirmMember member) {
        return FirmMemberDto.builder()
                .id(member.getId())
                .lawyerUserPublicId(member.getLawyerUserPublicId())
                .lawyerUsername(member.getLawyerUsername())
                .membershipStatus(member.getMembershipStatus())
                .roleInFirm(member.getRoleInFirm())
                .invitedAt(member.getInvitedAt())
                .acceptedAt(member.getAcceptedAt())
                .build();
    }
}
