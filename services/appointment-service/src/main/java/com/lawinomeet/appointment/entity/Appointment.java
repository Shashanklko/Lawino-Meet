package com.lawinomeet.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
        @Index(name = "idx_appointment_deadline", columnList = "response_deadline")
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
    @Column(name = "appointment_status", nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus appointmentStatus = AppointmentStatus.PENDING;

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

    @Column(name = "completed_at")
    private Instant completedAt;

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
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
        if (this.responseDeadline == null) {
            // Default 24 hours deadline to accept or reject
            this.responseDeadline = this.requestedAt.plus(24, ChronoUnit.HOURS);
        }
    }
}
