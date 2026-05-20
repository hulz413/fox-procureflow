package com.foxprocureflow.procurement.request;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.CreateDraftRequest;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.DeleteDraftResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestDetailResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestListItemResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    @Operation(summary = "Create a purchase request draft")
    @PostMapping("/drafts")
    public ApiEnvelope<PurchaseRequestDetailResponse> createDraft(@Valid @RequestBody CreateDraftRequest request) {
        return ApiEnvelope.ok(purchaseRequestService.createDraft(request));
    }

    @Operation(summary = "Submit a purchase request draft")
    @PostMapping("/{requestId}/submit")
    public ApiEnvelope<PurchaseRequestDetailResponse> submit(@PathVariable String requestId) {
        return ApiEnvelope.ok(purchaseRequestService.submit(requestId));
    }

    @Operation(summary = "Delete a purchase request draft")
    @DeleteMapping("/{requestId}")
    public ApiEnvelope<DeleteDraftResponse> deleteDraft(
        @PathVariable String requestId,
        @RequestParam String actorId,
        @RequestParam(required = false) String reason
    ) {
        return ApiEnvelope.ok(purchaseRequestService.deleteDraft(requestId, actorId, reason));
    }

    @Operation(summary = "List company-scoped purchase requests")
    @GetMapping
    public ApiEnvelope<List<PurchaseRequestListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) PurchaseRequestStatus status
    ) {
        return ApiEnvelope.ok(purchaseRequestService.list(companyId, status));
    }

    @Operation(summary = "Get purchase request detail")
    @GetMapping("/{requestId}")
    public ApiEnvelope<PurchaseRequestDetailResponse> detail(@PathVariable String requestId) {
        return ApiEnvelope.ok(purchaseRequestService.detail(requestId));
    }
}
