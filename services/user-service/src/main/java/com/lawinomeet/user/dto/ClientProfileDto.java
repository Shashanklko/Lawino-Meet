package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.ClientProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileDto {
    private String userPublicId;
    private String shortUid;
    private String username;
    private String fullName;
    private String phone;
    private String profileImageUrl;
    private String city;
    private String state;
    private String country;
    private Instant createdAt;

    public static ClientProfileDto fromEntity(ClientProfile entity) {
        return ClientProfileDto.builder()
                .userPublicId(entity.getUserPublicId())
                .shortUid(entity.getShortUid())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .phone(entity.getPhone())
                .profileImageUrl(entity.getProfileImageUrl())
                .city(entity.getCity())
                .state(entity.getState())
                .country(entity.getCountry())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
