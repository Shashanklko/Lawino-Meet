package com.lawinomeet.notification.controller;

import com.lawinomeet.notification.dto.ApiResponse;
import com.lawinomeet.notification.dto.CreateNotificationEventRequest;
import com.lawinomeet.notification.dto.NotificationResponse;
import com.lawinomeet.notification.dto.UnreadCountResponse;
import com.lawinomeet.notification.security.UserPrincipal;
import com.lawinomeet.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<NotificationResponse>> dispatchEvent(
            @Valid @RequestBody CreateNotificationEventRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Notification event dispatched successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<NotificationResponse> list = notificationService.getMyNotifications(principal.getPublicId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully", list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        UnreadCountResponse response = notificationService.getUnreadCount(principal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok("Unread notification count retrieved", response));
    }

    @PatchMapping("/{notificationPublicId}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String notificationPublicId) {
        NotificationResponse response = notificationService.markAsRead(principal.getPublicId(), notificationPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", response));
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        int updated = notificationService.markAllAsRead(principal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", Map.of("updatedCount", updated)));
    }

    @DeleteMapping("/{notificationPublicId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String notificationPublicId) {
        notificationService.deleteNotification(principal.getPublicId(), notificationPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted successfully", null));
    }
}
