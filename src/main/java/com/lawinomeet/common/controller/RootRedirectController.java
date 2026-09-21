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

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 🌐 Root & Home Controller
 * Serves the Lawino Meet API Hub landing page with live interactive API testing,
 * health status checks, and direct documentation links.
 * Returns HTTP 200 OK directly for root/health probes on Render/Cloud hosts.
 */
@Controller
public class RootRedirectController {

    private static final Logger log = LoggerFactory.getLogger(RootRedirectController.class);

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.application.name:LawinoMeet-Backend}")
    private String appName;

    /**
     * Handles root ("/", "/health", "/status", "/api") requests.
     * Returns an interactive HTML dashboard for browser requests (200 OK)
     * or JSON metadata if the client explicitly requests application/json.
     */
    @GetMapping(value = {"/", "/frontend", "/app", "/health", "/status", "/api"})
    public ResponseEntity<?> handleRoot(HttpServletRequest request) {
        String acceptHeader = request.getHeader(HttpHeaders.ACCEPT);

        // If an API client specifically requests application/json (e.g. cURL / Postman / JSON health checks)
        if (acceptHeader != null && acceptHeader.contains(MediaType.APPLICATION_JSON_VALUE) && !acceptHeader.contains(MediaType.TEXT_HTML_VALUE)) {
            return ResponseEntity.ok(getApiStatusData());
        }

        // Return rich interactive HTML dashboard with HTTP 200 OK
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(generateLandingHtml());
    }

    /**
     * Explicit API status endpoint for health checks, telemetry, and automated probes.
     */
    @GetMapping(value = "/api/status", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(getApiStatusData());
    }

    private Map<String, Object> getApiStatusData() {
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", appName);
        response.put("status", "UP");
        response.put("message", "Lawino Meet Backend API is operational and ready to serve requests.");
        response.put("port", serverPort);
        response.put("frontendUrl", frontendUrl);
        response.put("swaggerDocs", "/swagger-ui.html");
        response.put("apiDocs", "/v3/api-docs");
        response.put("uptimeSeconds", uptimeMs / 1000);
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return response;
    }

    private String generateLandingHtml() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lawino Meet | Service Navigator & Hub</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-primary: #07090e;
                        --bg-surface: #0f172a;
                        --bg-card: rgba(15, 23, 42, 0.72);
                        --bg-card-hover: rgba(26, 36, 56, 0.88);
                        --border-color: rgba(255, 255, 255, 0.08);
                        --border-highlight: rgba(99, 102, 241, 0.4);
                        --accent-primary: #6366f1;
                        --accent-primary-hover: #4f46e5;
                        --accent-glow: rgba(99, 102, 241, 0.22);
                        --accent-cyan: #06b6d4;
                        --accent-emerald: #10b981;
                        --text-primary: #f8fafc;
                        --text-secondary: #94a3b8;
                        --text-muted: #64748b;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                        background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg-primary) 70%);
                        color: var(--text-primary);
                        min-height: 100vh;
                        padding: 48px 24px 60px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .ambient-glow {
                        position: fixed;
                        top: -120px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 800px;
                        height: 400px;
                        background: radial-gradient(ellipse, rgba(99, 102, 241, 0.18) 0%, rgba(6, 182, 212, 0.09) 45%, transparent 70%);
                        pointer-events: none;
                        z-index: 0;
                    }
                    .container {
                        max-width: 880px;
                        width: 100%;
                        position: relative;
                        z-index: 1;
                    }
                    header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .status-pill {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(16, 185, 129, 0.12);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        padding: 6px 16px;
                        border-radius: 9999px;
                        font-size: 0.8125rem;
                        font-weight: 600;
                        color: #34d399;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        margin-bottom: 18px;
                        box-shadow: 0 0 24px rgba(16, 185, 129, 0.2);
                    }
                    .status-dot {
                        width: 8px;
                        height: 8px;
                        background: #10b981;
                        border-radius: 50%;
                        box-shadow: 0 0 10px #10b981;
                        animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.4; transform: scale(0.85); }
                    }
                    h1 {
                        font-size: 2.75rem;
                        font-weight: 800;
                        letter-spacing: -0.03em;
                        background: linear-gradient(135deg, #ffffff 25%, #cbd5e1 65%, #818cf8 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin-bottom: 12px;
                    }
                    .subtitle {
                        font-size: 1.0625rem;
                        color: var(--text-secondary);
                        max-width: 600px;
                        margin: 0 auto;
                        line-height: 1.6;
                    }
                    
                    /* Portal Cards Grid */
                    .nav-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin-bottom: 24px;
                    }
                    @media (max-width: 680px) {
                        .nav-grid { grid-template-columns: 1fr; }
                        h1 { font-size: 2.1rem; }
                        body { padding: 32px 16px; }
                    }
                    
                    .nav-card {
                        background: var(--bg-card);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 24px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        text-decoration: none;
                        color: inherit;
                        transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                        position: relative;
                        overflow: hidden;
                    }
                    .nav-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, transparent, transparent);
                        transition: all 0.3s ease;
                    }
                    .nav-card:hover {
                        transform: translateY(-4px);
                        border-color: var(--border-highlight);
                        background: var(--bg-card-hover);
                        box-shadow: 0 16px 40px var(--accent-glow);
                    }
                    .nav-card:hover::before {
                        background: linear-gradient(90deg, var(--accent-cyan), var(--accent-primary), var(--accent-emerald));
                    }
                    .nav-card-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                    }
                    .nav-card-icon-wrap {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        background: rgba(99, 102, 241, 0.12);
                        border: 1px solid rgba(99, 102, 241, 0.25);
                        font-size: 1.35rem;
                    }
                    .nav-card-badge {
                        padding: 4px 10px;
                        border-radius: 6px;
                        font-size: 0.6875rem;
                        font-weight: 700;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        font-family: 'JetBrains Mono', monospace;
                        background: rgba(255, 255, 255, 0.06);
                        color: var(--text-secondary);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                    }
                    .nav-card-badge.badge-primary {
                        background: rgba(99, 102, 241, 0.15);
                        color: #a5b4fc;
                        border-color: rgba(99, 102, 241, 0.3);
                    }
                    .nav-card-badge.badge-cyan {
                        background: rgba(6, 182, 212, 0.15);
                        color: #67e8f9;
                        border-color: rgba(6, 182, 212, 0.3);
                    }
                    .nav-card-badge.badge-emerald {
                        background: rgba(16, 185, 129, 0.15);
                        color: #6ee7b7;
                        border-color: rgba(16, 185, 129, 0.3);
                    }
                    .nav-card-title {
                        font-size: 1.15rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .nav-card-desc {
                        font-size: 0.875rem;
                        color: var(--text-secondary);
                        line-height: 1.5;
                        margin-bottom: 20px;
                        flex-grow: 1;
                    }
                    .nav-card-action {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #818cf8;
                        transition: gap 0.2s ease, color 0.2s ease;
                    }
                    .nav-card:hover .nav-card-action {
                        color: #c7d2fe;
                        gap: 12px;
                    }
                    
                    /* Telemetry Specs Panel */
                    .telemetry-card {
                        background: var(--bg-card);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 24px 28px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                        margin-bottom: 28px;
                    }
                    .telemetry-header {
                        font-size: 1rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 18px;
                    }
                    .telemetry-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 14px;
                    }
                    @media (max-width: 680px) {
                        .telemetry-grid { grid-template-columns: 1fr; }
                    }
                    .telemetry-item {
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid rgba(255, 255, 255, 0.04);
                        border-radius: 10px;
                        padding: 12px 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .telemetry-label {
                        font-size: 0.75rem;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        font-weight: 600;
                    }
                    .telemetry-value {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.8125rem;
                        color: #38bdf8;
                        font-weight: 500;
                        word-break: break-all;
                    }
                    
                    footer {
                        text-align: center;
                        font-size: 0.8125rem;
                        color: var(--text-muted);
                    }
                </style>
            </head>
            <body>
                <div class="ambient-glow"></div>
                <div class="container">
                    <header>
                        <div class="status-pill">
                            <div class="status-dot"></div>
                            System Online &bull; Healthy
                        </div>
                        <h1>🏛️ Lawino Meet</h1>
                        <p class="subtitle">
                            Enterprise Legal Consultation & Service Navigator Hub. Connect to client portals, developer documentation, and runtime telemetry.
                        </p>
                    </header>

                    <!-- Navigation Portals Grid -->
                    <div class="nav-grid">
                        <!-- Portal 1: Launch Frontend -->
                        <a href="__FRONTEND_URL__" target="_blank" class="nav-card">
                            <div>
                                <div class="nav-card-header">
                                    <div class="nav-card-icon-wrap" style="background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3);">
                                        🌐
                                    </div>
                                    <span class="nav-card-badge badge-primary">Web App</span>
                                </div>
                                <div class="nav-card-title">Launch Frontend Portal</div>
                                <div class="nav-card-desc">
                                    Access the Lawino Meet client and lawyer web application for bookings, video consultations, and real-time messaging.
                                </div>
                            </div>
                            <div class="nav-card-action">
                                Open Web Application <span>&rarr;</span>
                            </div>
                        </a>

                        <!-- Portal 2: Swagger Documentation -->
                        <a href="/swagger-ui.html" target="_blank" class="nav-card">
                            <div>
                                <div class="nav-card-header">
                                    <div class="nav-card-icon-wrap" style="background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.3);">
                                        📑
                                    </div>
                                    <span class="nav-card-badge badge-cyan">Interactive Docs</span>
                                </div>
                                <div class="nav-card-title">Swagger API Explorer</div>
                                <div class="nav-card-desc">
                                    Interactive API documentation to test endpoints, examine request/response schemas, and inspect authentication contracts.
                                </div>
                            </div>
                            <div class="nav-card-action">
                                View Swagger UI <span>&rarr;</span>
                            </div>
                        </a>

                        <!-- Portal 3: Raw JSON Health -->
                        <a href="/api/status" target="_blank" class="nav-card">
                            <div>
                                <div class="nav-card-header">
                                    <div class="nav-card-icon-wrap" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
                                        🔌
                                    </div>
                                    <span class="nav-card-badge badge-emerald">JSON Telemetry</span>
                                </div>
                                <div class="nav-card-title">Live API Status</div>
                                <div class="nav-card-desc">
                                    Programmatic JSON health probe providing server uptime, active configuration, and heartbeat metrics for monitoring.
                                </div>
                            </div>
                            <div class="nav-card-action">
                                Inspect JSON Status <span>&rarr;</span>
                            </div>
                        </a>

                        <!-- Portal 4: OpenAPI Spec -->
                        <a href="/v3/api-docs" target="_blank" class="nav-card">
                            <div>
                                <div class="nav-card-header">
                                    <div class="nav-card-icon-wrap" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.3);">
                                        📜
                                    </div>
                                    <span class="nav-card-badge">OpenAPI 3.0</span>
                                </div>
                                <div class="nav-card-title">OpenAPI Specification</div>
                                <div class="nav-card-desc">
                                    Standardized OpenAPI v3 JSON definition for Postman collection import, SDK generation, and automated integration pipelines.
                                </div>
                            </div>
                            <div class="nav-card-action">
                                View OpenAPI JSON <span>&rarr;</span>
                            </div>
                        </a>
                    </div>

                    <!-- Runtime Telemetry Card -->
                    <div class="telemetry-card">
                        <div class="telemetry-header">
                            <span>📊</span> Runtime Telemetry & Platform Specs
                        </div>
                        <div class="telemetry-grid">
                            <div class="telemetry-item">
                                <span class="telemetry-label">Service Application</span>
                                <span class="telemetry-value">__APP_NAME__</span>
                            </div>
                            <div class="telemetry-item">
                                <span class="telemetry-label">Environment / Stack</span>
                                <span class="telemetry-value">Java 17 &bull; Spring Boot 3.2.4</span>
                            </div>
                            <div class="telemetry-item">
                                <span class="telemetry-label">Configured Port</span>
                                <span class="telemetry-value">__SERVER_PORT__</span>
                            </div>
                            <div class="telemetry-item">
                                <span class="telemetry-label">Databases Active</span>
                                <span class="telemetry-value">JPA (MySQL/H2) + MongoDB Atlas</span>
                            </div>
                            <div class="telemetry-item">
                                <span class="telemetry-label">WebSocket Broker</span>
                                <span class="telemetry-value">SockJS + STOMP (/ws)</span>
                            </div>
                            <div class="telemetry-item">
                                <span class="telemetry-label">Status Check</span>
                                <span class="telemetry-value" style="color: #34d399;">UP (HTTP 200)</span>
                            </div>
                        </div>
                    </div>

                    <footer>
                        &copy; 2026 Lawino Meet Platform &bull; Secure Legal Tech Solutions.
                    </footer>
                </div>
            </body>
            </html>
            """
            .replace("__APP_NAME__", appName != null ? appName : "LawinoMeet-Backend")
            .replace("__SERVER_PORT__", serverPort != null ? serverPort : "8080")
            .replace("__FRONTEND_URL__", frontendUrl != null ? frontendUrl : "http://localhost:5173");
    }
}
