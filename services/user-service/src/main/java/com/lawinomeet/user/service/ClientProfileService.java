package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.ClientProfileDto;
import com.lawinomeet.user.dto.UpdateClientProfileRequest;
import com.lawinomeet.user.entity.ClientProfile;
import com.lawinomeet.user.repository.ClientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientProfileService {

    private final ClientProfileRepository clientProfileRepository;

    @Transactional
    public ClientProfileDto getOrCreateProfile(String userPublicId, String username) {
        ClientProfile profile = clientProfileRepository.findByUserPublicId(userPublicId)
                .orElseGet(() -> {
                    ClientProfile newProfile = ClientProfile.builder()
                            .userPublicId(userPublicId)
                            .username(username)
                            .fullName(username)
                            .country("India")
                            .build();
                    return clientProfileRepository.save(newProfile);
                });

        return ClientProfileDto.fromEntity(profile);
    }

    @Transactional
    public ClientProfileDto updateProfile(String userPublicId, String username, UpdateClientProfileRequest request) {
        ClientProfile profile = clientProfileRepository.findByUserPublicId(userPublicId)
                .orElseGet(() -> ClientProfile.builder()
                        .userPublicId(userPublicId)
                        .username(username)
                        .build());

        if (request.getFullName() != null) profile.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) profile.setPhone(request.getPhone().trim());
        if (request.getProfileImageUrl() != null) profile.setProfileImageUrl(request.getProfileImageUrl().trim());
        if (request.getCity() != null) profile.setCity(request.getCity().trim());
        if (request.getState() != null) profile.setState(request.getState().trim());
        if (request.getCountry() != null) profile.setCountry(request.getCountry().trim());

        ClientProfile saved = clientProfileRepository.save(profile);
        log.info("Updated client profile for user: {}", username);
        return ClientProfileDto.fromEntity(saved);
    }
}
