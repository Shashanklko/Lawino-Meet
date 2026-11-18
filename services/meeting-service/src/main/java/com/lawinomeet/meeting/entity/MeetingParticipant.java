package com.lawinomeet.meeting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "meeting_participants",
    indexes = {
        @Index(name = "idx_participant_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_participant_room", columnList = "room_id"),
        @Index(name = "idx_participant_user", columnList = "user_public_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @Column(name = "user_public_id", nullable = false, length = 36)
    private String userPublicId;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private String role = "CLIENT"; // "HOST" or "CLIENT"

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @PrePersist
    public void prePersist() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID().toString();
        }
        if (this.role == null) {
            this.role = "CLIENT";
        }
    }
}
