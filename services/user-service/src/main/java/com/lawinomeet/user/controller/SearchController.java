package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.LawFirmDto;
import com.lawinomeet.user.dto.LawyerProfileDto;
import com.lawinomeet.user.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/lawyers")
    public ResponseEntity<ApiResponse<Page<LawyerProfileDto>>> searchLawyers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Long specializationId,
            @RequestParam(required = false) Integer minExperience,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LawyerProfileDto> results = searchService.searchLawyers(query, city, specializationId, minExperience, pageable);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/firms")
    public ResponseEntity<ApiResponse<Page<LawFirmDto>>> searchFirms(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LawFirmDto> results = searchService.searchFirms(query, city, pageable);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }
}
