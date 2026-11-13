package com.lawinomeet.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateClientProfileRequest {

    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    @Size(max = 25, message = "Phone must not exceed 25 characters")
    private String phone;

    private String profileImageUrl;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;
}
