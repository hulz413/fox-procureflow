package com.foxprocureflow.procurement.execution;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_invoice_lines")
public class SupplierInvoiceLineJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String invoiceLineId;

    @Column(nullable = false, length = 80)
    private String invoiceId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(nullable = false, length = 80)
    private String poLineId;

    @Column(nullable = false)
    private int lineNo;

    @Column(nullable = false, length = 160)
    private String itemName;

    @Column(length = 255)
    private String specification;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal invoicedQuantity;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal untaxedAmount;

    @Column(nullable = false, precision = 6, scale = 4)
    private BigDecimal taxRate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected SupplierInvoiceLineJpaEntity() {
    }

    SupplierInvoiceLineJpaEntity(
        String invoiceLineId,
        String invoiceId,
        String poId,
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal untaxedAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency
    ) {
        this.invoiceLineId = invoiceLineId;
        this.invoiceId = invoiceId;
        this.poId = poId;
        this.poLineId = poLineId;
        this.lineNo = lineNo;
        this.itemName = itemName;
        this.specification = specification;
        this.invoicedQuantity = invoicedQuantity;
        this.unit = unit;
        this.untaxedAmount = untaxedAmount;
        this.taxRate = taxRate;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.createdAt = LocalDateTime.now();
    }

    public String getInvoiceLineId() {
        return invoiceLineId;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getPoId() {
        return poId;
    }

    public String getPoLineId() {
        return poLineId;
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

    public BigDecimal getInvoicedQuantity() {
        return invoicedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getUntaxedAmount() {
        return untaxedAmount;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
