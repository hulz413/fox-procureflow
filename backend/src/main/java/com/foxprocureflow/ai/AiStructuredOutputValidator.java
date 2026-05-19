package com.foxprocureflow.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AiStructuredOutputValidator {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final Set<String> RISK_LEVELS = Set.of("LOW", "MEDIUM", "HIGH");

    private final ObjectMapper objectMapper;

    public AiStructuredOutputValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> parseObject(String rawContent) {
        try {
            return objectMapper.readValue(stripJsonFence(rawContent), MAP_TYPE);
        } catch (JsonProcessingException exception) {
            throw invalid("AI output is not valid JSON");
        }
    }

    public void validateDraft(Map<String, Object> result, DraftAllowedReferences references) {
        requireText(result, "title");
        requireText(result, "businessPurpose");
        validateOptionalReference(result, "requesterId", references.requesterIds());
        validateOptionalReference(result, "departmentId", references.departmentIds());
        validateOptionalReference(result, "categoryId", references.categoryIds());
        validateOptionalReference(result, "budgetAccountId", references.budgetAccountIds());
        validateOptionalReference(result, "supplierId", references.supplierIds());
        requireDate(result, "expectedDeliveryDate");
        requirePositiveDecimal(result, "totalAmount");
        requireText(result, "currency");
        List<?> lines = requireList(result, "lineItems");
        if (lines.isEmpty()) {
            throw invalid("AI draft must include at least one line item");
        }
        for (Object line : lines) {
            if (!(line instanceof Map<?, ?> lineMap)) {
                throw invalid("AI draft line item must be an object");
            }
            requireText(lineMap, "itemName");
            requirePositiveDecimal(lineMap, "quantity");
            requireText(lineMap, "unit");
            requirePositiveDecimal(lineMap, "estimatedUnitPrice");
            requirePositiveDecimal(lineMap, "estimatedAmount");
        }
        requireList(result, "missingFields");
        requireList(result, "confidenceNotes");
    }

    public void validateRiskReview(Map<String, Object> result) {
        String riskLevel = requireText(result, "riskLevel");
        if (!RISK_LEVELS.contains(riskLevel)) {
            throw invalid("AI riskLevel must be LOW, MEDIUM, or HIGH");
        }
        requireList(result, "riskItems");
        requireList(result, "suggestedActions");
        requireList(result, "followUpQuestions");
        if (!result.containsKey("continueRecommended") || !(result.get("continueRecommended") instanceof Boolean)) {
            throw invalid("AI risk review must include boolean continueRecommended");
        }
    }

    public void validateRfqExplanation(Map<String, Object> result, Set<String> allowedSupplierIds) {
        requireText(result, "summary");
        List<?> supplierInsights = requireList(result, "supplierInsights");
        for (Object insight : supplierInsights) {
            if (!(insight instanceof Map<?, ?> insightMap)) {
                throw invalid("AI supplier insight must be an object");
            }
            String supplierId = requireText(insightMap, "supplierId");
            if (!allowedSupplierIds.contains(supplierId)) {
                throw invalid("AI supplier insight references unknown supplierId: " + supplierId);
            }
            requireText(insightMap, "assessment");
        }
        requireList(result, "keyDifferences");
        requireList(result, "riskNotes");
        requireList(result, "questionsToConfirm");
        requireText(result, "confidenceLevel");
    }

    public void validateMatchingExplanation(Map<String, Object> result, Set<String> allowedDifferenceIds) {
        requireText(result, "summary");
        List<?> differenceInsights = requireList(result, "differenceInsights");
        for (Object insight : differenceInsights) {
            if (!(insight instanceof Map<?, ?> insightMap)) {
                throw invalid("AI difference insight must be an object");
            }
            String differenceId = textValue(insightMap.get("differenceId"));
            if (differenceId != null && !allowedDifferenceIds.contains(differenceId)) {
                throw invalid("AI difference insight references unknown differenceId: " + differenceId);
            }
            requireText(insightMap, "assessment");
        }
        requireList(result, "likelyCauses");
        requireList(result, "suggestedActions");
        requireList(result, "requiredFollowUpData");
        requireText(result, "confidenceLevel");
    }

    private String stripJsonFence(String rawContent) {
        String trimmed = rawContent == null ? "" : rawContent.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String requireText(Map<?, ?> result, String key) {
        String text = textValue(result.get(key));
        if (text == null || text.isBlank()) {
            throw invalid("AI output missing text field: " + key);
        }
        return text.trim();
    }

    private void requirePositiveDecimal(Map<?, ?> result, String key) {
        Object value = result.get(key);
        try {
            BigDecimal decimal = value instanceof Number number
                ? new BigDecimal(number.toString())
                : new BigDecimal(String.valueOf(value));
            if (decimal.compareTo(BigDecimal.ZERO) <= 0) {
                throw invalid("AI output field must be positive: " + key);
            }
        } catch (NumberFormatException exception) {
            throw invalid("AI output field must be numeric: " + key);
        }
    }

    private void requireDate(Map<?, ?> result, String key) {
        try {
            LocalDate.parse(requireText(result, key));
        } catch (RuntimeException exception) {
            throw invalid("AI output field must be an ISO date: " + key);
        }
    }

    private List<?> requireList(Map<?, ?> result, String key) {
        Object value = result.get(key);
        if (!(value instanceof List<?> list)) {
            throw invalid("AI output missing list field: " + key);
        }
        return list;
    }

    private void validateOptionalReference(Map<?, ?> result, String key, Collection<String> allowedValues) {
        String value = textValue(result.get(key));
        if (value != null && !value.isBlank() && !allowedValues.contains(value)) {
            throw invalid("AI output references unknown " + key + ": " + value);
        }
    }

    private String textValue(Object value) {
        return value instanceof String text ? text.trim() : null;
    }

    private AiProviderException invalid(String message) {
        return new AiProviderException(org.springframework.http.HttpStatus.BAD_GATEWAY, "AI_INVALID_OUTPUT", message);
    }

    public record DraftAllowedReferences(
        Set<String> requesterIds,
        Set<String> departmentIds,
        Set<String> categoryIds,
        Set<String> budgetAccountIds,
        Set<String> supplierIds
    ) {
    }
}
