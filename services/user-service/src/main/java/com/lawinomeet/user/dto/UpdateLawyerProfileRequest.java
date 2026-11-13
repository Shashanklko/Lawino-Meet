package com.lawinomeet.user.dto;

import com.lawinomeet.user.entity.ProfileStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLawyerProfileRequest {

    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    private String biography;

    private String profileImageUrl;

    @Size(max = 200, message = "Qualification must not exceed 200 characters")
    private String qualification;

    @Min(value = 0, message = "Experience years cannot be negative")
    private Integer experienceYears;

    @Size(max = 25, message = "Phone must not exceed 25 characters")
    private String phone;

    private String emailPublic;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    private Boolean messagingEnabled;

    private ProfileStatus publicProfileStatus;

    private Set<Long> specializationIds;
}
