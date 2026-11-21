package com.lawinomeet.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "chat_messages",
    indexes = {
        @Index(name = "idx_msg_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_msg_conversation", columnList = "conversation_id, created_at"),
        @Index(name = "idx_msg_recipient_read", columnList = "recipient_user_public_id, is_read")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(name = "sender_user_public_id", nullable = false, length = 36)
    private String senderUserPublicId;

    @Column(name = "sender_username", length = 50)
    private String senderUsername;

    @Column(name = "recipient_user_public_id", nullable = false, length = 36)
    private String recipientUserPublicId;

    @Column(name = "recipient_username", length = 50)
    private String recipientUsername;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_type", length = 100)
    private String attachmentType;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "message_type", length = 20)
    @Builder.Default
    private String messageType = "TEXT";

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "reply_to_message_public_id", length = 36)
    private String replyToMessagePublicId;

    @Column(name = "reply_to_sender_name", length = 100)
    private String replyToSenderName;

    @Column(name = "reply_to_content", length = 500)
    private String replyToContent;

    @Column(name = "deleted_for_everyone", nullable = false)
    @Builder.Default
    private boolean deletedForEveryone = false;

    @Column(name = "deleted_for_user_ids", columnDefinition = "TEXT")
    private String deletedForUserIds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
