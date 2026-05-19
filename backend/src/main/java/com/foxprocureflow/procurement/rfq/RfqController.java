package com.foxprocureflow.procurement.rfq;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.rfq.RfqDtos.CreateRfqRequest;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqComparisonRowResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqDetailResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqListItemResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqQuoteResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.UpsertQuoteRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rfqs")
public class RfqController {

    private final RfqService rfqService;

    public RfqController(RfqService rfqService) {
        this.rfqService = rfqService;
    }

    @Operation(summary = "Create an RFQ from an approved purchase request")
    @PostMapping
    public ApiEnvelope<RfqDetailResponse> create(@Valid @RequestBody CreateRfqRequest request) {
        return ApiEnvelope.ok(rfqService.create(request));
    }

    @Operation(summary = "List company-scoped RFQs")
    @GetMapping
    public ApiEnvelope<List<RfqListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) RfqStatus status
    ) {
        return ApiEnvelope.ok(rfqService.list(companyId, status));
    }

    @Operation(summary = "Get RFQ detail")
    @GetMapping("/{rfqId}")
    public ApiEnvelope<RfqDetailResponse> detail(
        @PathVariable String rfqId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(rfqService.detail(rfqId, companyId));
    }

    @Operation(summary = "Create or update a supplier quote for an RFQ")
    @PutMapping("/{rfqId}/quotes/{supplierId}")
    public ApiEnvelope<RfqQuoteResponse> upsertQuote(
        @PathVariable String rfqId,
        @PathVariable String supplierId,
        @Valid @RequestBody UpsertQuoteRequest request
    ) {
        return ApiEnvelope.ok(rfqService.upsertQuote(rfqId, supplierId, request));
    }

    @Operation(summary = "Compare RFQ supplier quotes")
    @GetMapping("/{rfqId}/comparison")
    public ApiEnvelope<List<RfqComparisonRowResponse>> comparison(
        @PathVariable String rfqId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(rfqService.comparison(rfqId, companyId));
    }
}
