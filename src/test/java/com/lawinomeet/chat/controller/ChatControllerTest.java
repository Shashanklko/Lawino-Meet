package com.lawinomeet.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.auth.util.JwtUtil;
import com.lawinomeet.chat.dto.StartChatRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.lawinomeet.user.repository.UserRepository userRepository;

    @org.springframework.boot.test.mock.mockito.MockBean
    private com.lawinomeet.chat.repository.ChatSessionRepository chatSessionRepository;

    private String validToken;
    private Long clientId;
    private Long lawyerId;

    @BeforeEach
    void setUp() {
        User userDetails = new User("client.sam@lawinomeet.com", "Password123!",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));
        validToken = "Bearer " + jwtUtil.generateToken(userDetails);

        clientId = userRepository.findByEmail("client.sam@lawinomeet.com")
                .map(com.lawinomeet.user.entity.User::getId).orElse(3L);
        lawyerId = userRepository.findByEmail("lawyer.john@lawinomeet.com")
                .map(com.lawinomeet.user.entity.User::getId).orElse(2L);

        com.lawinomeet.chat.model.ChatSession session = new com.lawinomeet.chat.model.ChatSession();
        session.setId("mock-session-101");
        session.setUserId(clientId);
        session.setProfessionalId(lawyerId);

        org.mockito.BDDMockito.given(chatSessionRepository.save(org.mockito.ArgumentMatchers.any(com.lawinomeet.chat.model.ChatSession.class)))
                .willReturn(session);
    }

    @Test
    void startChat_WithoutToken_ShouldReturnForbiddenOrUnauthorized() throws Exception {
        StartChatRequest request = new StartChatRequest();
        request.setUserId(clientId);
        request.setProfessionalId(lawyerId);

        mockMvc.perform(post("/api/chat/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void startChat_WithToken_ShouldSucceed() throws Exception {
        StartChatRequest request = new StartChatRequest();
        request.setUserId(clientId);
        request.setProfessionalId(lawyerId);

        mockMvc.perform(post("/api/chat/start")
                        .header(HttpHeaders.AUTHORIZATION, validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists());
    }
}
