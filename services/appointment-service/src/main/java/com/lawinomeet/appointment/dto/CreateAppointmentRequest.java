package com.lawinomeet.appointment.dto;

import com.lawinomeet.appointment.entity.ConsultationType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    // Primary slot (existing or created)
    private String slotPublicId;

    // Alternative slot (minimum 2 slots required from client)
    private String alternativeSlotPublicId;

    // Custom 1-hour time slots if client proposes custom times
    private Instant customStartTime1;
    private Instant customEndTime1;
    private Instant customStartTime2;
    private Instant customEndTime2;

    private String lawyerUserPublicId;

    // Structured JSON containing client's chosen slot options
    private String preferredSlotsJson;

    private Long serviceId;

    private String firmPublicId;

    private BigDecimal fee;

    private ConsultationType consultationType;

    @Size(max = 2000, message = "Consultation reason cannot exceed 2000 characters")
    private String consultationReason;
}
