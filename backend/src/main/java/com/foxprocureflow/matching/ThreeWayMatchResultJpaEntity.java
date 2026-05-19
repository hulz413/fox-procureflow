package com.foxprocureflow.matching;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "three_way_match_results")
public class ThreeWayMatchResultJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String matchId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64, unique = true)
    private String poId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false, length = 180)
    private String poTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ThreeWayMatchStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal poTotalAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal orderedTotalQuantity;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal receivedTotalQuantity;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal invoicedTotalQuantity;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal invoiceTotalAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal invoiceVarianceAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private int differenceCount;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ThreeWayMatchSeverity highestSeverity;

    @Column(nullable = false)
    private LocalDateTime lastCalculatedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ThreeWayMatchResultJpaEntity() {
    }

    ThreeWayMatchResultJpaEntity(String matchId, String companyId, String poId) {
        LocalDateTime now = LocalDateTime.now();
        this.matchId = matchId;
        this.companyId = companyId;
        this.poId = poId;
        this.supplierId = "";
        this.supplierName = "";
        this.poTitle = "";
        this.status = ThreeWayMatchStatus.PENDING_INPUT;
        this.poTotalAmount = BigDecimal.ZERO;
        this.orderedTotalQuantity = BigDecimal.ZERO;
        this.receivedTotalQuantity = BigDecimal.ZERO;
        this.invoicedTotalQuantity = BigDecimal.ZERO;
        this.invoiceTotalAmount = BigDecimal.ZERO;
        this.invoiceVarianceAmount = BigDecimal.ZERO;
        this.currency = "CNY";
        this.differenceCount = 0;
        this.lastCalculatedAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void updateCalculated(
        String supplierId,
        String supplierName,
        String poTitle,
        ThreeWayMatchStatus status,
        BigDecimal poTotalAmount,
        BigDecimal orderedTotalQuantity,
        BigDecimal receivedTotalQuantity,
        BigDecimal invoicedTotalQuantity,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceVarianceAmount,
        String currency,
        int differenceCount,
        ThreeWayMatchSeverity highestSeverity
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.poTitle = poTitle;
        this.status = status;
        this.poTotalAmount = poTotalAmount;
        this.orderedTotalQuantity = orderedTotalQuantity;
        this.receivedTotalQuantity = receivedTotalQuantity;
        this.invoicedTotalQuantity = invoicedTotalQuantity;
        this.invoiceTotalAmount = invoiceTotalAmount;
        this.invoiceVarianceAmount = invoiceVarianceAmount;
        this.currency = currency;
        this.differenceCount = differenceCount;
        this.highestSeverity = highestSeverity;
        this.lastCalculatedAt = now;
        this.updatedAt = now;
    }

    void updateStatus(ThreeWayMatchStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getMatchId() {
        return matchId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getPoId() {
        return poId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public String getPoTitle() {
        return poTitle;
    }

    public ThreeWayMatchStatus getStatus() {
        return status;
    }

    public BigDecimal getPoTotalAmount() {
        return poTotalAmount;
    }

    public BigDecimal getOrderedTotalQuantity() {
        return orderedTotalQuantity;
    }

    public BigDecimal getReceivedTotalQuantity() {
        return receivedTotalQuantity;
    }

    public BigDecimal getInvoicedTotalQuantity() {
        return invoicedTotalQuantity;
    }

    public BigDecimal getInvoiceTotalAmount() {
        return invoiceTotalAmount;
    }

    public BigDecimal getInvoiceVarianceAmount() {
        return invoiceVarianceAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public int getDifferenceCount() {
        return differenceCount;
    }

    public ThreeWayMatchSeverity getHighestSeverity() {
        return highestSeverity;
    }

    public LocalDateTime getLastCalculatedAt() {
        return lastCalculatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
