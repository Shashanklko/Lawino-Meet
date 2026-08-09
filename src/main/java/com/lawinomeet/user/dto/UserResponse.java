package com.lawinomeetMeetmeet.user.dto;

import lombok.Data;
import com.lawinomeetMeetmeet.user.enums.Role;

@Data
public class UserResponse{
    private Long id;
    private String email;
    private String firstname;  
    private String lastname;
    private Role role;
}
