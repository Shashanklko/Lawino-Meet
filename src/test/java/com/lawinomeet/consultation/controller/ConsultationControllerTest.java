package com.lawinomeet.consultation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.auth.util.JwtUtil;
import com.lawinomeet.consultation.dto.ConsultationRequest;
import com.lawinomeet.consultation.enums.ConsultationMode;
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

import java.time.LocalDateTime;
import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ConsultationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    private String validToken;

    @BeforeEach
    void setUp() {
        User userDetails = new User("client.sam@lawinomeet.com", "Password123!",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));
        validToken = "Bearer " + jwtUtil.generateToken(userDetails);
    }

    @Test
    void createRequest_WithoutToken_ShouldReturnForbiddenOrUnauthorized() throws Exception {
        ConsultationRequest request = new ConsultationRequest();
        request.setClientId(3L);
        request.setLawyerId(2L);
        request.setClientName("Sam Smith");
        request.setClientEmail("client.sam@lawinomeet.com");
        request.setClientPhoneNumber("+919876543210");
        request.setLocation("Delhi");
        request.setQuery("Property contract check.");
        request.setMode(ConsultationMode.ONLINE_VIDEO);
        request.setRequestedTimeSlot(LocalDateTime.now().plusDays(1));

        mockMvc.perform(post("/api/consultations/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void createRequest_WithToken_ShouldSucceed() throws Exception {
        ConsultationRequest request = new ConsultationRequest();
        request.setClientId(3L);
        request.setLawyerId(2L);
        request.setClientName("Sam Smith");
        request.setClientEmail("client.sam@lawinomeet.com");
        request.setClientPhoneNumber("+919876543210");
        request.setLocation("Delhi");
        request.setQuery("Property contract check.");
        request.setMode(ConsultationMode.ONLINE_VIDEO);
        request.setRequestedTimeSlot(LocalDateTime.now().plusDays(1));

        mockMvc.perform(post("/api/consultations/request")
                        .header(HttpHeaders.AUTHORIZATION, validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.meetingCode").exists());
    }

    @Test
    void getById_WithToken_ShouldReturnConsultation() throws Exception {
        mockMvc.perform(get("/api/consultations/1")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }
}
