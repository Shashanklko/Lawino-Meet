package com.lawinomeet.auth.security;

import com.lawinomeet.auth.entity.AccountStatus;
import com.lawinomeet.auth.entity.Role;
import com.lawinomeet.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {

    private final String publicId;
    private final String username;
    private final String email;
    private final String password;
    private final Role role;
    private final AccountStatus accountStatus;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        return UserPrincipal.builder()
                .publicId(user.getPublicId())
                .username(user.getUsername())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .authorities(Collections.singletonList(authority))
                .build();
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountStatus != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return accountStatus != AccountStatus.DISABLED;
    }
}
