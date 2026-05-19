package com.foxprocureflow.matching;

import com.foxprocureflow.procurement.order.PurchaseOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ThreeWayMatchingDtos {

    private ThreeWayMatchingDtos() {
    }

    public record RecalculateMatchRequest(
        @NotBlank String companyId,
        @NotBlank String poId,
        @NotBlank String actorId
    ) {
    }

    public record HandleMatchActionRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotNull ThreeWayMatchActionType actionType,
        @NotBlank @Size(max = 1000) String note
    ) {
    }

    public record MatchListItemResponse(
        String matchId,
        String companyId,
        String poId,
        String poTitle,
        String supplierId,
        String supplierName,
        ThreeWayMatchStatus status,
        BigDecimal poTotalAmount,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceVarianceAmount,
        String currency,
        int differenceCount,
        ThreeWayMatchSeverity highestSeverity,
        LocalDateTime lastCalculatedAt,
        LocalDateTime updatedAt
    ) {
    }

    public record MatchPurchaseOrderSummary(
        String poId,
        String companyId,
        String title,
        PurchaseOrderStatus status,
        String supplierId,
        String supplierName,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDateTime issuedAt
    ) {
    }

    public record MatchReceiptSummary(
        int receiptCount,
        BigDecimal receivedQuantity,
        LocalDateTime latestReceiptAt
    ) {
    }

    public record MatchInvoiceSummary(
        int invoiceCount,
        BigDecimal invoicedQuantity,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceVarianceAmount,
        LocalDateTime latestInvoiceAt
    ) {
    }

    public record MatchLineResponse(
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        String unit
    ) {
    }

    public record MatchDifferenceResponse(
        String differenceId,
        ThreeWayMatchDifferenceType differenceType,
        ThreeWayMatchSeverity severity,
        String poLineId,
        Integer lineNo,
        String itemName,
        String specification,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal poAmount,
        BigDecimal invoiceAmount,
        BigDecimal differenceAmount,
        String currency,
        String description,
        LocalDateTime createdAt
    ) {
    }

    public record MatchActionResponse(
        String actionId,
        ThreeWayMatchActionType actionType,
        String actorId,
        String note,
        LocalDateTime createdAt
    ) {
    }

    public record MatchDetailResponse(
        String matchId,
        String companyId,
        ThreeWayMatchStatus status,
        MatchPurchaseOrderSummary sourcePo,
        MatchReceiptSummary receiptSummary,
        MatchInvoiceSummary invoiceSummary,
        BigDecimal orderedTotalQuantity,
        BigDecimal receivedTotalQuantity,
        BigDecimal invoicedTotalQuantity,
        BigDecimal poTotalAmount,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceVarianceAmount,
        String currency,
        int differenceCount,
        ThreeWayMatchSeverity highestSeverity,
        List<MatchLineResponse> lines,
        List<MatchDifferenceResponse> differences,
        List<MatchActionResponse> actions,
        LocalDateTime lastCalculatedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }
}
