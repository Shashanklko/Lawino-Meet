package com.jurisone.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jurisone.user.enums.Role;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor // hibernate will create java object when load data from database.
@AllArgsConstructor // it let us to create object easily
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String  password;
    private String firstname;
    private String lastname;
    @Enumerated(EnumType.STRING)
    private Role role;
    private Integer globalTokenBalance = 5;

}
