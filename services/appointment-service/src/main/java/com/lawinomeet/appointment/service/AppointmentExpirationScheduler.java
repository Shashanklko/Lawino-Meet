package com.lawinomeet.appointment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentExpirationScheduler {

    private final AppointmentService appointmentService;

    // Run every minute to check and expire overdue pending appointment requests
    @Scheduled(fixedDelay = 60000)
    public void processOverdueAppointments() {
        try {
            int expiredCount = appointmentService.expirePendingAppointments();
            if (expiredCount > 0) {
                log.info("Expired {} overdue pending appointment requests", expiredCount);
            }
        } catch (Exception e) {
            log.error("Error during appointment expiration job: {}", e.getMessage(), e);
        }
    }
}
