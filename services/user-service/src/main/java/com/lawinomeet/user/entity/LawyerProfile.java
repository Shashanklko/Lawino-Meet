package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "lawyer_profiles", indexes = {
        @Index(name = "idx_lawyer_user_public_id", columnList = "user_public_id", unique = true),
        @Index(name = "idx_lawyer_short_uid", columnList = "short_uid", unique = true),
        @Index(name = "idx_lawyer_username", columnList = "username", unique = true),
        @Index(name = "idx_lawyer_slug", columnList = "slug", unique = true),
        @Index(name = "idx_lawyer_city", columnList = "city"),
        @Index(name = "idx_lawyer_verification", columnList = "verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_public_id", nullable = false, unique = true, length = 36, updatable = false)
    private String userPublicId;

    @Column(name = "short_uid", nullable = false, unique = true, length = 7)
    private String shortUid;

    @Column(nullable = false, unique = true, length = 50, updatable = false)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(length = 200)
    private String qualification;

    @Column(name = "experience_years")
    @Builder.Default
    private Integer experienceYears = 0;

    @Column(length = 25)
    private String phone;

    @Column(name = "email_public", length = 150)
    private String emailPublic;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    @Builder.Default
    private String country = "India";

    @Column(name = "messaging_enabled", nullable = false)
    @Builder.Default
    private boolean messagingEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.VERIFIED;

    @Enumerated(EnumType.STRING)
    @Column(name = "public_profile_status", nullable = false, length = 30)
    @Builder.Default
    private ProfileStatus publicProfileStatus = ProfileStatus.PUBLISHED;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "lawyer_specializations",
            joinColumns = @JoinColumn(name = "lawyer_profile_id"),
            inverseJoinColumns = @JoinColumn(name = "specialization_id")
    )
    @Builder.Default
    private Set<LegalSpecialization> specializations = new HashSet<>();

    @Column(name = "working_days", length = 255)
    @Builder.Default
    private String workingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY";

    @Column(name = "working_hours_start", length = 10)
    @Builder.Default
    private String workingHoursStart = "09:00";

    @Column(name = "working_hours_end", length = 10)
    @Builder.Default
    private String workingHoursEnd = "18:00";

    @Column(name = "break_start_time", length = 10)
    @Builder.Default
    private String breakStartTime = "13:00";

    @Column(name = "break_end_time", length = 10)
    @Builder.Default
    private String breakEndTime = "14:00";

    @Column(name = "time_zone", length = 50)
    @Builder.Default
    private String timeZone = "Asia/Kolkata";

    @Column(name = "availability_status", length = 30)
    @Builder.Default
    private String availabilityStatus = "AVAILABLE";

    @OneToMany(mappedBy = "lawyerProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LegalService> services = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (shortUid == null || shortUid.isBlank()) {
            shortUid = com.lawinomeet.user.util.ShortUidGenerator.generate();
        }
        if (workingDays == null || workingDays.isBlank()) {
            workingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY";
        }
        if (workingHoursStart == null || workingHoursStart.isBlank()) {
            workingHoursStart = "09:00";
        }
        if (workingHoursEnd == null || workingHoursEnd.isBlank()) {
            workingHoursEnd = "18:00";
        }
        if (timeZone == null || timeZone.isBlank()) {
            timeZone = "Asia/Kolkata";
        }
        if (availabilityStatus == null || availabilityStatus.isBlank()) {
            availabilityStatus = "AVAILABLE";
        }
    }
}
