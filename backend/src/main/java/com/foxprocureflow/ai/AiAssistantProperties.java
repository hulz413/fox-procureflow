package com.foxprocureflow.ai;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fox.procureflow.ai.openai-compatible")
public record AiAssistantProperties(
    boolean enabled,
    String apiKey,
    String baseUrl,
    String model,
    Duration timeout
) {

    public AiAssistantProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://api.deepseek.com";
        }
        if (model == null || model.isBlank()) {
            model = "deepseek-v4-flash";
        }
        if (timeout == null || timeout.isNegative() || timeout.isZero()) {
            timeout = Duration.ofSeconds(30);
        }
    }

    boolean isConfigured() {
        return enabled
            && apiKey != null
            && !apiKey.isBlank()
            && baseUrl != null
            && !baseUrl.isBlank()
            && model != null
            && !model.isBlank();
    }

    String unavailableReason() {
        if (!enabled) {
            return "AI assistant is disabled";
        }
        if (apiKey == null || apiKey.isBlank()) {
            return "OpenAI-compatible API key is not configured";
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            return "OpenAI-compatible base URL is not configured";
        }
        if (model == null || model.isBlank()) {
            return "OpenAI-compatible model is not configured";
        }
        return "OpenAI-compatible provider is not configured";
    }
}
