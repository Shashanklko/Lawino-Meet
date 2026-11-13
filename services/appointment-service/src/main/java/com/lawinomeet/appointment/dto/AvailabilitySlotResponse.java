package com.lawinomeet.appointment.dto;

import com.lawinomeet.appointment.entity.AvailabilitySlot;
import com.lawinomeet.appointment.entity.SlotStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotResponse {

    private String publicId;
    private String lawyerUserPublicId;
    private Instant startTime;
    private Instant endTime;
    private SlotStatus slotStatus;
    private Instant createdAt;

    public static AvailabilitySlotResponse fromEntity(AvailabilitySlot slot) {
        if (slot == null) {
            return null;
        }
        return AvailabilitySlotResponse.builder()
                .publicId(slot.getPublicId())
                .lawyerUserPublicId(slot.getLawyerUserPublicId())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .slotStatus(slot.getSlotStatus())
                .createdAt(slot.getCreatedAt())
                .build();
    }
}
