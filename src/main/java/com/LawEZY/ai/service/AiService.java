package com.LawEZY.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_SERVICE_URL = "http://localhost:8001/api/ai/copilot";

    public String generateResponse(String query) {
        log.info("[AI] Processing Legal Triage Query: {}", query);
        try {
            Map<String, String> request = new HashMap<>();
            request.put("query", query);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(PYTHON_SERVICE_URL, request, Map.class);
            
            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
        } catch (Exception e) {
            log.info("[AI] Python microservice offline. Utilizing built-in LexBot Java Legal Triage Engine.");
        }

        // Self-contained Intelligent Java Fallback Engine
        String lowerQuery = query.toLowerCase();
        if (lowerQuery.contains("property") || lowerQuery.contains("land") || lowerQuery.contains("tenant")) {
            return "LexBot Legal Advisory:\n1. Property disputes require verification of title deeds, sale agreements, and encumbrance certificates.\n2. In case of tenant conflicts, refer to the local Rent Control Act.\n3. We recommend booking a consultation with our verified Property Lawyers for a detailed document audit.";
        } else if (lowerQuery.contains("divorce") || lowerQuery.contains("custody") || lowerQuery.contains("marriage")) {
            return "LexBot Legal Advisory:\n1. Family law matters involve mutual consent or contested petitions under personal marriage acts.\n2. Document requirements include marriage certificate, proof of residence, and financial disclosures.\n3. Connect with our Family Law experts via Online Video or In-Person Office Visit for confidential assistance.";
        } else if (lowerQuery.contains("gst") || lowerQuery.contains("tax") || lowerQuery.contains("corporate")) {
            return "LexBot Legal Advisory:\n1. Corporate and tax compliance requires filing returns under GST and Income Tax regulations.\n2. Consult with our Chartered Accountants (CA) and Corporate Law experts for business compliance audits.";
        }

        return "LexBot Legal Triage Overview:\nYour query regarding '" + query + "' has been analyzed. For specialized legal representation and case evaluation, please book a consultation with our verified legal professionals.";
    }

    public String checkSafety(String content) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("query", content);
            
            @SuppressWarnings("unchecked")
            Map<String, String> response = restTemplate.postForObject("http://localhost:8001/api/ai/guard", request, Map.class);
            
            if (response != null && response.containsKey("status")) {
                return response.get("status");
            }
        } catch (Exception e) {
            // Fail-safe to internal pattern check
        }

        if (content != null && (content.matches(".*\\d{10}.*") || content.toLowerCase().contains("whatsapp") || content.contains("@"))) {
            return "BLOCKED";
        }
        return "SAFE";
    }
}
