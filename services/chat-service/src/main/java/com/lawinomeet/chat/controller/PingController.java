package com.lawinomeet.chat.controller;

import com.lawinomeet.chat.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class PingController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("Chat Service is healthy and operational", Map.of(
                "service", "chat-service",
                "status", "UP",
                "port", 8086
        )));
    }
}
