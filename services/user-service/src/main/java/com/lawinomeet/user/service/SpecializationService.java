package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.SpecializationDto;
import com.lawinomeet.user.entity.LegalSpecialization;
import com.lawinomeet.user.repository.LegalSpecializationRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpecializationService {

    private final LegalSpecializationRepository specializationRepository;

    @PostConstruct
    @Transactional
    public void seedInitialSpecializations() {
        if (specializationRepository.count() == 0) {
            List<LegalSpecialization> seeds = List.of(
                    LegalSpecialization.builder().name("Corporate & Commercial Law").description("Mergers, acquisitions, contracts, and business regulatory advisory.").build(),
                    LegalSpecialization.builder().name("Criminal Defense").description("Defense counsel for criminal trials, bail applications, and investigations.").build(),
                    LegalSpecialization.builder().name("Family & Matrimonial Law").description("Divorce, child custody, alimony, and domestic disputes.").build(),
                    LegalSpecialization.builder().name("Intellectual Property (IPR)").description("Trademarks, copyrights, patent filing, and infringement litigation.").build(),
                    LegalSpecialization.builder().name("Civil Litigation").description("Property disputes, recovery suits, consumer disputes, and injunctions.").build(),
                    LegalSpecialization.builder().name("Taxation Law").description("Direct and indirect taxes, GST compliance, and dispute resolution.").build(),
                    LegalSpecialization.builder().name("Real Estate & Property Law").description("Title verification, property registry, leasing, and tenant disputes.").build(),
                    LegalSpecialization.builder().name("Cyber & IT Law").description("Data privacy, cybercrime litigation, and digital compliance.").build()
            );
            specializationRepository.saveAll(seeds);
            log.info("Initialized {} core legal specializations", seeds.size());
        }
    }

    @Transactional(readOnly = true)
    public List<SpecializationDto> getAllSpecializations() {
        return specializationRepository.findAll().stream()
                .map(SpecializationDto::fromEntity)
                .collect(Collectors.toList());
    }
}
