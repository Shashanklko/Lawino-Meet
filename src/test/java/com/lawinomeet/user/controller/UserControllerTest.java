package com.lawinomeet.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.auth.util.JwtUtil;
import com.lawinomeet.user.dto.UserRequest;
import com.lawinomeet.user.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    private String validToken;

    @BeforeEach
    void setUp() {
        User userDetails = new User("admin@lawinomeet.com", "Password123!",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
        validToken = "Bearer " + jwtUtil.generateToken(userDetails);
    }

    @Test
    void createUser_PublicEndpoint_WithoutToken_ShouldSucceed() throws Exception {
        UserRequest request = new UserRequest();
        request.setEmail("created.user@test.com");
        request.setPassword("Password123!");
        request.setFirstname("Created");
        request.setLastname("User");
        request.setRole(Role.CLIENT);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("created.user@test.com"));
    }

    @Test
    void getAllUsers_WithoutToken_ShouldBeForbiddenOrUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getAllUsers_WithToken_ShouldReturnUserList() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getUserById_WithToken_ShouldReturnUser() throws Exception {
        mockMvc.perform(get("/api/users/1")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
}
