package com.lawinomeet.appointment.controller;

import com.lawinomeet.appointment.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class PingController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("Appointment Service is healthy and operational", Map.of(
                "service", "appointment-service",
                "status", "UP",
                "port", 8083
        )));
    }
}
