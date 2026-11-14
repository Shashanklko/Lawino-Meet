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
public class SignalingPayload {

    @NotBlank(message = "Signaling message type is required")
    private String type; // OFFER, ANSWER, ICE_CANDIDATE, JOIN, LEAVE, END

    private String senderUserPublicId;

    private String targetUserPublicId;

    private Object data;
}
