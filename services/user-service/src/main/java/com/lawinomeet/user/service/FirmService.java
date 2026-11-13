package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.entity.*;
import com.lawinomeet.user.exception.ApiException;
import com.lawinomeet.user.repository.FirmMemberRepository;
import com.lawinomeet.user.repository.LawFirmRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import com.lawinomeet.user.repository.LegalServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FirmService {

    private final LawFirmRepository firmRepository;
    private final FirmMemberRepository firmMemberRepository;
    private final LawyerProfileRepository lawyerProfileRepository;
    private final LegalServiceRepository legalServiceRepository;

    @Transactional
    public LawFirmDto createFirm(String adminUserPublicId, CreateLawFirmRequest request) {
        String firmName = request.getFirmName().trim();
        if (firmRepository.existsByFirmNameIgnoreCase(firmName)) {
            throw new ApiException("A law firm with this name already exists", HttpStatus.CONFLICT, "FIRM_ALREADY_EXISTS");
        }

        String slug = generateFirmSlug(firmName);

        LawFirm firm = LawFirm.builder()
                .publicId(UUID.randomUUID().toString())
                .adminUserPublicId(adminUserPublicId)
                .firmName(firmName)
                .slug(slug)
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .contactEmail(request.getContactEmail().trim().toLowerCase())
                .contactPhone(request.getContactPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        LawFirm saved = firmRepository.save(firm);
        log.info("Created new law firm: '{}' with publicId: {}", saved.getFirmName(), saved.getPublicId());
        return LawFirmDto.fromEntity(saved);
    }

    @Transactional
    public LawFirmDto updateFirm(String adminUserPublicId, String firmPublicId, UpdateLawFirmRequest request) {
        LawFirm firm = firmRepository.findByPublicId(firmPublicId)
                .orElseThrow(() -> new ApiException("Law firm not found", HttpStatus.NOT_FOUND, "FIRM_NOT_FOUND"));

        if (!firm.getAdminUserPublicId().equals(adminUserPublicId)) {
            throw new ApiException("You are not authorized to update this firm", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        if (request.getFirmName() != null) firm.setFirmName(request.getFirmName().trim());
        if (request.getDescription() != null) firm.setDescription(request.getDescription().trim());
        if (request.getLogoUrl() != null) firm.setLogoUrl(request.getLogoUrl().trim());
        if (request.getContactEmail() != null) firm.setContactEmail(request.getContactEmail().trim().toLowerCase());
        if (request.getContactPhone() != null) firm.setContactPhone(request.getContactPhone().trim());
        if (request.getAddress() != null) firm.setAddress(request.getAddress().trim());
        if (request.getCity() != null) firm.setCity(request.getCity().trim());
        if (request.getState() != null) firm.setState(request.getState().trim());
        if (request.getCountry() != null) firm.setCountry(request.getCountry().trim());

        LawFirm saved = firmRepository.save(firm);
        return LawFirmDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public LawFirmDto getFirmDetails(String firmIdentifier) {
        LawFirm firm = firmRepository.findByPublicId(firmIdentifier)
                .or(() -> firmRepository.findBySlugIgnoreCase(firmIdentifier))
                .orElseThrow(() -> new ApiException("Law firm not found: " + firmIdentifier, HttpStatus.NOT_FOUND, "FIRM_NOT_FOUND"));

        return LawFirmDto.fromEntity(firm);
    }

    @Transactional(readOnly = true)
    public Page<LawFirmDto> getAllFirms(Pageable pageable) {
        return firmRepository.findAllByVerificationStatus(VerificationStatus.VERIFIED, pageable)
                .map(LawFirmDto::fromEntity);
    }

    @Transactional
    public FirmMemberDto inviteLawyer(String adminUserPublicId, String firmPublicId, InviteMemberRequest request) {
        LawFirm firm = firmRepository.findByPublicId(firmPublicId)
                .orElseThrow(() -> new ApiException("Law firm not found", HttpStatus.NOT_FOUND, "FIRM_NOT_FOUND"));

        if (!firm.getAdminUserPublicId().equals(adminUserPublicId)) {
            throw new ApiException("You are not authorized to manage this firm", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        LawyerProfile lawyer = lawyerProfileRepository.findByUsernameIgnoreCase(request.getLawyerUsername())
                .orElseThrow(() -> new ApiException("Lawyer not found with username: " + request.getLawyerUsername(), HttpStatus.NOT_FOUND, "LAWYER_NOT_FOUND"));

        // Check if lawyer already has an active firm membership (Rule: lawyer can belong to max 1 active firm)
        Optional<FirmMember> activeMembership = firmMemberRepository
                .findByLawyerUserPublicIdAndMembershipStatus(lawyer.getUserPublicId(), MembershipStatus.ACCEPTED);
        if (activeMembership.isPresent()) {
            throw new ApiException("Lawyer is already an active member of firm: " + activeMembership.get().getFirm().getFirmName(), HttpStatus.CONFLICT, "LAWYER_ALREADY_IN_FIRM");
        }

        // Check if already invited to this firm
        boolean alreadyInvited = firmMemberRepository
                .existsByFirmIdAndLawyerUserPublicIdAndMembershipStatus(firm.getId(), lawyer.getUserPublicId(), MembershipStatus.INVITED);
        if (alreadyInvited) {
            throw new ApiException("Lawyer already has a pending invitation for this firm", HttpStatus.CONFLICT, "INVITATION_ALREADY_PENDING");
        }

        FirmMember member = FirmMember.builder()
                .firm(firm)
                .lawyerUserPublicId(lawyer.getUserPublicId())
                .lawyerUsername(lawyer.getUsername())
                .membershipStatus(MembershipStatus.INVITED)
                .roleInFirm(request.getRoleInFirm() != null ? request.getRoleInFirm() : FirmRole.ASSOCIATE)
                .invitedAt(Instant.now())
                .build();

        FirmMember saved = firmMemberRepository.save(member);
        log.info("Law firm '{}' invited lawyer '{}'", firm.getFirmName(), lawyer.getUsername());
        return FirmMemberDto.fromEntity(saved);
    }

    @Transactional
    public FirmMemberDto acceptInvitation(String lawyerUserPublicId, Long invitationId) {
        FirmMember member = firmMemberRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException("Invitation not found", HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND"));

        if (!member.getLawyerUserPublicId().equals(lawyerUserPublicId)) {
            throw new ApiException("You are not authorized to accept this invitation", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        if (member.getMembershipStatus() != MembershipStatus.INVITED) {
            throw new ApiException("Invitation is no longer pending", HttpStatus.BAD_REQUEST, "INVALID_INVITATION_STATUS");
        }

        // Enforce max 1 active firm membership rule
        Optional<FirmMember> currentActive = firmMemberRepository
                .findByLawyerUserPublicIdAndMembershipStatus(lawyerUserPublicId, MembershipStatus.ACCEPTED);
        if (currentActive.isPresent()) {
            throw new ApiException("You are already an active member of another firm. Please leave that firm first.", HttpStatus.CONFLICT, "ALREADY_IN_FIRM");
        }

        member.setMembershipStatus(MembershipStatus.ACCEPTED);
        member.setAcceptedAt(Instant.now());
        FirmMember saved = firmMemberRepository.save(member);
        log.info("Lawyer '{}' accepted invitation to firm '{}'", member.getLawyerUsername(), member.getFirm().getFirmName());
        return FirmMemberDto.fromEntity(saved);
    }

    @Transactional
    public FirmMemberDto rejectInvitation(String lawyerUserPublicId, Long invitationId) {
        FirmMember member = firmMemberRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException("Invitation not found", HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND"));

        if (!member.getLawyerUserPublicId().equals(lawyerUserPublicId)) {
            throw new ApiException("You are not authorized to reject this invitation", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        member.setMembershipStatus(MembershipStatus.REJECTED);
        FirmMember saved = firmMemberRepository.save(member);
        log.info("Lawyer '{}' rejected invitation to firm '{}'", member.getLawyerUsername(), member.getFirm().getFirmName());
        return FirmMemberDto.fromEntity(saved);
    }

    @Transactional
    public void deactivateMember(String adminUserPublicId, String firmPublicId, Long memberId) {
        LawFirm firm = firmRepository.findByPublicId(firmPublicId)
                .orElseThrow(() -> new ApiException("Law firm not found", HttpStatus.NOT_FOUND, "FIRM_NOT_FOUND"));

        if (!firm.getAdminUserPublicId().equals(adminUserPublicId)) {
            throw new ApiException("You are not authorized to manage this firm", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        FirmMember member = firmMemberRepository.findById(memberId)
                .orElseThrow(() -> new ApiException("Firm member not found", HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND"));

        if (!member.getFirm().getId().equals(firm.getId())) {
            throw new ApiException("Member does not belong to this firm", HttpStatus.BAD_REQUEST, "INVALID_MEMBER");
        }

        member.setMembershipStatus(MembershipStatus.INACTIVE);
        firmMemberRepository.save(member);
        log.info("Firm '{}' deactivated member '{}'", firm.getFirmName(), member.getLawyerUsername());
    }

    @Transactional
    public LegalServiceDto addFirmService(String adminUserPublicId, String firmPublicId, CreateLegalServiceRequest request) {
        LawFirm firm = firmRepository.findByPublicId(firmPublicId)
                .orElseThrow(() -> new ApiException("Law firm not found", HttpStatus.NOT_FOUND, "FIRM_NOT_FOUND"));

        if (!firm.getAdminUserPublicId().equals(adminUserPublicId)) {
            throw new ApiException("You are not authorized to manage this firm", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        LegalService service = LegalService.builder()
                .firm(firm)
                .serviceName(request.getServiceName().trim())
                .description(request.getDescription())
                .consultationType(request.getConsultationType())
                .durationMinutes(request.getDurationMinutes())
                .consultationFee(request.getConsultationFee())
                .currency(request.getCurrency())
                .isActive(true)
                .build();

        LegalService saved = legalServiceRepository.save(service);
        log.info("Firm '{}' added standardized service: '{}'", firm.getFirmName(), saved.getServiceName());
        return LegalServiceDto.fromEntity(saved);
    }

    private String generateFirmSlug(String firmName) {
        String base = firmName.trim().toLowerCase().replaceAll("[^a-z0-9]", "-");
        String candidate = base;
        int count = 1;
        while (firmRepository.existsBySlugIgnoreCase(candidate)) {
            candidate = base + "-" + count++;
        }
        return candidate;
    }
}
