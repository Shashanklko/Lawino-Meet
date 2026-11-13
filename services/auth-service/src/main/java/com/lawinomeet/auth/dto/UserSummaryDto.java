package com.lawinomeet.auth.dto;

import com.lawinomeet.auth.entity.AccountStatus;
import com.lawinomeet.auth.entity.Role;
import com.lawinomeet.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private String publicId;
    private String username;
    private String email;
    private Role role;
    private AccountStatus accountStatus;
    private boolean emailVerified;
    private Instant createdAt;

    public static UserSummaryDto fromEntity(User user) {
        return UserSummaryDto.builder()
                .publicId(user.getPublicId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
