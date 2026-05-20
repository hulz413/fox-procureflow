package com.foxprocureflow.procurement.request;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequestJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String requestId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String requesterId;

    @Column(nullable = false, length = 64)
    private String departmentId;

    @Column(nullable = false, length = 64)
    private String categoryId;

    @Column(nullable = false, length = 64)
    private String budgetAccountId;

    @Column(length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseRequestStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private LocalDate expectedDeliveryDate;

    private LocalDateTime submittedAt;

    @Column(nullable = false, columnDefinition = "JSON")
    private String fieldSnapshotJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @Column(length = 64)
    private String deletedBy;

    @Column(length = 255)
    private String deleteReason;

    protected PurchaseRequestJpaEntity() {
    }

    PurchaseRequestJpaEntity(
        String requestId,
        String companyId,
        String requesterId,
        String departmentId,
        String categoryId,
        String budgetAccountId,
        String supplierId,
        String title,
        String description,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        String fieldSnapshotJson
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.requestId = requestId;
        this.companyId = companyId;
        this.requesterId = requesterId;
        this.departmentId = departmentId;
        this.categoryId = categoryId;
        this.budgetAccountId = budgetAccountId;
        this.supplierId = supplierId;
        this.title = title;
        this.description = description;
        this.status = PurchaseRequestStatus.DRAFT;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.fieldSnapshotJson = fieldSnapshotJson;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void submit() {
        this.status = PurchaseRequestStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = this.submittedAt;
    }

    void deleteDraft(String actorId, String reason) {
        LocalDateTime now = LocalDateTime.now();
        this.deletedAt = now;
        this.deletedBy = actorId;
        this.deleteReason = reason;
        this.updatedAt = now;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getRequesterId() {
        return requesterId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getBudgetAccountId() {
        return budgetAccountId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public PurchaseRequestStatus getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public String getFieldSnapshotJson() {
        return fieldSnapshotJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public String getDeletedBy() {
        return deletedBy;
    }
}
