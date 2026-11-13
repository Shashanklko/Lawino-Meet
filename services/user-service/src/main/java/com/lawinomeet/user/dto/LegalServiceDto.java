package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.ConsultationType;
import com.lawinomeet.user.entity.LegalService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalServiceDto {
    private Long id;
    private String serviceName;
    private String description;
    private ConsultationType consultationType;
    private Integer durationMinutes;
    private BigDecimal consultationFee;
    private String currency;
    private boolean isActive;

    public static LegalServiceDto fromEntity(LegalService entity) {
        return LegalServiceDto.builder()
                .id(entity.getId())
                .serviceName(entity.getServiceName())
                .description(entity.getDescription())
                .consultationType(entity.getConsultationType())
                .durationMinutes(entity.getDurationMinutes())
                .consultationFee(entity.getConsultationFee())
                .currency(entity.getCurrency())
                .isActive(entity.isActive())
                .build();
    }
}
