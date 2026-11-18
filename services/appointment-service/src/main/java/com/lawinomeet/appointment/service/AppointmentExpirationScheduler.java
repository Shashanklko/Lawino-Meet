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

    // Run every minute to auto-confirm appointments in COMPLETION_REQUESTED whose 24-hour response window has passed
    @Scheduled(fixedDelay = 60000)
    public void processAutoSettlements() {
        try {
            int autoSettledCount = appointmentService.autoSettleOverdueAppointments();
            if (autoSettledCount > 0) {
                log.info("Auto-settled {} completed appointments after 24-hour client response window", autoSettledCount);
            }
        } catch (Exception e) {
            log.error("Error during 24-hour auto-settlement job: {}", e.getMessage(), e);
        }
    }
}
