package com.foxprocureflow.procurement.execution;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateReceiptRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.ReceiptDetailResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.ReceiptListItemResponse;
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
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final ReceiptInvoiceService receiptInvoiceService;

    public ReceiptController(ReceiptInvoiceService receiptInvoiceService) {
        this.receiptInvoiceService = receiptInvoiceService;
    }

    @Operation(summary = "List company-scoped purchase receipts")
    @GetMapping
    public ApiEnvelope<List<ReceiptListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) String poId
    ) {
        return ApiEnvelope.ok(receiptInvoiceService.listReceipts(companyId, poId));
    }

    @Operation(summary = "Get purchase receipt detail")
    @GetMapping("/{receiptId}")
    public ApiEnvelope<ReceiptDetailResponse> detail(
        @PathVariable String receiptId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(receiptInvoiceService.receiptDetail(receiptId, companyId));
    }

    @Operation(summary = "Create a purchase receipt from an issued purchase order")
    @PostMapping
    public ApiEnvelope<ReceiptDetailResponse> create(@Valid @RequestBody CreateReceiptRequest request) {
        return ApiEnvelope.ok(receiptInvoiceService.createReceipt(request));
    }
}
