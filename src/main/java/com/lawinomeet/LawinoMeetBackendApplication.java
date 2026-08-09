package com.lawinomeet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 🏛️ lawinomeet ELITE SERVER
 * The central nervous system of the lawinomeet SaaS legal platform.
 * Features: Multi-modulo scanning, Real-time WebSockets, and Automated Content.
 */
@SpringBootApplication
@EnableScheduling
public class lawinomeetBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(lawinomeetBackendApplication.class, args);
        System.out.println("🏛️ lawinomeet Server is Now Online & Elite.");
    }
}
