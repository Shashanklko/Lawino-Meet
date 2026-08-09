package com.lawinomeet.admin.controller;

import com.lawinomeet.auth.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAndDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    private String adminToken;

    @BeforeEach
    void setUp() {
        User adminUser = new User("admin@lawinomeet.com", "Password123!",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
        adminToken = "Bearer " + jwtUtil.generateToken(adminUser);
    }

    @Test
    void getAdminDashboard_WithoutToken_ShouldBeForbiddenOrUnauthorized() throws Exception {
        mockMvc.perform(get("/api/dashboard/admin"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getAdminDashboard_WithToken_ShouldReturnMetrics() throws Exception {
        mockMvc.perform(get("/api/dashboard/admin")
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalDisputesCount").exists());
    }

    @Test
    void getDisputes_WithToken_ShouldReturnDisputesList() throws Exception {
        mockMvc.perform(get("/api/admin/disputes")
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
