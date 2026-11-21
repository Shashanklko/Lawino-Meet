package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.LawyerProfile;
import com.lawinomeet.user.entity.ProfileStatus;
import com.lawinomeet.user.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerProfileDto {
    private String userPublicId;
    private String shortUid;
    private String username;
    private String slug;
    private String fullName;
    private String biography;
    private String profileImageUrl;
    private String qualification;
    private String barCouncilNumber;
    private Integer experienceYears;
    private String phone;
    private String emailPublic;
    private String city;
    private String state;
    private String country;
    private boolean messagingEnabled;
    private VerificationStatus verificationStatus;
    private ProfileStatus publicProfileStatus;
    private String workingDays;
    private String workingHoursStart;
    private String workingHoursEnd;
    private String breakStartTime;
    private String breakEndTime;
    private String timeZone;
    private String availabilityStatus;
    private Set<SpecializationDto> specializations;
    private List<LegalServiceDto> services;
    private String associatedFirmName;
    private String associatedFirmSlug;

    public static LawyerProfileDto fromEntity(LawyerProfile entity) {
        return LawyerProfileDto.builder()
                .userPublicId(entity.getUserPublicId())
                .shortUid(entity.getShortUid())
                .username(entity.getUsername())
                .slug(entity.getSlug())
                .fullName(entity.getFullName())
                .biography(entity.getBiography())
                .profileImageUrl(entity.getProfileImageUrl())
                .qualification(entity.getQualification())
                .barCouncilNumber(entity.getQualification())
                .experienceYears(entity.getExperienceYears())
                .phone(entity.getPhone())
                .emailPublic(entity.getEmailPublic())
                .city(entity.getCity())
                .state(entity.getState())
                .country(entity.getCountry())
                .messagingEnabled(entity.isMessagingEnabled())
                .verificationStatus(entity.getVerificationStatus())
                .publicProfileStatus(entity.getPublicProfileStatus())
                .workingDays(entity.getWorkingDays())
                .workingHoursStart(entity.getWorkingHoursStart())
                .workingHoursEnd(entity.getWorkingHoursEnd())
                .breakStartTime(entity.getBreakStartTime())
                .breakEndTime(entity.getBreakEndTime())
                .timeZone(entity.getTimeZone())
                .availabilityStatus(entity.getAvailabilityStatus())
                .specializations(entity.getSpecializations() != null ?
                        entity.getSpecializations().stream().map(SpecializationDto::fromEntity).collect(Collectors.toSet()) : Set.of())
                .services(entity.getServices() != null ?
                        entity.getServices().stream().map(LegalServiceDto::fromEntity).collect(Collectors.toList()) : List.of())
                .build();
    }
}
