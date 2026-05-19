package com.foxprocureflow.procurement.order;

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
@Table(name = "purchase_orders")
public class PurchaseOrderJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String poId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64, unique = true)
    private String rfqId;

    @Column(nullable = false, length = 80)
    private String quoteId;

    @Column(nullable = false, length = 64)
    private String requestId;

    @Column(nullable = false, length = 64)
    private String approvalId;

    @Column(nullable = false, length = 64)
    private String requesterId;

    @Column(nullable = false, length = 64)
    private String procurementUserId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false)
    private String supplierServiceScope;

    @Column(nullable = false, length = 32)
    private String supplierRiskLevel;

    @Column(nullable = false, length = 64)
    private String categoryId;

    @Column(nullable = false, length = 64)
    private String budgetAccountId;

    @Column(nullable = false, length = 180)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quoteAmount;

    @Column(nullable = false, precision = 6, scale = 4)
    private BigDecimal taxRate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private LocalDate expectedDeliveryDate;

    @Column(nullable = false)
    private LocalDate quoteDeliveryDate;

    @Column(nullable = false)
    private LocalDateTime quoteUpdatedAt;

    @Column(nullable = false, columnDefinition = "JSON")
    private String upstreamSnapshotJson;

    private LocalDateTime issuedAt;

    private LocalDateTime cancelledAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected PurchaseOrderJpaEntity() {
    }

    PurchaseOrderJpaEntity(
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
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        LocalDate quoteDeliveryDate,
        LocalDateTime quoteUpdatedAt,
        String upstreamSnapshotJson
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.poId = poId;
        this.companyId = companyId;
        this.rfqId = rfqId;
        this.quoteId = quoteId;
        this.requestId = requestId;
        this.approvalId = approvalId;
        this.requesterId = requesterId;
        this.procurementUserId = procurementUserId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.supplierServiceScope = supplierServiceScope;
        this.supplierRiskLevel = supplierRiskLevel;
        this.categoryId = categoryId;
        this.budgetAccountId = budgetAccountId;
        this.title = title;
        this.status = PurchaseOrderStatus.DRAFT;
        this.quoteAmount = quoteAmount;
        this.taxRate = taxRate;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.quoteDeliveryDate = quoteDeliveryDate;
        this.quoteUpdatedAt = quoteUpdatedAt;
        this.upstreamSnapshotJson = upstreamSnapshotJson;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void publish() {
        LocalDateTime now = LocalDateTime.now();
        this.status = PurchaseOrderStatus.ISSUED;
        this.issuedAt = now;
        this.updatedAt = now;
    }

    void cancel() {
        LocalDateTime now = LocalDateTime.now();
        this.status = PurchaseOrderStatus.CANCELLED;
        this.cancelledAt = now;
        this.updatedAt = now;
    }

    public String getPoId() {
        return poId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getRfqId() {
        return rfqId;
    }

    public String getQuoteId() {
        return quoteId;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getApprovalId() {
        return approvalId;
    }

    public String getRequesterId() {
        return requesterId;
    }

    public String getProcurementUserId() {
        return procurementUserId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public String getSupplierServiceScope() {
        return supplierServiceScope;
    }

    public String getSupplierRiskLevel() {
        return supplierRiskLevel;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getBudgetAccountId() {
        return budgetAccountId;
    }

    public String getTitle() {
        return title;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public BigDecimal getQuoteAmount() {
        return quoteAmount;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
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

    public LocalDate getQuoteDeliveryDate() {
        return quoteDeliveryDate;
    }

    public LocalDateTime getQuoteUpdatedAt() {
        return quoteUpdatedAt;
    }

    public String getUpstreamSnapshotJson() {
        return upstreamSnapshotJson;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
