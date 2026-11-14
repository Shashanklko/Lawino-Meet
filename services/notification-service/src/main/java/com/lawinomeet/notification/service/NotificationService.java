package com.lawinomeet.notification.service;

import com.lawinomeet.notification.dto.CreateNotificationEventRequest;
import com.lawinomeet.notification.dto.NotificationResponse;
import com.lawinomeet.notification.dto.UnreadCountResponse;
import com.lawinomeet.notification.entity.Notification;
import com.lawinomeet.notification.exception.ApiException;
import com.lawinomeet.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public NotificationResponse createNotification(CreateNotificationEventRequest request) {
        Notification notification = Notification.builder()
                .publicId(UUID.randomUUID().toString())
                .recipientUserPublicId(request.getRecipientUserPublicId())
                .recipientUsername(request.getRecipientUsername())
                .notificationType(request.getNotificationType())
                .title(request.getTitle())
                .message(request.getMessage())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} of type {} for user {}",
                saved.getPublicId(), saved.getNotificationType(), saved.getRecipientUserPublicId());
        return NotificationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String recipientPublicId, int page, int size) {
        if (size > 0) {
            Pageable pageable = PageRequest.of(Math.max(0, page), size);
            Page<Notification> pageResult = notificationRepository
                    .findByRecipientUserPublicIdOrderByCreatedAtDesc(recipientPublicId, pageable);
            return pageResult.map(NotificationResponse::fromEntity).getContent();
        } else {
            List<Notification> list = notificationRepository
                    .findByRecipientUserPublicIdOrderByCreatedAtDesc(recipientPublicId);
            return list.stream().map(NotificationResponse::fromEntity).toList();
        }
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String recipientPublicId) {
        long count = notificationRepository.countByRecipientUserPublicIdAndIsReadFalse(recipientPublicId);
        return UnreadCountResponse.builder().unreadCount(count).build();
    }

    @Transactional
    public NotificationResponse markAsRead(String recipientPublicId, String notificationPublicId) {
        Notification notification = notificationRepository.findByPublicId(notificationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification not found."));

        if (!notification.getRecipientUserPublicId().equals(recipientPublicId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view this notification.");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
            log.info("Marked notification {} as read for user {}", notificationPublicId, recipientPublicId);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllAsRead(String recipientPublicId) {
        int updated = notificationRepository.markAllAsRead(recipientPublicId, Instant.now());
        log.info("Marked all {} notifications as read for user {}", updated, recipientPublicId);
        return updated;
    }

    @Transactional
    public void deleteNotification(String recipientPublicId, String notificationPublicId) {
        Notification notification = notificationRepository.findByPublicId(notificationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification not found."));

        if (!notification.getRecipientUserPublicId().equals(recipientPublicId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to delete this notification.");
        }

        notificationRepository.delete(notification);
        log.info("Deleted notification {} for user {}", notificationPublicId, recipientPublicId);
    }
}
