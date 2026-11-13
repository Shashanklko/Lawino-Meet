package com.lawinomeet.auth.controller;

import com.lawinomeet.auth.dto.*;
import com.lawinomeet.auth.entity.Role;
import com.lawinomeet.auth.security.UserPrincipal;
import com.lawinomeet.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/client")
    public ResponseEntity<ApiResponse<AuthResponse>> registerClient(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request, Role.CLIENT);
        return new ResponseEntity<>(ApiResponse.ok("Client registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/register/lawyer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerLawyer(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request, Role.LAWYER);
        return new ResponseEntity<>(ApiResponse.ok("Lawyer registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/register/firm")
    public ResponseEntity<ApiResponse<AuthResponse>> registerFirmAdmin(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request, Role.FIRM_ADMIN);
        return new ResponseEntity<>(ApiResponse.ok("Firm administrator registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            authService.logout(userPrincipal.getPublicId());
        }
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserSummaryDto userSummary = authService.getCurrentUser(userPrincipal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok(userSummary));
    }
}
