package com.smartbilling.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.Collections;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @PostMapping("/insights")
    public ResponseEntity<?> getInsights(@RequestBody Map<String, Object> req) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("error", "Gemini API not configured"));
        }

        Object data = req.get("data");
        String context = (String) req.get("context");

        String prompt = "";
        try {
            String dataStr = new ObjectMapper().writeValueAsString(data);
            if ("dashboard".equals(context)) {
                prompt = "As an expert financial and business analyst, analyze the following dashboard metrics for a Smart Billing Application. Provide 3 concise, actionable insights (max 2 sentences each) based on this data: "
                        + dataStr;
            } else if ("product_description".equals(context)) {
                prompt = "Generate a compelling, SEO-friendly 2-paragraph product description for the following product in our billing system: "
                        + dataStr;
            } else if ("nl_search".equals(context)) {
                prompt = "Given the user search query \"" + ((Map<?, ?>) data).get("query")
                        + "\", return a JSON object with the inferred search parameters. Fields: \"status\" (string, e.g., 'unpaid', 'paid'), \"dateRange\" (object with 'start' and 'end' ISO dates), \"type\" (string, e.g., 'invoice', 'customer'). Only output the raw JSON.";
            } else {
                prompt = "Analyze this data and provide insights: " + dataStr;
            }
        } catch (JsonProcessingException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to parse data"));
        }

        RestTemplate restTemplate = new RestTemplate();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key="
                + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 2048
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> resBody = response.getBody();

            if (resBody != null && resBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) resBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        String resultText = (String) parts.get(0).get("text");
                        if (resultText == null || resultText.isBlank()) {
                            return ResponseEntity.status(500).body(Map.of("error", "Gemini returned empty result"));
                        }
                        if ("nl_search".equals(context)) {
                            resultText = resultText.replace("```json", "").replace("```", "").trim();
                            ObjectMapper mapper = new ObjectMapper();
                            try {
                                return ResponseEntity.ok(Map.of("result", mapper.readValue(resultText, Map.class)));
                            } catch (Exception ignored) {
                            }
                        }
                        return ResponseEntity.ok(Map.of("result", resultText));
                    }
                }
            }
            return ResponseEntity.ok(Map.of("result", "No insights generated."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate AI insights: " + e.getMessage()));
        }
    }
}
