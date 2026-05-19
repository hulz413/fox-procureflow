package com.foxprocureflow.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AiProviderAndValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void sanitizerRemovesSecretsAndContactFields() {
        AiPromptSanitizer sanitizer = new AiPromptSanitizer();
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("apiKey", "secret");
        input.put("note", "联系人 13800138000 / buyer@example.com");
        input.put("nested", Map.of("email", "hidden@example.com", "title", "采购申请"));

        Map<String, Object> sanitized = sanitizer.sanitize(input);

        assertThat(sanitized).doesNotContainKey("apiKey");
        assertThat(sanitized.get("note")).isEqualTo("联系人 [redacted-phone] / [redacted-email]");
        assertThat(((Map<?, ?>) sanitized.get("nested")).containsKey("email")).isFalse();
    }

    @Test
    void validatorRejectsUnknownSupplierReference() {
        AiStructuredOutputValidator validator = new AiStructuredOutputValidator(objectMapper);
        Map<String, Object> output = Map.of(
            "summary", "报价解释",
            "supplierInsights", List.of(Map.of("supplierId", "supplier-unknown", "assessment", "不存在")),
            "keyDifferences", List.of("价格差异"),
            "riskNotes", List.of(),
            "questionsToConfirm", List.of(),
            "confidenceLevel", "HIGH");

        assertThatThrownBy(() -> validator.validateRfqExplanation(output, Set.of("supplier-bluechip")))
            .isInstanceOf(AiProviderException.class)
            .hasMessageContaining("unknown supplierId");
    }

    @Test
    void validatorAcceptsPurchaseRequestDraftShape() {
        AiStructuredOutputValidator validator = new AiStructuredOutputValidator(objectMapper);
        Map<String, Object> output = new LinkedHashMap<>();
        output.put("title", "研发笔记本采购");
        output.put("businessPurpose", "研发扩编");
        output.put("requesterId", "user-digital-applicant");
        output.put("departmentId", "dept-digital-it");
        output.put("categoryId", "category-it-hardware");
        output.put("budgetAccountId", "budget-digital-it-equipment");
        output.put("supplierId", "supplier-bluechip");
        output.put("expectedDeliveryDate", "2026-06-30");
        output.put("currency", "CNY");
        output.put("totalAmount", BigDecimal.valueOf(9300));
        output.put("lineItems", List.of(Map.of(
                "itemName", "商务笔记本电脑",
                "quantity", 1,
                "unit", "台",
                "estimatedUnitPrice", 9300,
                "estimatedAmount", 9300)));
        output.put("missingFields", List.of());
        output.put("confidenceNotes", List.of("匹配预算"));

        validator.validateDraft(output, new AiStructuredOutputValidator.DraftAllowedReferences(
            Set.of("user-digital-applicant"),
            Set.of("dept-digital-it"),
            Set.of("category-it-hardware"),
            Set.of("budget-digital-it-equipment"),
            Set.of("supplier-bluechip")));
    }

    @Test
    void openAiCompatibleProviderMapsRateLimitErrors() throws Exception {
        HttpServer server = startServer(429, "{\"error\":{\"message\":\"rate limited\"}}");
        try {
            OpenAiCompatibleAiProvider provider = new OpenAiCompatibleAiProvider(
                new AiAssistantProperties(
                    true,
                    "test-key",
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "deepseek-test",
                    Duration.ofSeconds(2),
                    "unavailable"),
                objectMapper);

            assertThatThrownBy(() -> provider.generate(new AiProviderRequest(AiScenario.PURCHASE_REQUEST_RISK, "system", "user")))
                .isInstanceOfSatisfying(AiProviderException.class, exception -> {
                    assertThat(exception.status()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(exception.errorCode()).isEqualTo("AI_PROVIDER_HTTP_429");
                });
        } finally {
            server.stop(0);
        }
    }

    @Test
    void openAiCompatibleProviderExtractsMessageContent() throws Exception {
        HttpServer server = startServer(200, """
            {"model":"deepseek-test","choices":[{"message":{"content":"{\\"riskLevel\\":\\"LOW\\"}"}}]}
            """);
        try {
            OpenAiCompatibleAiProvider provider = new OpenAiCompatibleAiProvider(
                new AiAssistantProperties(
                    true,
                    "test-key",
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "deepseek-test",
                    Duration.ofSeconds(2),
                    "unavailable"),
                objectMapper);

            AiProviderResult result = provider.generate(new AiProviderRequest(AiScenario.PURCHASE_REQUEST_RISK, "system", "user"));

            assertThat(result.model()).isEqualTo("deepseek-test");
            assertThat(result.content()).contains("riskLevel");
        } finally {
            server.stop(0);
        }
    }

    private HttpServer startServer(int status, String body) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return server;
    }
}
