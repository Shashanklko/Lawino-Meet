package com.lawinomeet.common.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.view.RedirectView;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 🌐 Root Redirect Controller
 * Automatically redirects root/browser access on the backend server to the configured Frontend URL.
 */
@Controller
public class RootRedirectController {

    private static final Logger log = LoggerFactory.getLogger(RootRedirectController.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Redirects browser requests hitting the backend root ("/", "/frontend", "/app") to the frontend URL.
     * If the client specifically requests JSON (e.g., API health checks or tools with Accept: application/json),
     * returns API metadata JSON instead of redirecting.
     */
    @GetMapping(value = {"/", "/frontend", "/app"})
    public Object handleRoot(HttpServletRequest request) {
        String acceptHeader = request.getHeader(HttpHeaders.ACCEPT);

        // If an API client specifically requests application/json without text/html (e.g. cURL / Postman / health check)
        if (acceptHeader != null && acceptHeader.contains(MediaType.APPLICATION_JSON_VALUE) && !acceptHeader.contains(MediaType.TEXT_HTML_VALUE)) {
            return getApiStatusJson();
        }

        // Construct target URL including any query string
        String targetUrl = frontendUrl;
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isBlank()) {
            targetUrl += (targetUrl.contains("?") ? "&" : "?") + queryString;
        }

        log.info("🌐 Redirecting backend access [{}] -> Frontend: {}", request.getRequestURI(), targetUrl);

        RedirectView redirectView = new RedirectView(targetUrl);
        redirectView.setStatusCode(HttpStatus.FOUND);
        return redirectView;
    }

    /**
     * Explicit API status endpoint for health checks and service information.
     */
    @GetMapping(value = "/api/status", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(getApiStatusData());
    }

    private ResponseEntity<Map<String, Object>> getApiStatusJson() {
        return ResponseEntity.ok(getApiStatusData());
    }

    private Map<String, Object> getApiStatusData() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "LawinoMeet Backend API");
        response.put("status", "UP");
        response.put("frontendUrl", frontendUrl);
        response.put("swaggerDocs", "/swagger-ui.html");
        response.put("apiDocs", "/v3/api-docs");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}
