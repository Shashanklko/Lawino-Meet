package com.lawinomeet.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLawFirmRequest {

    @Size(max = 200, message = "Firm name cannot exceed 200 characters")
    private String firmName;

    private String description;

    private String logoUrl;

    @Email(message = "Contact email must be valid")
    private String contactEmail;

    @Size(max = 25, message = "Contact phone cannot exceed 25 characters")
    private String contactPhone;

    private String address;

    private String city;

    private String state;

    private String country;
}
