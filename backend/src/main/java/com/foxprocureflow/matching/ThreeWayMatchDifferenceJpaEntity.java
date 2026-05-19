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
@Table(name = "three_way_match_differences")
public class ThreeWayMatchDifferenceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String differenceId;

    @Column(nullable = false, length = 80)
    private String matchId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(length = 80)
    private String poLineId;

    private Integer lineNo;

    @Column(length = 160)
    private String itemName;

    @Column(length = 255)
    private String specification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 48)
    private ThreeWayMatchDifferenceType differenceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ThreeWayMatchSeverity severity;

    @Column(precision = 14, scale = 2)
    private BigDecimal orderedQuantity;

    @Column(precision = 14, scale = 2)
    private BigDecimal receivedQuantity;

    @Column(precision = 14, scale = 2)
    private BigDecimal invoicedQuantity;

    @Column(length = 32)
    private String unit;

    @Column(precision = 14, scale = 2)
    private BigDecimal poAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal invoiceAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal differenceAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected ThreeWayMatchDifferenceJpaEntity() {
    }

    ThreeWayMatchDifferenceJpaEntity(
        String differenceId,
        String matchId,
        String companyId,
        String poId,
        String poLineId,
        Integer lineNo,
        String itemName,
        String specification,
        ThreeWayMatchDifferenceType differenceType,
        ThreeWayMatchSeverity severity,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal poAmount,
        BigDecimal invoiceAmount,
        BigDecimal differenceAmount,
        String currency,
        String description
    ) {
        this.differenceId = differenceId;
        this.matchId = matchId;
        this.companyId = companyId;
        this.poId = poId;
        this.poLineId = poLineId;
        this.lineNo = lineNo;
        this.itemName = itemName;
        this.specification = specification;
        this.differenceType = differenceType;
        this.severity = severity;
        this.orderedQuantity = orderedQuantity;
        this.receivedQuantity = receivedQuantity;
        this.invoicedQuantity = invoicedQuantity;
        this.unit = unit;
        this.poAmount = poAmount;
        this.invoiceAmount = invoiceAmount;
        this.differenceAmount = differenceAmount;
        this.currency = currency;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }

    public String getDifferenceId() {
        return differenceId;
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

    public String getPoLineId() {
        return poLineId;
    }

    public Integer getLineNo() {
        return lineNo;
    }

    public String getItemName() {
        return itemName;
    }

    public String getSpecification() {
        return specification;
    }

    public ThreeWayMatchDifferenceType getDifferenceType() {
        return differenceType;
    }

    public ThreeWayMatchSeverity getSeverity() {
        return severity;
    }

    public BigDecimal getOrderedQuantity() {
        return orderedQuantity;
    }

    public BigDecimal getReceivedQuantity() {
        return receivedQuantity;
    }

    public BigDecimal getInvoicedQuantity() {
        return invoicedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public BigDecimal getDifferenceAmount() {
        return differenceAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
