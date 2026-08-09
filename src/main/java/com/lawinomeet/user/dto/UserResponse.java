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
}
