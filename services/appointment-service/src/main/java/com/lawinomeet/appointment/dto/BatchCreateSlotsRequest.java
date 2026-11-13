package com.lawinomeet.appointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateSlotsRequest {

    @NotEmpty(message = "Slots list cannot be empty")
    @Valid
    private List<CreateSlotRequest> slots;
}
