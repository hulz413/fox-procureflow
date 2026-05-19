package com.foxprocureflow.procurement.execution;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_receipts")
public class PurchaseReceiptJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String receiptId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false, length = 64)
    private String receivedBy;

    @Column(nullable = false)
    private LocalDate receivedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseReceiptStatus status;

    @Column(length = 1000)
    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected PurchaseReceiptJpaEntity() {
    }

    PurchaseReceiptJpaEntity(
        String receiptId,
        String companyId,
        String poId,
        String supplierId,
        String supplierName,
        String receivedBy,
        LocalDate receivedDate,
        String note
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.receiptId = receiptId;
        this.companyId = companyId;
        this.poId = poId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.receivedBy = receivedBy;
        this.receivedDate = receivedDate;
        this.status = PurchaseReceiptStatus.RECORDED;
        this.note = note;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getReceiptId() {
        return receiptId;
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

    public String getReceivedBy() {
        return receivedBy;
    }

    public LocalDate getReceivedDate() {
        return receivedDate;
    }

    public PurchaseReceiptStatus getStatus() {
        return status;
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
