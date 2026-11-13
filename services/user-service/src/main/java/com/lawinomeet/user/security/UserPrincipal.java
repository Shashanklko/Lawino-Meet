package com.lawinomeet.user.security;

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
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(String publicId, String username, String email, String role) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
        return UserPrincipal.builder()
                .publicId(publicId)
                .username(username)
                .email(email)
                .role(role)
                .authorities(Collections.singletonList(authority))
                .build();
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
