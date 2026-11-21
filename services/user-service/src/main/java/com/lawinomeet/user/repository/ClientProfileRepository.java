package com.lawinomeet.user.repository;

import com.lawinomeet.user.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByUserPublicId(String userPublicId);

    Optional<ClientProfile> findByShortUid(String shortUid);

    Optional<ClientProfile> findByUsernameIgnoreCase(String username);

    boolean existsByUserPublicId(String userPublicId);
}
