package com.lawinomeet.notification.repository;

import com.lawinomeet.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Optional<Notification> findByPublicId(String publicId);

    Page<Notification> findByRecipientUserPublicIdOrderByCreatedAtDesc(String recipientUserPublicId, Pageable pageable);

    List<Notification> findByRecipientUserPublicIdOrderByCreatedAtDesc(String recipientUserPublicId);

    long countByRecipientUserPublicIdAndIsReadFalse(String recipientUserPublicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.recipientUserPublicId = :recipientId AND n.isRead = false")
    int markAllAsRead(@Param("recipientId") String recipientId, @Param("now") Instant now);
}
