package com.jurisone.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.jurisone.user.enums.Role;

@Data
public class UserRequest{
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
   private String email;

   @NotBlank(message = " Password is required")
   @Size(min = 8 , message = "Password must be at least 8 character long")
   private String password;

   @NotBlank(message = "First name is required")
   private String firstname;
   private String lastname;

   @NotNull(message = "Role is required")
   private Role role;
}
