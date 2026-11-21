package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "client_profiles", indexes = {
        @Index(name = "idx_client_user_public_id", columnList = "user_public_id", unique = true),
        @Index(name = "idx_client_short_uid", columnList = "short_uid", unique = true),
        @Index(name = "idx_client_username", columnList = "username", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_public_id", nullable = false, unique = true, length = 36, updatable = false)
    private String userPublicId;

    @Column(name = "short_uid", nullable = false, unique = true, length = 7)
    private String shortUid;

    @Column(nullable = false, unique = true, length = 50, updatable = false)
    private String username;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(length = 25)
    private String phone;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    @Builder.Default
    private String country = "India";

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
    }
}
