package com.foxprocureflow.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class OpenAiCompatibleAiProvider implements AiProvider {

    private final AiAssistantProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OpenAiCompatibleAiProvider(AiAssistantProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(properties.timeout())
            .build();
    }

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    public String model() {
        return properties.model();
    }

    @Override
    public String unavailableReason() {
        return properties.unavailableReason();
    }

    @Override
    public AiProviderResult generate(AiProviderRequest request) {
        if (!isConfigured()) {
            throw new AiProviderException(HttpStatus.SERVICE_UNAVAILABLE, "AI_PROVIDER_UNAVAILABLE", unavailableReason());
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                "model", properties.model(),
                "messages", List.of(
                    Map.of("role", "system", "content", request.systemPrompt()),
                    Map.of("role", "user", "content", request.userPrompt())),
                "stream", false,
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object")));
            HttpRequest httpRequest = HttpRequest.newBuilder(endpoint())
                .timeout(properties.timeout())
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + properties.apiKey())
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw mapHttpError(response.statusCode(), response.body());
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (!content.isTextual() || content.asText().isBlank()) {
                throw new AiProviderException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_EMPTY_CONTENT", "OpenAI-compatible provider returned no message content");
            }
            return new AiProviderResult(root.path("model").asText(properties.model()), content.asText());
        } catch (JsonProcessingException exception) {
            throw new AiProviderException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_JSON_ERROR", "Unable to parse OpenAI-compatible provider response");
        } catch (IOException exception) {
            throw new AiProviderException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_IO_ERROR", "OpenAI-compatible provider request failed: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AiProviderException(HttpStatus.GATEWAY_TIMEOUT, "AI_PROVIDER_INTERRUPTED", "OpenAI-compatible provider request was interrupted");
        }
    }

    private URI endpoint() {
        String normalized = properties.baseUrl().replaceAll("/+$", "");
        if (normalized.endsWith("/chat/completions")) {
            return URI.create(normalized);
        }
        return URI.create(normalized + "/chat/completions");
    }

    private AiProviderException mapHttpError(int statusCode, String body) {
        HttpStatus status = switch (statusCode) {
            case 401, 403 -> HttpStatus.SERVICE_UNAVAILABLE;
            case 408, 504 -> HttpStatus.GATEWAY_TIMEOUT;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            default -> statusCode >= 500 ? HttpStatus.BAD_GATEWAY : HttpStatus.BAD_REQUEST;
        };
        String message = body == null || body.isBlank()
            ? "OpenAI-compatible provider request failed with status " + statusCode
            : "OpenAI-compatible provider request failed with status " + statusCode + ": " + body;
        return new AiProviderException(status, "AI_PROVIDER_HTTP_" + statusCode, message);
    }
}
