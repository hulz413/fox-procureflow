package com.foxprocureflow.procurement.request;

import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalSummaryResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class PurchaseRequestDtos {

    private PurchaseRequestDtos() {
    }

    public record CreateDraftRequest(
        @NotBlank String companyId,
        @NotBlank String requesterId,
        @NotBlank String departmentId,
        @NotBlank String categoryId,
        @NotBlank String budgetAccountId,
        String supplierId,
        List<String> supplierIds,
        @NotBlank @Size(max = 160) String title,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal totalAmount,
        @NotBlank String currency,
        @NotNull LocalDate expectedDeliveryDate,
        @Valid @NotEmpty List<CreateDraftLineRequest> lineItems
    ) {
    }

    public record CreateDraftLineRequest(
        @NotBlank @Size(max = 160) String itemName,
        @Size(max = 255) String specification,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quantity,
        @NotBlank @Size(max = 32) String unit,
        @NotNull @DecimalMin(value = "0.01") BigDecimal estimatedUnitPrice,
        @NotNull @DecimalMin(value = "0.01") BigDecimal estimatedAmount
    ) {
    }

    public record PurchaseRequestListItemResponse(
        String requestId,
        String companyId,
        String requesterId,
        String departmentId,
        String categoryId,
        String budgetAccountId,
        String supplierId,
        List<String> supplierIds,
        String title,
        PurchaseRequestStatus status,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        int lineCount,
        ApprovalSummaryResponse approval
    ) {
    }

    public record PurchaseRequestDetailResponse(
        String requestId,
        String companyId,
        String requesterId,
        String departmentId,
        String categoryId,
        String budgetAccountId,
        String supplierId,
        List<String> supplierIds,
        String title,
        String description,
        PurchaseRequestStatus status,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Map<String, Object> fieldSnapshot,
        List<PurchaseRequestLineResponse> lineItems,
        ApprovalSummaryResponse approval
    ) {
    }

    public record PurchaseRequestLineResponse(
        int lineNo,
        String itemName,
        String specification,
        BigDecimal quantity,
        String unit,
        BigDecimal estimatedUnitPrice,
        BigDecimal estimatedAmount,
        String categoryId
    ) {
    }

    public record DeleteDraftResponse(
        String requestId,
        boolean deleted,
        LocalDateTime deletedAt,
        String deletedBy
    ) {
    }
}
