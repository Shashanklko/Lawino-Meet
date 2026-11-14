package com.lawinomeet.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "Appointment public ID is required")
    private String appointmentPublicId;

    @NotBlank(message = "Client user public ID is required")
    private String clientUserPublicId;

    private String clientUsername;

    @NotBlank(message = "Lawyer user public ID is required")
    private String lawyerUserPublicId;

    private String lawyerUsername;
}
