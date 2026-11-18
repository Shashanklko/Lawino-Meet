package com.lawinomeet.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "chat_conversations",
    indexes = {
        @Index(name = "idx_conversation_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_conversation_participants", columnList = "participant_one_public_id, participant_two_public_id"),
        @Index(name = "idx_conversation_appointment", columnList = "appointment_public_id"),
        @Index(name = "idx_conversation_last_message", columnList = "last_message_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 100)
    private String publicId;

    @Column(name = "appointment_public_id", length = 100)
    private String appointmentPublicId;

    @Column(name = "participant_one_public_id", nullable = false, length = 36)
    private String participantOnePublicId;

    @Column(name = "participant_one_username", length = 50)
    private String participantOneUsername;

    @Column(name = "participant_two_public_id", nullable = false, length = 36)
    private String participantTwoPublicId;

    @Column(name = "participant_two_username", length = 50)
    private String participantTwoUsername;

    @Column(name = "last_message_content", length = 500)
    private String lastMessageContent;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID().toString();
        }
        if (this.lastMessageAt == null) {
            this.lastMessageAt = Instant.now();
        }
    }

    public boolean isParticipant(String userPublicId) {
        return (participantOnePublicId != null && participantOnePublicId.equals(userPublicId)) ||
               (participantTwoPublicId != null && participantTwoPublicId.equals(userPublicId));
    }

    public String getOtherParticipantPublicId(String userPublicId) {
        return userPublicId.equals(participantOnePublicId) ? participantTwoPublicId : participantOnePublicId;
    }

    public String getOtherParticipantUsername(String userPublicId) {
        return userPublicId.equals(participantOnePublicId) ? participantTwoUsername : participantOneUsername;
    }
}
