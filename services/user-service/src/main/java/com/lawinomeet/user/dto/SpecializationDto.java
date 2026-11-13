package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.LegalSpecialization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationDto {
    private Long id;
    private String name;
    private String description;

    public static SpecializationDto fromEntity(LegalSpecialization s) {
        return SpecializationDto.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .build();
    }
}
