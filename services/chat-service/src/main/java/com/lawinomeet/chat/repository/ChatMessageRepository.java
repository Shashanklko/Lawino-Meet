package com.lawinomeet.chat.repository;

import com.lawinomeet.chat.entity.ChatMessage;
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
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Optional<ChatMessage> findByPublicId(String publicId);

    Optional<ChatMessage> findTopByConversationIdAndSenderUserPublicIdOrderByCreatedAtDesc(Long conversationId, String senderUserPublicId);

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    long countByRecipientUserPublicIdAndIsReadFalse(String recipientUserPublicId);

    long countByConversationIdAndRecipientUserPublicIdAndIsReadFalse(Long conversationId, String recipientUserPublicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ChatMessage m SET m.isRead = true, m.readAt = :now " +
           "WHERE m.conversation.id = :convId AND m.recipientUserPublicId = :recipientId AND m.isRead = false")
    int markConversationMessagesAsRead(@Param("convId") Long convId,
                                       @Param("recipientId") String recipientId,
                                       @Param("now") Instant now);
}
