package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.FirmRole;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteMemberRequest {

    @NotBlank(message = "Lawyer username is required")
    private String lawyerUsername;

    @Builder.Default
    private FirmRole roleInFirm = FirmRole.ASSOCIATE;
}
