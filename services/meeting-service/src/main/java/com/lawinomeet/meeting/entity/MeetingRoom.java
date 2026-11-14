package com.lawinomeet.meeting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "meeting_rooms",
    indexes = {
        @Index(name = "idx_room_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_room_appointment", columnList = "appointment_public_id"),
        @Index(name = "idx_room_client", columnList = "client_user_public_id"),
        @Index(name = "idx_room_lawyer", columnList = "lawyer_user_public_id"),
        @Index(name = "idx_room_status", columnList = "room_status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "appointment_public_id", nullable = false, length = 36)
    private String appointmentPublicId;

    @Column(name = "client_user_public_id", nullable = false, length = 36)
    private String clientUserPublicId;

    @Column(name = "client_username", length = 50)
    private String clientUsername;

    @Column(name = "lawyer_user_public_id", nullable = false, length = 36)
    private String lawyerUserPublicId;

    @Column(name = "lawyer_username", length = 50)
    private String lawyerUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_status", nullable = false, length = 20)
    @Builder.Default
    private RoomStatus roomStatus = RoomStatus.WAITING;

    @Column(name = "room_token", nullable = false, length = 64)
    private String roomToken;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

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
        if (this.roomToken == null) {
            this.roomToken = UUID.randomUUID().toString().replace("-", "");
        }
        if (this.roomStatus == null) {
            this.roomStatus = RoomStatus.WAITING;
        }
    }

    public boolean isAuthorizedParticipant(String userPublicId) {
        return userPublicId != null &&
               (userPublicId.equals(clientUserPublicId) || userPublicId.equals(lawyerUserPublicId));
    }
}
