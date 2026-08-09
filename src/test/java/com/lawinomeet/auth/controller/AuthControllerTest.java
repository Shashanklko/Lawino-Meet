package com.lawinomeet.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.auth.dto.AuthRequest;
import com.lawinomeet.user.dto.UserRequest;
import com.lawinomeet.user.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_PublicEndpoint_WithoutToken_ShouldSucceed() throws Exception {
        UserRequest request = new UserRequest();
        request.setEmail("newuser.auth@test.com");
        request.setPassword("Password123!");
        request.setFirstname("Auth");
        request.setLastname("User");
        request.setRole(Role.CLIENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser.auth@test.com"))
                .andExpect(jsonPath("$.firstname").value("Auth"));
    }

    @Test
    void login_PublicEndpoint_ValidCredentials_ShouldReturnJwtToken() throws Exception {
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setEmail("admin@lawinomeet.com"); // From DataSeeder
        loginRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jwt").exists())
                .andExpect(jsonPath("$.message").value("Login successful"));
    }

    @Test
    void login_PublicEndpoint_InvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setEmail("admin@lawinomeet.com");
        loginRequest.setPassword("WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
