package com.foxprocureflow.procurement.order;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.CancelPurchaseOrderRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.CreatePurchaseOrderRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderActionRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderDetailResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderListItemResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @Operation(summary = "Create a purchase order from an RFQ quote")
    @PostMapping
    public ApiEnvelope<PurchaseOrderDetailResponse> create(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        return ApiEnvelope.ok(purchaseOrderService.create(request));
    }

    @Operation(summary = "List company-scoped purchase orders")
    @GetMapping
    public ApiEnvelope<List<PurchaseOrderListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) PurchaseOrderStatus status
    ) {
        return ApiEnvelope.ok(purchaseOrderService.list(companyId, status));
    }

    @Operation(summary = "Get purchase order detail")
    @GetMapping("/{poId}")
    public ApiEnvelope<PurchaseOrderDetailResponse> detail(
        @PathVariable String poId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(purchaseOrderService.detail(poId, companyId));
    }

    @Operation(summary = "Publish a draft purchase order")
    @PostMapping("/{poId}/publish")
    public ApiEnvelope<PurchaseOrderDetailResponse> publish(
        @PathVariable String poId,
        @Valid @RequestBody PurchaseOrderActionRequest request
    ) {
        return ApiEnvelope.ok(purchaseOrderService.publish(poId, request));
    }

    @Operation(summary = "Cancel a purchase order")
    @PostMapping("/{poId}/cancel")
    public ApiEnvelope<PurchaseOrderDetailResponse> cancel(
        @PathVariable String poId,
        @Valid @RequestBody CancelPurchaseOrderRequest request
    ) {
        return ApiEnvelope.ok(purchaseOrderService.cancel(poId, request));
    }
}
