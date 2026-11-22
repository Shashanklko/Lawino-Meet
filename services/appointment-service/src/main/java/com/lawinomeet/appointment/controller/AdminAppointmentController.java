package com.lawinomeet.appointment.controller;

import com.lawinomeet.appointment.dto.ApiResponse;
import com.lawinomeet.appointment.dto.AppointmentResponse;
import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class AdminAppointmentController {

    private final AppointmentRepository appointmentRepository;

    /**
     * Platform-wide Appointment Listing DTO
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String bookingChannel) {
        List<Appointment> all = appointmentRepository.findAll();

        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            all = all.stream()
                    .filter(a -> a.getAppointmentStatus().name().equalsIgnoreCase(status))
                    .toList();
        }

        List<AppointmentResponse> dtoList = all.stream()
                .map(AppointmentResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok("Platform appointments retrieved successfully", dtoList));
    }

    /**
     * Appointment Statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAppointmentStats() {
        List<Appointment> all = appointmentRepository.findAll();
        long total = all.size();
        long confirmed = all.stream().filter(a -> a.getAppointmentStatus() == AppointmentStatus.CONFIRMED).count();
        long pending = all.stream().filter(a -> a.getAppointmentStatus() == AppointmentStatus.PENDING).count();
        long completed = all.stream().filter(a -> a.getAppointmentStatus() == AppointmentStatus.COMPLETED).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAppointments", total);
        stats.put("confirmed", confirmed);
        stats.put("pending", pending);
        stats.put("completed", completed);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Platform Admin Cancel Action
     */
    @PostMapping("/{publicId}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelAppointment(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String reason = request.getOrDefault("reason", "Cancelled by Platform Administrator.");
        log.info("Admin cancelled appointment {}: reason={}", publicId, reason);

        appointmentRepository.findByPublicId(publicId).ifPresent(apt -> {
            apt.setAppointmentStatus(AppointmentStatus.CANCELLED);
            appointmentRepository.save(apt);
        });

        Map<String, Object> res = new HashMap<>();
        res.put("appointmentPublicId", publicId);
        res.put("cancelled", true);
        res.put("reason", reason);
        res.put("auditTimestamp", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully", res));
    }

    /**
     * Platform Admin Escalation Action
     */
    @PostMapping("/{publicId}/escalate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> escalateAppointment(
            @PathVariable String publicId,
            @RequestBody Map<String, String> request) {
        String reason = request.getOrDefault("reason", "Delayed advocate response or scheduling conflict.");
        String adminNotes = request.getOrDefault("notes", "Escalated for immediate senior partner or support coordination.");

        log.info("Admin escalated appointment {}: reason={}, notes={}", publicId, reason, adminNotes);

        Map<String, Object> res = new HashMap<>();
        res.put("appointmentPublicId", publicId);
        res.put("escalated", true);
        res.put("reason", reason);
        res.put("auditTimestamp", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponse.ok("Appointment escalated successfully", res));
    }
}
