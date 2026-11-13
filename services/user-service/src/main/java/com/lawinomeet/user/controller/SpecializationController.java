package com.lawinomeet.user.controller;

import com.lawinomeet.user.dto.ApiResponse;
import com.lawinomeet.user.dto.SpecializationDto;
import com.lawinomeet.user.service.SpecializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/specializations")
@RequiredArgsConstructor
public class SpecializationController {

    private final SpecializationService specializationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SpecializationDto>>> getSpecializations() {
        List<SpecializationDto> specializations = specializationService.getAllSpecializations();
        return ResponseEntity.ok(ApiResponse.ok(specializations));
    }
}
