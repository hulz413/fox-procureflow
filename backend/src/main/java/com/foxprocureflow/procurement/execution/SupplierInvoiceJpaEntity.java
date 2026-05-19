package com.foxprocureflow.procurement.execution;

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
@Table(name = "supplier_invoices")
public class SupplierInvoiceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String invoiceId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false, length = 96)
    private String invoiceNumber;

    @Column(nullable = false)
    private LocalDate invoiceDate;

    @Column(nullable = false, length = 64)
    private String registeredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SupplierInvoiceStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal untaxedAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(length = 1000)
    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected SupplierInvoiceJpaEntity() {
    }

    SupplierInvoiceJpaEntity(
        String invoiceId,
        String companyId,
        String poId,
        String supplierId,
        String supplierName,
        String invoiceNumber,
        LocalDate invoiceDate,
        String registeredBy,
        BigDecimal untaxedAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        String note
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.invoiceId = invoiceId;
        this.companyId = companyId;
        this.poId = poId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.registeredBy = registeredBy;
        this.status = SupplierInvoiceStatus.RECORDED;
        this.untaxedAmount = untaxedAmount;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.note = note;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getInvoiceId() {
        return invoiceId;
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

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public String getRegisteredBy() {
        return registeredBy;
    }

    public SupplierInvoiceStatus getStatus() {
        return status;
    }

    public BigDecimal getUntaxedAmount() {
        return untaxedAmount;
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

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
