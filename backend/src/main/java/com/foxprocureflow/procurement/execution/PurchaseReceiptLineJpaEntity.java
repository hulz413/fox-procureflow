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
@Table(name = "purchase_receipt_lines")
public class PurchaseReceiptLineJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String receiptLineId;

    @Column(nullable = false, length = 80)
    private String receiptId;

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
    private BigDecimal receivedQuantity;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected PurchaseReceiptLineJpaEntity() {
    }

    PurchaseReceiptLineJpaEntity(
        String receiptLineId,
        String receiptId,
        String poId,
        String poLineId,
        int lineNo,
        String itemName,
        String specification,
        BigDecimal receivedQuantity,
        String unit,
        String note
    ) {
        this.receiptLineId = receiptLineId;
        this.receiptId = receiptId;
        this.poId = poId;
        this.poLineId = poLineId;
        this.lineNo = lineNo;
        this.itemName = itemName;
        this.specification = specification;
        this.receivedQuantity = receivedQuantity;
        this.unit = unit;
        this.note = note;
        this.createdAt = LocalDateTime.now();
    }

    public String getReceiptLineId() {
        return receiptLineId;
    }

    public String getReceiptId() {
        return receiptId;
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

    public BigDecimal getReceivedQuantity() {
        return receivedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
