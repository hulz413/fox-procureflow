package com.foxprocureflow.procurement.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class PurchaseOrderDtos {

    private PurchaseOrderDtos() {
    }

    public record CreatePurchaseOrderRequest(
        @NotBlank String companyId,
        @NotBlank String rfqId,
        @NotBlank String quoteId,
        @NotBlank String procurementUserId,
        @NotNull LocalDate plannedDeliveryDate,
        @NotBlank @Size(max = 255) String deliveryLocation,
        @NotBlank @Size(max = 80) String contactPerson,
        @NotBlank @Size(max = 64) String contactPhone,
        @Size(max = 500) String deliveryNote
    ) {
    }

    public record PurchaseOrderActionRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @Size(max = 1000) String comment
    ) {
    }

    public record CancelPurchaseOrderRequest(
        @NotBlank String companyId,
        @NotBlank String actorId,
        @NotBlank @Size(max = 1000) String reason
    ) {
    }

    public record PurchaseOrderListItemResponse(
        String poId,
        String companyId,
        String rfqId,
        String quoteId,
        String requestId,
        String approvalId,
        String title,
        PurchaseOrderStatus status,
        String supplierId,
        String supplierName,
        String procurementUserId,
        String categoryId,
        BigDecimal quoteAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDate plannedDeliveryDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime issuedAt,
        LocalDateTime cancelledAt
    ) {
    }

    public record PurchaseOrderDetailResponse(
        String poId,
        String companyId,
        String rfqId,
        String quoteId,
        String requestId,
        String approvalId,
        String requesterId,
        String procurementUserId,
        String supplierId,
        String supplierName,
        String supplierServiceScope,
        String supplierRiskLevel,
        String categoryId,
        String budgetAccountId,
        String title,
        PurchaseOrderStatus status,
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDate quoteDeliveryDate,
        LocalDateTime quoteUpdatedAt,
        Map<String, Object> upstreamSnapshot,
        List<PurchaseOrderLineResponse> lines,
        PurchaseOrderDeliveryScheduleResponse deliverySchedule,
        List<PurchaseOrderStatusRecordResponse> statusRecords,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime issuedAt,
        LocalDateTime cancelledAt
    ) {
    }

    public record PurchaseOrderLineResponse(
        String lineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal quantity,
        String unit,
        String categoryId,
        BigDecimal estimatedUnitPrice,
        BigDecimal estimatedAmount,
        BigDecimal confirmedUnitPrice,
        BigDecimal confirmedAmount
    ) {
    }

    public record PurchaseOrderDeliveryScheduleResponse(
        String scheduleId,
        LocalDate plannedDeliveryDate,
        String deliveryLocation,
        String contactPerson,
        String contactPhone,
        String deliveryNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record PurchaseOrderStatusRecordResponse(
        String recordId,
        String actorId,
        PurchaseOrderAction action,
        PurchaseOrderStatus fromStatus,
        PurchaseOrderStatus toStatus,
        String comment,
        LocalDateTime createdAt
    ) {
    }
}
