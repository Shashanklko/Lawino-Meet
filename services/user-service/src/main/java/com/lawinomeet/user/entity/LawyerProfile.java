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

    @OneToMany(mappedBy = "lawyerProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LegalService> services = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
