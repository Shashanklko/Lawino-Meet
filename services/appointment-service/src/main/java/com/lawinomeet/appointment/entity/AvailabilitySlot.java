package com.lawinomeet.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "availability_slots",
    indexes = {
        @Index(name = "idx_slot_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_slot_lawyer_time", columnList = "lawyer_user_public_id, start_time, end_time"),
        @Index(name = "idx_slot_status", columnList = "slot_status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "lawyer_user_public_id", nullable = false, length = 36)
    private String lawyerUserPublicId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_status", nullable = false, length = 20)
    @Builder.Default
    private SlotStatus slotStatus = SlotStatus.AVAILABLE;

    @Version
    @Column(name = "version")
    private Long version;

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
        if (this.slotStatus == null) {
            this.slotStatus = SlotStatus.AVAILABLE;
        }
    }
}
