package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.entity.*;
import com.lawinomeet.user.exception.ApiException;
import com.lawinomeet.user.repository.FirmMemberRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import com.lawinomeet.user.repository.LegalServiceRepository;
import com.lawinomeet.user.repository.LegalSpecializationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LawyerService {

    private final LawyerProfileRepository lawyerProfileRepository;
    private final LegalSpecializationRepository specializationRepository;
    private final LegalServiceRepository legalServiceRepository;
    private final FirmMemberRepository firmMemberRepository;

    @Transactional
    public LawyerProfileDto getOrCreateMyProfile(String userPublicId, String username) {
        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(userPublicId)
                .orElseGet(() -> {
                    String slug = generateSlug(username);
                    LawyerProfile newProfile = LawyerProfile.builder()
                            .userPublicId(userPublicId)
                            .username(username)
                            .slug(slug)
                            .fullName(username)
                            .city("Delhi")
                            .country("India")
                            .messagingEnabled(true)
                            .verificationStatus(VerificationStatus.VERIFIED)
                            .publicProfileStatus(ProfileStatus.PUBLISHED)
                            .build();
                    return lawyerProfileRepository.save(newProfile);
                });

        return enrichWithFirmInfo(profile);
    }

    @Transactional
    public LawyerProfileDto updateMyProfile(String userPublicId, String username, UpdateLawyerProfileRequest request) {
        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(userPublicId)
                .orElseGet(() -> LawyerProfile.builder()
                        .userPublicId(userPublicId)
                        .username(username)
                        .slug(generateSlug(username))
                        .verificationStatus(VerificationStatus.VERIFIED)
                        .publicProfileStatus(ProfileStatus.PUBLISHED)
                        .build());

        if (request.getFullName() != null) profile.setFullName(request.getFullName().trim());
        if (request.getBiography() != null) profile.setBiography(request.getBiography().trim());
        if (request.getProfileImageUrl() != null) profile.setProfileImageUrl(request.getProfileImageUrl().trim());
        if (request.getQualification() != null) profile.setQualification(request.getQualification().trim());
        if (request.getExperienceYears() != null) profile.setExperienceYears(request.getExperienceYears());
        if (request.getPhone() != null) profile.setPhone(request.getPhone().trim());
        if (request.getEmailPublic() != null) profile.setEmailPublic(request.getEmailPublic().trim());
        if (request.getCity() != null) profile.setCity(request.getCity().trim());
        if (request.getState() != null) profile.setState(request.getState().trim());
        if (request.getCountry() != null) profile.setCountry(request.getCountry().trim());
        if (request.getMessagingEnabled() != null) profile.setMessagingEnabled(request.getMessagingEnabled());
        if (request.getPublicProfileStatus() != null) profile.setPublicProfileStatus(request.getPublicProfileStatus());

        if (request.getSpecializationIds() != null) {
            Set<LegalSpecialization> specs = new HashSet<>(specializationRepository.findAllById(request.getSpecializationIds()));
            profile.setSpecializations(specs);
        }

        LawyerProfile saved = lawyerProfileRepository.save(profile);
        log.info("Updated professional lawyer profile for user: {}", username);
        return enrichWithFirmInfo(saved);
    }

    @Transactional
    public boolean toggleMessaging(String userPublicId, boolean enabled) {
        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(userPublicId)
                .orElseThrow(() -> new ApiException("Lawyer profile not found", HttpStatus.NOT_FOUND, "LAWYER_NOT_FOUND"));
        profile.setMessagingEnabled(enabled);
        lawyerProfileRepository.save(profile);
        log.info("Messaging toggled to {} for lawyer: {}", enabled, profile.getUsername());
        return enabled;
    }

    @Transactional
    public LegalServiceDto addLegalService(String userPublicId, CreateLegalServiceRequest request) {
        LawyerProfile profile = lawyerProfileRepository.findByUserPublicId(userPublicId)
                .orElseThrow(() -> new ApiException("Lawyer profile not found", HttpStatus.NOT_FOUND, "LAWYER_NOT_FOUND"));

        LegalService service = LegalService.builder()
                .lawyerProfile(profile)
                .serviceName(request.getServiceName().trim())
                .description(request.getDescription())
                .consultationType(request.getConsultationType())
                .durationMinutes(request.getDurationMinutes())
                .consultationFee(request.getConsultationFee())
                .currency(request.getCurrency())
                .isActive(true)
                .build();

        LegalService saved = legalServiceRepository.save(service);
        return LegalServiceDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public LawyerProfileDto getLawyerPublicProfile(String identifier) {
        LawyerProfile profile = lawyerProfileRepository.findBySlugIgnoreCase(identifier)
                .or(() -> lawyerProfileRepository.findByUserPublicId(identifier))
                .or(() -> lawyerProfileRepository.findByUsernameIgnoreCase(identifier))
                .orElseThrow(() -> new ApiException("Lawyer profile not found: " + identifier, HttpStatus.NOT_FOUND, "LAWYER_NOT_FOUND"));

        return enrichWithFirmInfo(profile);
    }

    @Transactional(readOnly = true)
    public Page<LawyerProfileDto> getPublicLawyers(Pageable pageable) {
        return lawyerProfileRepository.findAllByVerificationStatusAndPublicProfileStatus(
                VerificationStatus.VERIFIED, ProfileStatus.PUBLISHED, pageable
        ).map(this::enrichWithFirmInfo);
    }

    private LawyerProfileDto enrichWithFirmInfo(LawyerProfile profile) {
        LawyerProfileDto dto = LawyerProfileDto.fromEntity(profile);
        Optional<FirmMember> activeMembership = firmMemberRepository
                .findByLawyerUserPublicIdAndMembershipStatus(profile.getUserPublicId(), MembershipStatus.ACCEPTED);

        activeMembership.ifPresent(m -> {
            dto.setAssociatedFirmName(m.getFirm().getFirmName());
            dto.setAssociatedFirmSlug(m.getFirm().getSlug());
        });

        return dto;
    }

    private String generateSlug(String username) {
        String base = username.trim().toLowerCase().replaceAll("[^a-z0-9]", "-");
        String candidate = base;
        int count = 1;
        while (lawyerProfileRepository.existsBySlugIgnoreCase(candidate)) {
            candidate = base + "-" + count++;
        }
        return candidate;
    }
}
