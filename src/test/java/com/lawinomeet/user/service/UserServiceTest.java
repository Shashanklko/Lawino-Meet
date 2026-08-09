package com.lawinomeetMeetmeet.user.service;

import com.lawinomeetMeetmeet.user.dto.UserRequest;
import com.lawinomeetMeetmeet.user.dto.UserResponse;
import com.lawinomeetMeetmeet.user.entity.User;
import com.lawinomeetMeetmeet.user.entity.ProfessionalProfile;
import com.lawinomeetMeetmeet.user.enums.Role;
import com.lawinomeetMeetmeet.user.repository.UserRepository;
import com.lawinomeetMeetmeet.user.repository.ProfessionalProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfessionalProfileRepository professionalProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImp userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createUser_Client_ShouldNotCreateProfile() {
        UserRequest request = new UserRequest();
        request.setEmail("client@test.com");
        request.setPassword("password123");
        request.setRole(Role.CLIENT);

        User user = new User();
        user.setEmail(request.getEmail());
        user.setRole(Role.CLIENT);

        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.createUser(request);

        assertNotNull(response);
        verify(professionalProfileRepository, never()).save(any(ProfessionalProfile.class));
    }

    @Test
    void createUser_Lawyer_ShouldCreateProfile() {
        UserRequest request = new UserRequest();
        request.setEmail("lawyer@test.com");
        request.setPassword("password123");
        request.setRole(Role.LAWYER);

        User user = new User();
        user.setId(1L);
        user.setEmail(request.getEmail());
        user.setRole(Role.LAWYER);

        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.createUser(request);

        assertNotNull(response);
        verify(professionalProfileRepository, times(1)).save(any(ProfessionalProfile.class));
    }
}
