package com.lawinomeet.appointment.dto;

import com.lawinomeet.appointment.entity.ConsultationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    @NotBlank(message = "Slot public ID is required")
    private String slotPublicId;

    private Long serviceId;

    private String firmPublicId;

    private ConsultationType consultationType;

    @NotBlank(message = "Consultation reason is required")
    @Size(max = 2000, message = "Consultation reason cannot exceed 2000 characters")
    private String consultationReason;
}
