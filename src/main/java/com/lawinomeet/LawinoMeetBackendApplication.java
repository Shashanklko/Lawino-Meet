package com.lawinomeetMeetmeet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 🏛️ lawinomeetMeet ELITE SERVER
 * The central nervous system of the lawinomeetMeet SaaS legal platform.
 * Features: Multi-modulo scanning, Real-time WebSockets, and Automated Content.
 */
@SpringBootApplication
@EnableScheduling
public class lawinomeetMeetMeetBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(lawinomeetMeetMeetBackendApplication.class, args);
        System.out.println("🏛️ lawinomeetMeet Server is Now Online & Elite.");
    }
}
