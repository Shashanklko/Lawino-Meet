package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.ClientProfileDto;
import com.lawinomeet.user.dto.UpdateClientProfileRequest;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.ClientProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ClientProfileController {

    private final ClientProfileService clientProfileService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ClientProfileDto profile = clientProfileService.getOrCreateProfile(principal.getPublicId(), principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateClientProfileRequest request) {
        ClientProfileDto updated = clientProfileService.updateProfile(principal.getPublicId(), principal.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
