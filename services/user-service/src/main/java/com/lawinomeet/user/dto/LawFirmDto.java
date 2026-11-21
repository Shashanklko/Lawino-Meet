package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.LawFirm;
import com.lawinomeet.user.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawFirmDto {
    private String publicId;
    private String shortUid;
    private String firmName;
    private String slug;
    private String description;
    private String logoUrl;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String city;
    private String state;
    private String country;
    private VerificationStatus verificationStatus;
    private List<FirmMemberDto> members;
    private List<LegalServiceDto> services;

    public static LawFirmDto fromEntity(LawFirm entity) {
        return LawFirmDto.builder()
                .publicId(entity.getPublicId())
                .shortUid(entity.getShortUid())
                .firmName(entity.getFirmName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .logoUrl(entity.getLogoUrl())
                .contactEmail(entity.getContactEmail())
                .contactPhone(entity.getContactPhone())
                .address(entity.getAddress())
                .city(entity.getCity())
                .state(entity.getState())
                .country(entity.getCountry())
                .verificationStatus(entity.getVerificationStatus())
                .members(entity.getMembers() != null ?
                        entity.getMembers().stream().map(FirmMemberDto::fromEntity).collect(Collectors.toList()) : List.of())
                .services(entity.getServices() != null ?
                        entity.getServices().stream().map(LegalServiceDto::fromEntity).collect(Collectors.toList()) : List.of())
                .build();
    }
}
