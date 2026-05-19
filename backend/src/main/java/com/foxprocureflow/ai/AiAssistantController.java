package com.foxprocureflow.ai;

import com.foxprocureflow.ai.AiAssistantDtos.AiAssistantResponse;
import com.foxprocureflow.ai.AiAssistantDtos.MatchingExplanationRequest;
import com.foxprocureflow.ai.AiAssistantDtos.PurchaseRequestDraftPreviewRequest;
import com.foxprocureflow.ai.AiAssistantDtos.PurchaseRequestRiskReviewRequest;
import com.foxprocureflow.ai.AiAssistantDtos.RfqQuoteExplanationRequest;
import com.foxprocureflow.common.api.ApiEnvelope;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-assistant")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @Operation(summary = "Generate an AI purchase request draft preview")
    @PostMapping("/purchase-request-draft-preview")
    public ApiEnvelope<AiAssistantResponse> previewPurchaseRequestDraft(
        @Valid @RequestBody PurchaseRequestDraftPreviewRequest request
    ) {
        return ApiEnvelope.ok(aiAssistantService.previewPurchaseRequestDraft(request));
    }

    @Operation(summary = "Review purchase request risk with AI")
    @PostMapping("/purchase-request-risk-review")
    public ApiEnvelope<AiAssistantResponse> reviewPurchaseRequestRisk(
        @Valid @RequestBody PurchaseRequestRiskReviewRequest request
    ) {
        return ApiEnvelope.ok(aiAssistantService.reviewPurchaseRequestRisk(request));
    }

    @Operation(summary = "Explain RFQ quote comparison with AI")
    @PostMapping("/rfq-quote-explanation")
    public ApiEnvelope<AiAssistantResponse> explainRfqQuotes(
        @Valid @RequestBody RfqQuoteExplanationRequest request
    ) {
        return ApiEnvelope.ok(aiAssistantService.explainRfqQuotes(request));
    }

    @Operation(summary = "Explain three-way matching exception with AI")
    @PostMapping("/three-way-matching-explanation")
    public ApiEnvelope<AiAssistantResponse> explainMatchingException(
        @Valid @RequestBody MatchingExplanationRequest request
    ) {
        return ApiEnvelope.ok(aiAssistantService.explainMatchingException(request));
    }
}
