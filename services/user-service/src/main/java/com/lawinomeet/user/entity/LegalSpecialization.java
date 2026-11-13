package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "legal_specializations", indexes = {
        @Index(name = "idx_specialization_name", columnList = "name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalSpecialization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;
}
