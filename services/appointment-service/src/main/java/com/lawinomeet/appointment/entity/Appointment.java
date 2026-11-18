package com.lawinomeet.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(
    name = "appointments",
    indexes = {
        @Index(name = "idx_appointment_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_appointment_client", columnList = "client_user_public_id"),
        @Index(name = "idx_appointment_lawyer", columnList = "lawyer_user_public_id"),
        @Index(name = "idx_appointment_firm", columnList = "firm_public_id"),
        @Index(name = "idx_appointment_status", columnList = "appointment_status"),
        @Index(name = "idx_appointment_deadline", columnList = "response_deadline"),
        @Index(name = "idx_appointment_autorelease", columnList = "auto_release_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "client_user_public_id", nullable = false, length = 36)
    private String clientUserPublicId;

    @Column(name = "client_username", nullable = false, length = 50)
    private String clientUsername;

    @Column(name = "lawyer_user_public_id", nullable = false, length = 36)
    private String lawyerUserPublicId;

    @Column(name = "lawyer_username", length = 50)
    private String lawyerUsername;

    @Column(name = "firm_public_id", length = 36)
    private String firmPublicId;

    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "fee", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal fee = new BigDecimal("1500.00");

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "slot_id", nullable = false)
    private AvailabilitySlot slot;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type", nullable = false, length = 20)
    @Builder.Default
    private ConsultationType consultationType = ConsultationType.ONLINE;

    @Column(name = "consultation_reason", columnDefinition = "TEXT")
    private String consultationReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_status", nullable = false, length = 30)
    @Builder.Default
    private AppointmentStatus appointmentStatus = AppointmentStatus.PENDING;

    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private String paymentStatus = "UNPAID"; // UNPAID, PAID, REFUNDED

    @Column(name = "payment_method", length = 30)
    @Builder.Default
    private String paymentMethod = "WALLET";

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "meeting_room_public_id", length = 100)
    private String meetingRoomPublicId;

    @Column(name = "chat_conversation_public_id", length = 100)
    private String chatConversationPublicId;

    // Minimum 2 slots preference & custom 1-hr slot proposals
    @Column(name = "alternative_slot_public_id", length = 100)
    private String alternativeSlotPublicId;

    @Column(name = "preferred_slots_json", length = 1000)
    private String preferredSlotsJson;

    // In-Chamber consultation fields (Revealed only upon verified payment)
    @Column(name = "chamber_address", length = 500)
    private String chamberAddress;

    @Column(name = "directions_instructions", length = 500)
    private String directionsInstructions;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "response_deadline", nullable = false)
    private Instant responseDeadline;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "completion_requested_at")
    private Instant completionRequestedAt;

    @Column(name = "auto_release_at")
    private Instant autoReleaseAt;

    @Column(name = "client_confirmed_at")
    private Instant clientConfirmedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "settlement_status", nullable = false, length = 20)
    @Builder.Default
    private String settlementStatus = "UNSETTLED"; // UNSETTLED, SETTLED

    @Version
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
        if (this.appointmentStatus == null) {
            this.appointmentStatus = AppointmentStatus.PENDING;
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = "UNPAID";
        }
        if (this.settlementStatus == null) {
            this.settlementStatus = "UNSETTLED";
        }
        if (this.fee == null) {
            this.fee = new BigDecimal("1500.00");
        }
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
        if (this.responseDeadline == null) {
            this.responseDeadline = this.requestedAt.plus(24, ChronoUnit.HOURS);
        }
    }
}
