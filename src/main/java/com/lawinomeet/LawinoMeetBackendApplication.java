package com.lawinomeet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 🏛️ Lawino Meet Server Entry Point
 * The central service of the Lawino Meet legal platform.
 */
@SpringBootApplication
@EnableScheduling
public class LawinoMeetBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LawinoMeetBackendApplication.class, args);
        System.out.println("🏛️ Lawino Meet Backend Server is Online & Running.");
    }
}
