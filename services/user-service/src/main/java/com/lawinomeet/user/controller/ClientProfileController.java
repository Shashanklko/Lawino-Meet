package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.ClientProfileDto;
import com.lawinomeet.user.dto.UpdateClientProfileRequest;
import com.lawinomeet.user.security.UserPrincipal;
import com.lawinomeet.user.service.ClientProfileService;
import com.lawinomeet.user.service.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ClientProfileController {

    private final ClientProfileService clientProfileService;
    private final StorageService storageService;

    @GetMapping({"/profile", "/client/me"})
    public ResponseEntity<ApiResponse<ClientProfileDto>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ClientProfileDto profile = clientProfileService.getOrCreateProfile(principal.getPublicId(), principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping({"/profile", "/client/me"})
    public ResponseEntity<ApiResponse<ClientProfileDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateClientProfileRequest request) {
        ClientProfileDto updated = clientProfileService.updateProfile(principal.getPublicId(), principal.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @PostMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePhoto(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = storageService.storeProfilePhoto(file, principal.getPublicId());
        clientProfileService.updateProfilePhoto(principal.getPublicId(), url);
        return ResponseEntity.ok(ApiResponse.ok("Profile photo uploaded successfully", Map.of("profileImageUrl", url)));
    }

    @GetMapping("/files/**")
    public ResponseEntity<Resource> serveLocalFile(HttpServletRequest request) {
        try {
            String fullPath = request.getRequestURI();
            String relativePath = fullPath.substring(fullPath.indexOf("/files/") + 7);
            Path filePath = Paths.get("./uploads", relativePath).normalize();
            if (!Files.exists(filePath)) {
                filePath = Paths.get("/tmp/uploads", relativePath).normalize();
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = request.getServletContext().getMimeType(filePath.toString());
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
