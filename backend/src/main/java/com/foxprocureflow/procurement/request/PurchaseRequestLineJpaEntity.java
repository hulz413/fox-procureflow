package com.foxprocureflow.procurement.request;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_request_lines")
public class PurchaseRequestLineJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String requestId;

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

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedUnitPrice;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedAmount;

    @Column(length = 64)
    private String categoryId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected PurchaseRequestLineJpaEntity() {
    }

    PurchaseRequestLineJpaEntity(
        String requestId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal quantity,
        String unit,
        BigDecimal estimatedUnitPrice,
        BigDecimal estimatedAmount,
        String categoryId
    ) {
        this.requestId = requestId;
        this.lineNo = lineNo;
        this.itemName = itemName;
        this.specification = specification;
        this.quantity = quantity;
        this.unit = unit;
        this.estimatedUnitPrice = estimatedUnitPrice;
        this.estimatedAmount = estimatedAmount;
        this.categoryId = categoryId;
        this.createdAt = LocalDateTime.now();
    }

    public int getLineNo() {
        return lineNo;
    }

    public String getRequestId() {
        return requestId;
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

    public BigDecimal getEstimatedUnitPrice() {
        return estimatedUnitPrice;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public String getCategoryId() {
        return categoryId;
    }
}
