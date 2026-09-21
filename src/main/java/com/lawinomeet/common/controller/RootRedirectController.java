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
                <title>Lawino Meet | API Hub & Service Console</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-primary: #07090e;
                        --bg-surface: #0f172a;
                        --bg-card: rgba(15, 23, 42, 0.75);
                        --bg-card-hover: rgba(30, 41, 59, 0.85);
                        --border-color: rgba(255, 255, 255, 0.08);
                        --border-highlight: rgba(99, 102, 241, 0.35);
                        --accent-primary: #6366f1;
                        --accent-glow: rgba(99, 102, 241, 0.25);
                        --accent-cyan: #06b6d4;
                        --accent-emerald: #10b981;
                        --text-primary: #f8fafc;
                        --text-secondary: #94a3b8;
                        --text-muted: #64748b;
                        --terminal-bg: #030712;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                        background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg-primary) 65%);
                        color: var(--text-primary);
                        min-height: 100vh;
                        padding: 32px 20px 60px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .ambient-glow {
                        position: fixed;
                        top: -100px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 700px;
                        height: 350px;
                        background: radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 40%, transparent 70%);
                        pointer-events: none;
                        z-index: 0;
                    }
                    .container {
                        max-width: 1040px;
                        width: 100%;
                        position: relative;
                        z-index: 1;
                    }
                    header {
                        text-align: center;
                        margin-bottom: 36px;
                    }
                    .status-pill {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(16, 185, 129, 0.12);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        padding: 6px 14px;
                        border-radius: 9999px;
                        font-size: 0.8125rem;
                        font-weight: 600;
                        color: #34d399;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        margin-bottom: 16px;
                        box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
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
                        background: linear-gradient(135deg, #ffffff 30%, #cbd5e1 70%, #818cf8 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin-bottom: 10px;
                    }
                    .subtitle {
                        font-size: 1.0625rem;
                        color: var(--text-secondary);
                        max-width: 620px;
                        margin: 0 auto;
                        line-height: 1.6;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                        margin-bottom: 32px;
                    }
                    @media (max-width: 840px) {
                        .grid { grid-template-columns: 1fr; }
                        h1 { font-size: 2.1rem; }
                    }
                    .card {
                        background: var(--bg-card);
                        backdrop-filter: blur(16px);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 24px;
                        transition: all 0.25s ease;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                    }
                    .card:hover {
                        border-color: var(--border-highlight);
                        box-shadow: 0 12px 36px var(--accent-glow);
                    }
                    .card-title {
                        font-size: 1.125rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 18px;
                    }
                    .btn-group {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin-bottom: 18px;
                    }
                    button, .btn-link {
                        font-family: inherit;
                        font-size: 0.875rem;
                        font-weight: 600;
                        padding: 10px 18px;
                        border-radius: 10px;
                        border: none;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        text-decoration: none;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .btn-primary {
                        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%);
                        color: #ffffff;
                        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
                    }
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 22px rgba(99, 102, 241, 0.5);
                    }
                    .btn-secondary {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid var(--border-color);
                        color: var(--text-primary);
                    }
                    .btn-secondary:hover {
                        background: rgba(255, 255, 255, 0.1);
                        border-color: var(--text-secondary);
                        transform: translateY(-1px);
                    }
                    .btn-accent {
                        background: rgba(6, 182, 212, 0.12);
                        border: 1px solid rgba(6, 182, 212, 0.3);
                        color: #22d3ee;
                    }
                    .btn-accent:hover {
                        background: rgba(6, 182, 212, 0.2);
                        box-shadow: 0 0 16px rgba(6, 182, 212, 0.3);
                    }
                    .input-row {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    }
                    .input-endpoint {
                        flex: 1;
                        background: var(--terminal-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 10px 14px;
                        color: #38bdf8;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.875rem;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    .input-endpoint:focus {
                        border-color: var(--accent-primary);
                    }
                    /* Live Terminal Console */
                    .terminal-box {
                        background: var(--terminal-bg);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 12px;
                        overflow: hidden;
                    }
                    .terminal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px 14px;
                        background: rgba(255, 255, 255, 0.03);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                        font-size: 0.75rem;
                        color: var(--text-muted);
                    }
                    .terminal-tags {
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                    .tag {
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-family: 'JetBrains Mono', monospace;
                        font-weight: 600;
                        font-size: 0.75rem;
                    }
                    .tag-200 { background: rgba(16, 185, 129, 0.2); color: #34d399; }
                    .tag-time { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
                    .terminal-body {
                        padding: 14px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.8125rem;
                        color: #e2e8f0;
                        max-height: 240px;
                        overflow-y: auto;
                        white-space: pre-wrap;
                        word-break: break-all;
                        line-height: 1.5;
                    }
                    /* Telemetry Specs */
                    .spec-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .spec-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.04);
                    }
                    .spec-label {
                        font-size: 0.8125rem;
                        color: var(--text-secondary);
                    }
                    .spec-val {
                        font-size: 0.8125rem;
                        font-family: 'JetBrains Mono', monospace;
                        color: #38bdf8;
                        font-weight: 500;
                    }
                    /* Endpoints cheat sheet */
                    .endpoint-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.8125rem;
                        margin-top: 10px;
                    }
                    .endpoint-table th, .endpoint-table td {
                        padding: 10px 12px;
                        text-align: left;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .endpoint-table th {
                        color: var(--text-muted);
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 0.6875rem;
                        letter-spacing: 0.05em;
                    }
                    .method-badge {
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-weight: 700;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.6875rem;
                    }
                    .method-get { background: rgba(16, 185, 129, 0.15); color: #34d399; }
                    .method-post { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                    .method-ws { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
                    footer {
                        text-align: center;
                        margin-top: 24px;
                        font-size: 0.8125rem;
                        color: var(--text-muted);
                    }
                    footer a {
                        color: #818cf8;
                        text-decoration: none;
                    }
                    footer a:hover {
                        text-decoration: underline;
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
                        <h1>🏛️ Lawino Meet API Hub</h1>
                        <p class="subtitle">
                            Enterprise Legal Consultation & Collaboration Platform Backend. Ready to serve authenticated REST API endpoints and real-time STOMP WebSockets.
                        </p>
                    </header>

                    <div class="grid">
                        <!-- Card 1: Interactive Live API Tester -->
                        <div class="card">
                            <div class="card-title">
                                <span>⚡</span> Live API Test Console
                            </div>
                            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 14px;">
                                Send instant AJAX queries directly to the backend to verify server responsiveness:
                            </p>
                            
                            <div class="btn-group">
                                <button id="btn-test-status" class="btn-primary" onclick="testEndpoint('/api/status')">
                                    🚀 Test /api/status
                                </button>
                                <button id="btn-test-lawyers" class="btn-secondary" onclick="testEndpoint('/api/users/lawyers')">
                                    👥 Test /api/users/lawyers
                                </button>
                                <button id="btn-test-docs" class="btn-secondary" onclick="testEndpoint('/v3/api-docs')">
                                    📑 Test OpenAPI Schema
                                </button>
                            </div>

                            <div class="input-row">
                                <input type="text" id="custom-endpoint" class="input-endpoint" value="/api/status" placeholder="/api/custom-path">
                                <button class="btn-accent" onclick="testEndpoint(document.getElementById('custom-endpoint').value)">
                                    Execute &rarr;
                                </button>
                            </div>

                            <div class="terminal-box">
                                <div class="terminal-header">
                                    <span id="terminal-endpoint">GET /api/status</span>
                                    <div class="terminal-tags">
                                        <span id="status-tag" class="tag tag-200">200 OK</span>
                                        <span id="latency-tag" class="tag tag-time">-- ms</span>
                                        <button onclick="copyResponse()" style="background:transparent; border:none; color:var(--text-secondary); font-size:0.75rem; padding:2px 6px; cursor:pointer;">📋 Copy</button>
                                    </div>
                                </div>
                                <pre id="terminal-output" class="terminal-body">Loading API status...</pre>
                            </div>
                        </div>

                        <!-- Card 2: Quick Portals & Telemetry -->
                        <div class="card">
                            <div class="card-title">
                                <span>🧭</span> Quick Portals & Documentation
                            </div>
                            
                            <div class="btn-group">
                                <a href="/swagger-ui.html" target="_blank" class="btn-primary">
                                    📑 Swagger API Docs
                                </a>
                                <a href="__FRONTEND_URL__" target="_blank" class="btn-secondary">
                                    🌐 Launch Frontend Web App &rarr;
                                </a>
                                <a href="/api/status" target="_blank" class="btn-accent">
                                    🔌 Raw JSON Status
                                </a>
                            </div>

                            <div class="card-title" style="margin-top: 24px; font-size: 1rem;">
                                <span>📊</span> Runtime Telemetry
                            </div>

                            <div class="spec-list">
                                <div class="spec-item">
                                    <span class="spec-label">Service Application</span>
                                    <span class="spec-val">__APP_NAME__</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Environment / Stack</span>
                                    <span class="spec-val">Java 17 &bull; Spring Boot 3.2.4</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Configured Port</span>
                                    <span class="spec-val">__SERVER_PORT__</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Databases Active</span>
                                    <span class="spec-val">JPA (MySQL/H2) + MongoDB Atlas</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">WebSocket Broker</span>
                                    <span class="spec-val">SockJS + STOMP (/ws)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Full Width Card: Core API Reference -->
                    <div class="card">
                        <div class="card-title">
                            <span>📚</span> Core API Cheat Sheet
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="endpoint-table">
                                <thead>
                                    <tr>
                                        <th>Method</th>
                                        <th>Endpoint</th>
                                        <th>Auth Required</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span class="method-badge method-get">GET</span></td>
                                        <td><code>/api/status</code></td>
                                        <td>No</td>
                                        <td>Live server health and metadata</td>
                                    </tr>
                                    <tr>
                                        <td><span class="method-badge method-get">GET</span></td>
                                        <td><code>/api/users/lawyers</code></td>
                                        <td>No</td>
                                        <td>Public verified lawyer directory</td>
                                    </tr>
                                    <tr>
                                        <td><span class="method-badge method-post">POST</span></td>
                                        <td><code>/api/auth/login</code></td>
                                        <td>No</td>
                                        <td>Authenticate user & obtain JWT token</td>
                                    </tr>
                                    <tr>
                                        <td><span class="method-badge method-post">POST</span></td>
                                        <td><code>/api/auth/register</code></td>
                                        <td>No</td>
                                        <td>Client / Lawyer registration</td>
                                    </tr>
                                    <tr>
                                        <td><span class="method-badge method-post">POST</span></td>
                                        <td><code>/api/consultations/request</code></td>
                                        <td>Bearer JWT</td>
                                        <td>Book a legal consultation session</td>
                                    </tr>
                                    <tr>
                                        <td><span class="method-badge method-ws">WS</span></td>
                                        <td><code>/ws</code></td>
                                        <td>Token Handshake</td>
                                        <td>Real-time chat & signaling socket</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <footer>
                        &copy; 2026 Lawino Meet Platform &bull; Secure Legal Tech Solutions.
                    </footer>
                </div>

                <script>
                    let lastResponseJson = "";

                    async function testEndpoint(endpoint) {
                        if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
                        document.getElementById('custom-endpoint').value = endpoint;
                        document.getElementById('terminal-endpoint').innerText = 'GET ' + endpoint;
                        
                        const outputEl = document.getElementById('terminal-output');
                        const statusTag = document.getElementById('status-tag');
                        const latencyTag = document.getElementById('latency-tag');
                        
                        outputEl.innerText = 'Connecting to ' + endpoint + '...';
                        statusTag.className = 'tag tag-time';
                        statusTag.innerText = 'FETCHING';
                        latencyTag.innerText = '...';
                        
                        const startTime = performance.now();
                        try {
                            const res = await fetch(endpoint, {
                                headers: { 'Accept': 'application/json' }
                            });
                            const latency = Math.round(performance.now() - startTime);
                            latencyTag.innerText = latency + ' ms';
                            
                            statusTag.innerText = res.status + ' ' + res.statusText;
                            if (res.ok) {
                                statusTag.className = 'tag tag-200';
                            } else {
                                statusTag.className = 'tag tag-time';
                                statusTag.style.background = 'rgba(239, 68, 68, 0.2)';
                                statusTag.style.color = '#f87171';
                            }

                            const contentType = res.headers.get('content-type') || '';
                            if (contentType.includes('application/json')) {
                                const data = await res.json();
                                lastResponseJson = JSON.stringify(data, null, 2);
                                outputEl.innerText = lastResponseJson;
                            } else {
                                const text = await res.text();
                                lastResponseJson = text.substring(0, 1000);
                                outputEl.innerText = lastResponseJson + (text.length > 1000 ? '\\n... (truncated)' : '');
                            }
                        } catch (err) {
                            const latency = Math.round(performance.now() - startTime);
                            latencyTag.innerText = latency + ' ms';
                            statusTag.className = 'tag tag-time';
                            statusTag.style.background = 'rgba(239, 68, 68, 0.2)';
                            statusTag.style.color = '#f87171';
                            statusTag.innerText = 'NETWORK ERROR';
                            outputEl.innerText = 'Error connecting to endpoint:\\n' + err.message;
                        }
                    }

                    function copyResponse() {
                        if (!lastResponseJson) return;
                        navigator.clipboard.writeText(lastResponseJson).then(() => {
                            alert('Response copied to clipboard!');
                        });
                    }

                    // Automatically test /api/status on initial page load
                    window.addEventListener('DOMContentLoaded', () => {
                        testEndpoint('/api/status');
                    });
                </script>
            </body>
            </html>
            """
            .replace("__APP_NAME__", appName != null ? appName : "LawinoMeet-Backend")
            .replace("__SERVER_PORT__", serverPort != null ? serverPort : "8080")
            .replace("__FRONTEND_URL__", frontendUrl != null ? frontendUrl : "http://localhost:5173");
    }
}
