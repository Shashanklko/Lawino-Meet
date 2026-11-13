package com.lawinomeet.auth.service;

import com.lawinomeet.auth.dto.*;
import com.lawinomeet.auth.entity.AccountStatus;
import com.lawinomeet.auth.entity.RefreshToken;
import com.lawinomeet.auth.entity.Role;
import com.lawinomeet.auth.entity.User;
import com.lawinomeet.auth.exception.ApiException;
import com.lawinomeet.auth.repository.RefreshTokenRepository;
import com.lawinomeet.auth.repository.UserRepository;
import com.lawinomeet.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    private static final long REFRESH_TOKEN_VALIDITY_DAYS = 7;

    @Transactional
    public AuthResponse register(RegisterRequest request, Role role) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException("Username is already taken: " + username, HttpStatus.CONFLICT, "USERNAME_ALREADY_EXISTS");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException("Email is already registered: " + email, HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS");
        }

        User user = User.builder()
                .publicId(UUID.randomUUID().toString())
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with public ID: {}, username: {}, role: {}",
                savedUser.getPublicId(), savedUser.getUsername(), savedUser.getRole());

        String accessToken = tokenProvider.generateAccessToken(savedUser);
        String refreshTokenStr = createRefreshToken(savedUser.getPublicId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs())
                .user(UserSummaryDto.fromEntity(savedUser))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();

        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ApiException("Account is suspended. Please contact platform support.", HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
        }

        if (user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new ApiException("Account is disabled. Please contact platform support.", HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED");
        }

        String accessToken = tokenProvider.generateAccessToken(user);
        String refreshTokenStr = createRefreshToken(user.getPublicId());

        log.info("User logged in successfully: publicId={}, username={}", user.getPublicId(), user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs())
                .user(UserSummaryDto.fromEntity(user))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new ApiException("Invalid refresh token", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new ApiException("Refresh token is expired or has been revoked", HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED");
        }

        User user = userRepository.findByPublicId(refreshToken.getUserPublicId())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if (user.getAccountStatus() == AccountStatus.SUSPENDED || user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new ApiException("Account is inactive", HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE");
        }

        // Single-use token rotation: revoke used token and issue a fresh one
        refreshToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = tokenProvider.generateAccessToken(user);
        String newRefreshTokenStr = createRefreshToken(user.getPublicId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs())
                .user(UserSummaryDto.fromEntity(user))
                .build();
    }

    @Transactional
    public void logout(String userPublicId) {
        refreshTokenRepository.deleteByUserPublicId(userPublicId);
        log.info("Revoked all refresh tokens for user publicId: {}", userPublicId);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        return UserSummaryDto.fromEntity(user);
    }

    private String createRefreshToken(String userPublicId) {
        String tokenStr = tokenProvider.generateRefreshToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .userPublicId(userPublicId)
                .token(tokenStr)
                .expiresAt(Instant.now().plus(REFRESH_TOKEN_VALIDITY_DAYS, ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshToken);
        return tokenStr;
    }
}
