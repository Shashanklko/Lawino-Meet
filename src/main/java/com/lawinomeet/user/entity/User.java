package com.lawinomeet.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.lawinomeet.user.enums.Role;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String password;
    private String firstname;
    private String lastname;
    @Enumerated(EnumType.STRING)
    private Role role;
    private Integer globalTokenBalance = 5;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Integer getGlobalTokenBalance() { return globalTokenBalance; }
    public void setGlobalTokenBalance(Integer globalTokenBalance) { this.globalTokenBalance = globalTokenBalance; }
}
