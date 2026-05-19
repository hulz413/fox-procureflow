package com.foxprocureflow.ai;

import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public final class AiAssistantDtos {

    private AiAssistantDtos() {
    }

    public record PurchaseRequestDraftPreviewRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotBlank String intent
    ) {
    }

    public record PurchaseRequestRiskReviewRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotBlank String requestId
    ) {
    }

    public record RfqQuoteExplanationRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotBlank String rfqId
    ) {
    }

    public record MatchingExplanationRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotBlank String matchId
    ) {
    }

    public record AiAssistantResponse(
        String invocationId,
        AiScenario scenario,
        String model,
        Map<String, Object> result,
        List<AiContextReference> sourceReferences,
        OffsetDateTime generatedAt
    ) {
    }

    public record AiContextReference(
        String type,
        String id,
        String label
    ) {
    }
}
