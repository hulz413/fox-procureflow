package com.foxprocureflow.procurement.execution;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateInvoiceRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.InvoiceDetailResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.InvoiceListItemResponse;
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
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final ReceiptInvoiceService receiptInvoiceService;

    public InvoiceController(ReceiptInvoiceService receiptInvoiceService) {
        this.receiptInvoiceService = receiptInvoiceService;
    }

    @Operation(summary = "List company-scoped supplier invoices")
    @GetMapping
    public ApiEnvelope<List<InvoiceListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) String poId
    ) {
        return ApiEnvelope.ok(receiptInvoiceService.listInvoices(companyId, poId));
    }

    @Operation(summary = "Get supplier invoice detail")
    @GetMapping("/{invoiceId}")
    public ApiEnvelope<InvoiceDetailResponse> detail(
        @PathVariable String invoiceId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(receiptInvoiceService.invoiceDetail(invoiceId, companyId));
    }

    @Operation(summary = "Create a supplier invoice from an issued purchase order")
    @PostMapping
    public ApiEnvelope<InvoiceDetailResponse> create(@Valid @RequestBody CreateInvoiceRequest request) {
        return ApiEnvelope.ok(receiptInvoiceService.createInvoice(request));
    }
}
