package com.lawinomeet.common.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RootRedirectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rootEndpoint_WithoutAuth_ShouldRedirectToFrontend() throws Exception {
        mockMvc.perform(get("/")
                        .header(HttpHeaders.ACCEPT, MediaType.TEXT_HTML_VALUE))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173"));
    }

    @Test
    void frontendEndpoint_WithoutAuth_ShouldRedirectToFrontend() throws Exception {
        mockMvc.perform(get("/frontend")
                        .header(HttpHeaders.ACCEPT, MediaType.TEXT_HTML_VALUE))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173"));
    }

    @Test
    void rootEndpoint_WithQueryParams_ShouldPreserveQueryParamsInRedirect() throws Exception {
        mockMvc.perform(get("/?ref=portal&lang=en")
                        .header(HttpHeaders.ACCEPT, MediaType.TEXT_HTML_VALUE))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173?ref=portal&lang=en"));
    }

    @Test
    void rootEndpoint_WithJsonAcceptHeader_ShouldReturnStatusJson() throws Exception {
        mockMvc.perform(get("/")
                        .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("LawinoMeet Backend API"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.frontendUrl").value("http://localhost:5173"));
    }

    @Test
    void apiStatusEndpoint_ShouldReturnServiceHealthInfo() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("LawinoMeet Backend API"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.swaggerDocs").value("/swagger-ui.html"));
    }
}
