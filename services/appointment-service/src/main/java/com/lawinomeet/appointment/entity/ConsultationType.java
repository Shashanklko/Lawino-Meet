package com.lawinomeet.appointment.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ConsultationType {
    ONLINE,      // Video Consultation Chamber
    IN_PERSON,   // In-Chamber Consultation (Office address revealed after payment)
    CHAT;        // Text / Chat-Only Consultation

    @JsonCreator
    public static ConsultationType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ONLINE;
        }
        String clean = value.trim().toUpperCase();
        if ("OFFLINE".equals(clean) || "IN_PERSON".equals(clean) || "CHAMBER".equals(clean) || "PHYSICAL".equals(clean)) {
            return IN_PERSON;
        }
        if ("ONLINE".equals(clean) || "VIDEO".equals(clean) || "WEBRTC".equals(clean)) {
            return ONLINE;
        }
        if ("CHAT".equals(clean) || "MESSAGING".equals(clean) || "TEXT".equals(clean)) {
            return CHAT;
        }
        try {
            return ConsultationType.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return ONLINE;
        }
    }
}
