package com.foxprocureflow.procurement.rfq;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rfq_quotes")
public class RfqQuoteJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String quoteId;

    @Column(nullable = false, length = 64)
    private String rfqId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quoteAmount;

    @Column(nullable = false, precision = 6, scale = 4)
    private BigDecimal taxRate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private LocalDate deliveryDate;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal supplierScore;

    @Column(length = 1000)
    private String riskNote;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected RfqQuoteJpaEntity() {
    }

    RfqQuoteJpaEntity(
        String quoteId,
        String rfqId,
        String supplierId,
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        LocalDate deliveryDate,
        BigDecimal supplierScore,
        String riskNote
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.quoteId = quoteId;
        this.rfqId = rfqId;
        this.supplierId = supplierId;
        this.createdAt = now;
        applyQuote(quoteAmount, taxRate, taxAmount, totalAmount, deliveryDate, supplierScore, riskNote, now);
    }

    void update(
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        LocalDate deliveryDate,
        BigDecimal supplierScore,
        String riskNote
    ) {
        applyQuote(
            quoteAmount,
            taxRate,
            taxAmount,
            totalAmount,
            deliveryDate,
            supplierScore,
            riskNote,
            LocalDateTime.now());
    }

    private void applyQuote(
        BigDecimal quoteAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        LocalDate deliveryDate,
        BigDecimal supplierScore,
        String riskNote,
        LocalDateTime updatedAt
    ) {
        this.quoteAmount = quoteAmount;
        this.taxRate = taxRate;
        this.taxAmount = taxAmount;
        this.totalAmount = totalAmount;
        this.deliveryDate = deliveryDate;
        this.supplierScore = supplierScore;
        this.riskNote = riskNote;
        this.updatedAt = updatedAt;
    }

    public String getQuoteId() {
        return quoteId;
    }

    public String getRfqId() {
        return rfqId;
    }

    public String getSupplierId() {
        return supplierId;
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

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public BigDecimal getSupplierScore() {
        return supplierScore;
    }

    public String getRiskNote() {
        return riskNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
