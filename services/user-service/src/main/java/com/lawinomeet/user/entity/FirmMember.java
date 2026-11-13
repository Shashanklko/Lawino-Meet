package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "firm_members", indexes = {
        @Index(name = "idx_firm_member_firm_id", columnList = "firm_id"),
        @Index(name = "idx_firm_member_lawyer", columnList = "lawyer_user_public_id"),
        @Index(name = "idx_firm_member_status", columnList = "membership_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FirmMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "firm_id", nullable = false)
    private LawFirm firm;

    @Column(name = "lawyer_user_public_id", nullable = false, length = 36)
    private String lawyerUserPublicId;

    @Column(name = "lawyer_username", length = 50)
    private String lawyerUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_status", nullable = false, length = 30)
    @Builder.Default
    private MembershipStatus membershipStatus = MembershipStatus.INVITED;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_in_firm", nullable = false, length = 30)
    @Builder.Default
    private FirmRole roleInFirm = FirmRole.ASSOCIATE;

    @Column(name = "invited_at", nullable = false)
    @Builder.Default
    private Instant invitedAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
