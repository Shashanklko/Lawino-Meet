package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.LegalSpecialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LegalSpecializationRepository extends JpaRepository<LegalSpecialization, Long> {

    Optional<LegalSpecialization> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
