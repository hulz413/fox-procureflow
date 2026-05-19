package com.foxprocureflow.procurement.execution;

import com.foxprocureflow.procurement.order.PurchaseOrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ReceiptInvoiceDtos {

    private ReceiptInvoiceDtos() {
    }

    public record AttachmentMetadataRequest(
        @NotBlank @Size(max = 255) String fileName,
        @Size(max = 500) String description,
        @NotBlank @Size(max = 120) String contentType,
        @NotNull @PositiveOrZero Long sizeBytes
    ) {
    }

    public record CreateReceiptLineRequest(
        @NotBlank String poLineId,
        @NotNull @DecimalMin("0.01") BigDecimal receivedQuantity,
        @Size(max = 500) String note
    ) {
    }

    public record CreateReceiptRequest(
        @NotBlank String companyId,
        @NotBlank String poId,
        @NotBlank String receivedBy,
        @NotNull LocalDate receivedDate,
        @Size(max = 1000) String note,
        @NotEmpty @Valid List<CreateReceiptLineRequest> lines,
        @Valid List<AttachmentMetadataRequest> attachments,
        List<@NotBlank String> attachmentIds
    ) {
    }

    public record CreateInvoiceLineRequest(
        @NotBlank String poLineId,
        @NotNull @DecimalMin("0.01") BigDecimal invoicedQuantity,
        @NotNull @DecimalMin("0.00") BigDecimal untaxedAmount,
        @NotNull @DecimalMin("0.0000") BigDecimal taxRate,
        @NotNull @DecimalMin("0.00") BigDecimal taxAmount,
        @NotNull @DecimalMin("0.01") BigDecimal totalAmount
    ) {
    }

    public record CreateInvoiceRequest(
        @NotBlank String companyId,
        @NotBlank String poId,
        @NotBlank @Size(max = 96) String invoiceNumber,
        @NotNull LocalDate invoiceDate,
        @NotBlank String registeredBy,
        @Size(max = 1000) String note,
        @NotEmpty @Valid List<CreateInvoiceLineRequest> lines,
        @Valid List<AttachmentMetadataRequest> attachments,
        List<@NotBlank String> attachmentIds
    ) {
    }

    public record SourcePurchaseOrderResponse(
        String poId,
        String companyId,
        String title,
        PurchaseOrderStatus status,
        String supplierId,
        String supplierName,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate
    ) {
    }

    public record AttachmentMetadataResponse(
        String attachmentId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes,
        String storageObjectKey,
        String storageStatus,
        Boolean downloadable,
        String downloadUrl,
        String downloadDisabledReason,
        LocalDateTime createdAt
    ) {
    }

    public record ReceiptLineResponse(
        String receiptLineId,
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal receivedQuantity,
        String unit,
        String note,
        LocalDateTime createdAt
    ) {
    }

    public record ReceiptListItemResponse(
        String receiptId,
        String companyId,
        String poId,
        String supplierId,
        String supplierName,
        String receivedBy,
        LocalDate receivedDate,
        PurchaseReceiptStatus status,
        BigDecimal receivedQuantity,
        int lineCount,
        int attachmentCount,
        List<AttachmentMetadataResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record ReceiptDetailResponse(
        String receiptId,
        String companyId,
        SourcePurchaseOrderResponse sourcePo,
        String supplierId,
        String supplierName,
        String receivedBy,
        LocalDate receivedDate,
        PurchaseReceiptStatus status,
        String note,
        List<ReceiptLineResponse> lines,
        List<AttachmentMetadataResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record InvoiceLineResponse(
        String invoiceLineId,
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal untaxedAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        LocalDateTime createdAt
    ) {
    }

    public record InvoiceListItemResponse(
        String invoiceId,
        String companyId,
        String poId,
        String supplierId,
        String supplierName,
        String invoiceNumber,
        LocalDate invoiceDate,
        String registeredBy,
        SupplierInvoiceStatus status,
        BigDecimal untaxedAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        int lineCount,
        int attachmentCount,
        List<AttachmentMetadataResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record InvoiceDetailResponse(
        String invoiceId,
        String companyId,
        SourcePurchaseOrderResponse sourcePo,
        String supplierId,
        String supplierName,
        String invoiceNumber,
        LocalDate invoiceDate,
        String registeredBy,
        SupplierInvoiceStatus status,
        BigDecimal untaxedAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        String note,
        List<InvoiceLineResponse> lines,
        List<AttachmentMetadataResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record FulfillmentLineResponse(
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal confirmedAmount
    ) {
    }

    public record FulfillmentPurchaseOrderResponse(
        String poId,
        String companyId,
        String title,
        String supplierId,
        String supplierName,
        BigDecimal poTotalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceAmountVariance,
        ReceiptProgressStatus receiptSummary,
        InvoiceProgressStatus invoiceSummary,
        InvoiceAmountStatus invoiceAmountStatus,
        int attachmentCount,
        List<FulfillmentLineResponse> lines,
        LocalDateTime issuedAt,
        LocalDateTime updatedAt
    ) {
    }
}
