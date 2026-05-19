package com.foxprocureflow.procurement.execution;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.FulfillmentPurchaseOrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/receipts-invoices")
public class ReceiptInvoiceController {

    private final ReceiptInvoiceService receiptInvoiceService;

    public ReceiptInvoiceController(ReceiptInvoiceService receiptInvoiceService) {
        this.receiptInvoiceService = receiptInvoiceService;
    }

    @Operation(summary = "List issued purchase orders with receipt and invoice fulfillment summaries")
    @GetMapping("/purchase-orders")
    public ApiEnvelope<List<FulfillmentPurchaseOrderResponse>> purchaseOrders(@RequestParam String companyId) {
        return ApiEnvelope.ok(receiptInvoiceService.fulfillmentPurchaseOrders(companyId));
    }
}
