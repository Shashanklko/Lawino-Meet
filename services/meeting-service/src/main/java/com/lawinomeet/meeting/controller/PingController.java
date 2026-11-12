package com.lawinomeet.meeting.controller;

import com.lawinomeet.meeting.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class PingController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("Meeting Service is healthy and operational", Map.of(
                "service", "meeting-service",
                "status", "UP",
                "port", 8084
        )));
    }
}
