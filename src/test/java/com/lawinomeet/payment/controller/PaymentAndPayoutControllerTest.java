package com.lawinomeet.payment.controller;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentAndPayoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    private String validToken;

    @BeforeEach
    void setUp() {
        User userDetails = new User("lawyer.john@lawinomeet.com", "Password123!",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_LAWYER")));
        validToken = "Bearer " + jwtUtil.generateToken(userDetails);
    }

    @Test
    void getWalletDetails_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/payouts/wallet/2"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getWalletDetails_WithToken_ShouldReturnWallet() throws Exception {
        mockMvc.perform(get("/api/payouts/wallet/2")
                        .header(HttpHeaders.AUTHORIZATION, validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.availableWalletBalance").exists());
    }

    @Test
    void requestPayout_WithToken_ShouldCreatePayoutRequest() throws Exception {
        mockMvc.perform(post("/api/payouts/request")
                        .header(HttpHeaders.AUTHORIZATION, validToken)
                        .param("lawyerId", "2")
                        .param("amount", "200.0")
                        .param("bankDetails", "HDFC Bank, AC: 123456789, IFSC: HDFC0000123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requestedAmount").value(200.0));
    }
}
