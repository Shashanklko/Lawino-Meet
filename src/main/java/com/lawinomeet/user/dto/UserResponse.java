package com.lawinomeet.user.dto;

import lombok.Data;
import com.lawinomeet.user.enums.Role;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String firstname;  
    private String lastname;
    private Role role;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    private ProfessionalProfileDto profile;
    public ProfessionalProfileDto getProfile() { return profile; }
    public void setProfile(ProfessionalProfileDto profile) { this.profile = profile; }

    @Data
    public static class ProfessionalProfileDto {
        private String category;
        private String customGreeting;
        private String officeAddress;
        private Double chatUnlockFee;
        private Double consultationFee;
        private Boolean isVerified;
        private String specialization;
        private String bio;
    }
}
