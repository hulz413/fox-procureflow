package com.foxprocureflow.procurement.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_order_lines")
public class PurchaseOrderLineJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String lineId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(nullable = false)
    private int lineNo;

    @Column(nullable = false, length = 160)
    private String itemName;

    @Column(length = 255)
    private String specification;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(length = 64)
    private String categoryId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedUnitPrice;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal confirmedUnitPrice;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal confirmedAmount;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected PurchaseOrderLineJpaEntity() {
    }

    PurchaseOrderLineJpaEntity(
        String lineId,
        String poId,
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
        this.lineId = lineId;
        this.poId = poId;
        this.lineNo = lineNo;
        this.itemName = itemName;
        this.specification = specification;
        this.quantity = quantity;
        this.unit = unit;
        this.categoryId = categoryId;
        this.estimatedUnitPrice = estimatedUnitPrice;
        this.estimatedAmount = estimatedAmount;
        this.confirmedUnitPrice = confirmedUnitPrice;
        this.confirmedAmount = confirmedAmount;
        this.createdAt = LocalDateTime.now();
    }

    public String getLineId() {
        return lineId;
    }

    public String getPoId() {
        return poId;
    }

    public int getLineNo() {
        return lineNo;
    }

    public String getItemName() {
        return itemName;
    }

    public String getSpecification() {
        return specification;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public String getUnit() {
        return unit;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public BigDecimal getEstimatedUnitPrice() {
        return estimatedUnitPrice;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public BigDecimal getConfirmedUnitPrice() {
        return confirmedUnitPrice;
    }

    public BigDecimal getConfirmedAmount() {
        return confirmedAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
