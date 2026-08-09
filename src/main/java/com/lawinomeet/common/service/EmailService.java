package com.lawinomeet.common.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendAppointmentConfirmationEmail(String toEmail, String clientName, String meetingCode, 
                                                 String mode, String timeSlot, String videoUrl, String officeAddress) {
        log.info("[EMAIL DISPATCH] Preparing confirmation email for: {} | Meeting Code: {}", toEmail, meetingCode);
        
        String subject = "lawinomeet Appointment Confirmation Pass: " + meetingCode;
        StringBuilder content = new StringBuilder();
        content.append("<h2>🏛️ lawinomeet Consultation Confirmation</h2>");
        content.append("<p>Dear <b>").append(clientName).append("</b>,</p>");
        content.append("<p>Your consultation booking has been successfully confirmed and paid.</p>");
        content.append("<ul>");
        content.append("<li><b>Meeting Code:</b> ").append(meetingCode).append("</li>");
        content.append("<li><b>Mode:</b> ").append(mode).append("</li>");
        content.append("<li><b>Time Slot:</b> ").append(timeSlot).append("</li>");
        
        if ("ONLINE_VIDEO".equalsIgnoreCase(mode) && videoUrl != null) {
            content.append("<li><b>Video Meeting Link:</b> <a href='").append(videoUrl).append("'>").append(videoUrl).append("</a></li>");
        } else if ("OFFLINE_OFFICE".equalsIgnoreCase(mode) && officeAddress != null) {
            content.append("<li><b>Lawyer Office Address:</b> ").append(officeAddress).append("</li>");
        }
        content.append("</ul>");
        content.append("<p>Thank you for choosing lawinomeet Legal Platform!</p>");

        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(content.toString(), true);
                mailSender.send(message);
                log.info("[EMAIL DISPATCH] Confirmation email sent successfully to: {}", toEmail);
            } catch (Exception e) {
                log.error("[EMAIL DISPATCH] Failed to send email via SMTP, logging fallback pass content: {}", e.getMessage());
            }
        } else {
            log.info("[EMAIL DISPATCH - MOCK] SMTP mailSender not configured. Email Pass Content Generated:\n{}", content.toString());
        }
    }
}
