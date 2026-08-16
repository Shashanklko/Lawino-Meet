package com.lawinomeet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 🏛️ Lawino Meet Server Entry Point
 * The central service of the Lawino Meet legal platform.
 */
@SpringBootApplication
@EnableScheduling
public class LawinoMeetBackendApplication {

    private static final Logger log = LoggerFactory.getLogger(LawinoMeetBackendApplication.class);

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public static void main(String[] args) {
        SpringApplication.run(LawinoMeetBackendApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        System.out.println("\n" +
            "========================================================================================\n" +
            " 🏛️  Lawino Meet Backend Server is Online & Running!\n" +
            "----------------------------------------------------------------------------------------\n" +
            " 🌐  Backend Server URL:  http://localhost:" + serverPort + "  (Auto-redirects -> Frontend)\n" +
            " 💻  Target Frontend URL: " + frontendUrl + "\n" +
            " 📑  Swagger API Docs:    http://localhost:" + serverPort + "/swagger-ui.html\n" +
            " 🔌  API Health Status:   http://localhost:" + serverPort + "/api/status\n" +
            "========================================================================================\n"
        );
        log.info("Lawino Meet Backend ready on port {} -> Redirecting root requests to {}", serverPort, frontendUrl);
    }
}
