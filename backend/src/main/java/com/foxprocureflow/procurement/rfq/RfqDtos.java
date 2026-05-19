package com.foxprocureflow.procurement.rfq;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
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
import java.util.Map;

public final class RfqDtos {

    private RfqDtos() {
    }

    public record CreateRfqRequest(
        @NotBlank String companyId,
        @NotBlank String requestId,
        @NotBlank String procurementUserId,
        @Size(max = 180) String title,
        @NotEmpty List<@NotBlank String> supplierIds
    ) {
    }

    public record UpsertQuoteRequest(
        @NotBlank String companyId,
        @NotBlank String procurementUserId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quoteAmount,
        @NotNull @DecimalMin(value = "0.0000") @DecimalMax(value = "1.0000") BigDecimal taxRate,
        @NotNull LocalDate deliveryDate,
        @NotNull @DecimalMin(value = "0.00") @DecimalMax(value = "100.00") BigDecimal supplierScore,
        @Size(max = 1000) String riskNote,
        @Valid List<QuoteAttachmentRequest> attachments,
        List<@NotBlank String> attachmentIds
    ) {
    }

    public record QuoteAttachmentRequest(
        @NotBlank @Size(max = 255) String fileName,
        @Size(max = 500) String description,
        @Size(max = 128) String contentType,
        @PositiveOrZero Long sizeBytes
    ) {
    }

    public record RfqListItemResponse(
        String rfqId,
        String companyId,
        String requestId,
        String approvalId,
        String title,
        RfqStatus status,
        BigDecimal requestTotalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        String requesterId,
        String procurementUserId,
        String categoryId,
        int supplierCount,
        int quoteCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record RfqDetailResponse(
        String rfqId,
        String companyId,
        String requestId,
        String approvalId,
        String title,
        RfqStatus status,
        BigDecimal requestTotalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        String requesterId,
        String procurementUserId,
        String categoryId,
        String budgetAccountId,
        Map<String, Object> requestSnapshot,
        List<RfqSupplierResponse> suppliers,
        List<RfqQuoteResponse> quotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record RfqSupplierResponse(
        String supplierId,
        String supplierName,
        String serviceScope,
        String location,
        String riskLevel,
        String sharedScope,
        RfqSupplierStatus status,
        List<String> categoryCoverage,
        LocalDateTime createdAt
    ) {
    }

    public record RfqQuoteResponse(
        String quoteId,
        String rfqId,
        String supplierId,
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        LocalDate deliveryDate,
        BigDecimal supplierScore,
        String riskNote,
        List<RfqQuoteAttachmentResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record RfqQuoteAttachmentResponse(
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

    public record RfqComparisonRowResponse(
        int rank,
        BigDecimal recommendationScore,
        String supplierId,
        String supplierName,
        String serviceScope,
        String riskLevel,
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        LocalDate deliveryDate,
        BigDecimal supplierScore,
        String riskNote,
        List<RfqQuoteAttachmentResponse> attachments
    ) {
    }
}
