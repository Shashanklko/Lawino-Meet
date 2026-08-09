package com.jurisone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 🏛️ JurisOne ELITE SERVER
 * The central nervous system of the JurisOne SaaS legal platform.
 * Features: Multi-modulo scanning, Real-time WebSockets, and Automated Content.
 */
@SpringBootApplication
@EnableScheduling
public class JurisOneBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(JurisOneBackendApplication.class, args);
        System.out.println("🏛️ JurisOne Server is Now Online & Elite.");
    }
}
