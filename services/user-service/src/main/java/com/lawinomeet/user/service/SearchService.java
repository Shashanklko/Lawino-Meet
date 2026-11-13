package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.LawFirmDto;
import com.lawinomeet.user.dto.LawyerProfileDto;
import com.lawinomeet.user.repository.LawFirmRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final LawyerProfileRepository lawyerProfileRepository;
    private final LawFirmRepository lawFirmRepository;

    @Transactional(readOnly = true)
    public Page<LawyerProfileDto> searchLawyers(String query, String city, Long specializationId, Integer minExperience, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isBlank()) ? query.trim() : null;
        String cleanCity = (city != null && !city.trim().isBlank()) ? city.trim() : null;

        return lawyerProfileRepository.searchLawyers(cleanQuery, cleanCity, specializationId, minExperience, pageable)
                .map(LawyerProfileDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<LawFirmDto> searchFirms(String query, String city, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isBlank()) ? query.trim() : null;
        String cleanCity = (city != null && !city.trim().isBlank()) ? city.trim() : null;

        return lawFirmRepository.searchFirms(cleanQuery, cleanCity, pageable)
                .map(LawFirmDto::fromEntity);
    }
}
