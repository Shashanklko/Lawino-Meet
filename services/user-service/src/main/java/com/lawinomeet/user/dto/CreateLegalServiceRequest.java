package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.ConsultationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLegalServiceRequest {

    @NotBlank(message = "Service name is required")
    private String serviceName;

    private String description;

    @NotNull(message = "Consultation type is required")
    private ConsultationType consultationType;

    @NotNull(message = "Duration in minutes is required")
    @Min(value = 10, message = "Duration must be at least 10 minutes")
    private Integer durationMinutes;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Fee cannot be negative")
    private BigDecimal consultationFee;

    @Builder.Default
    private String currency = "INR";
}
