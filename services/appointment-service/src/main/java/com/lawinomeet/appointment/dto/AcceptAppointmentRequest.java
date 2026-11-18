package com.lawinomeet.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptAppointmentRequest {

    // Optional for in-person consultation: Lawyer's physical chamber address & directions
    private String chamberAddress;
    private String directionsInstructions;

    // Lawyer acceptance: Choose Option 1 or Option 2 from client's proposed 2 slots
    private Integer chosenSlotOption; // 1 = Primary slot, 2 = Alternative slot

    // Lawyer can also provide their own custom 1-hour time slot
    private String newSlotPublicId;
    private Instant newStartTime;
    private Instant newEndTime;
    private String rescheduleReason;
}
