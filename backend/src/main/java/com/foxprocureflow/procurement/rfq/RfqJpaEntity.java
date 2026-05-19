package com.foxprocureflow.procurement.rfq;

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
@Table(name = "rfqs")
public class RfqJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String rfqId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64, unique = true)
    private String requestId;

    @Column(nullable = false, length = 64)
    private String approvalId;

    @Column(nullable = false, length = 64)
    private String requesterId;

    @Column(nullable = false, length = 64)
    private String procurementUserId;

    @Column(nullable = false, length = 64)
    private String categoryId;

    @Column(nullable = false, length = 64)
    private String budgetAccountId;

    @Column(nullable = false, length = 180)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RfqStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal requestTotalAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private LocalDate expectedDeliveryDate;

    @Column(nullable = false, columnDefinition = "JSON")
    private String requestSnapshotJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected RfqJpaEntity() {
    }

    RfqJpaEntity(
        String rfqId,
        String companyId,
        String requestId,
        String approvalId,
        String requesterId,
        String procurementUserId,
        String categoryId,
        String budgetAccountId,
        String title,
        BigDecimal requestTotalAmount,
        String currency,
        LocalDate expectedDeliveryDate,
        String requestSnapshotJson
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.rfqId = rfqId;
        this.companyId = companyId;
        this.requestId = requestId;
        this.approvalId = approvalId;
        this.requesterId = requesterId;
        this.procurementUserId = procurementUserId;
        this.categoryId = categoryId;
        this.budgetAccountId = budgetAccountId;
        this.title = title;
        this.status = RfqStatus.ISSUED;
        this.requestTotalAmount = requestTotalAmount;
        this.currency = currency;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.requestSnapshotJson = requestSnapshotJson;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void markStatus(RfqStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getRfqId() {
        return rfqId;
    }

    public String getCompanyId() {
        return companyId;
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

    public String getCategoryId() {
        return categoryId;
    }

    public String getBudgetAccountId() {
        return budgetAccountId;
    }

    public String getTitle() {
        return title;
    }

    public RfqStatus getStatus() {
        return status;
    }

    public BigDecimal getRequestTotalAmount() {
        return requestTotalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public String getRequestSnapshotJson() {
        return requestSnapshotJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
