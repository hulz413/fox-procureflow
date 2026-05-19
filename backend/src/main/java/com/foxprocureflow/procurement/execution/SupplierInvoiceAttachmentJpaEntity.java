package com.foxprocureflow.procurement.execution;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_invoice_attachments")
public class SupplierInvoiceAttachmentJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String attachmentId;

    @Column(length = 96)
    private String fileAttachmentId;

    @Column(nullable = false, length = 80)
    private String invoiceId;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 120)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    @Column(length = 500)
    private String storageObjectKey;

    @Column(nullable = false, length = 32)
    private String storageStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected SupplierInvoiceAttachmentJpaEntity() {
    }

    SupplierInvoiceAttachmentJpaEntity(
        String attachmentId,
        String invoiceId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes
    ) {
        this(attachmentId, null, invoiceId, fileName, description, contentType, sizeBytes, null, "METADATA_ONLY");
    }

    SupplierInvoiceAttachmentJpaEntity(
        String attachmentId,
        String fileAttachmentId,
        String invoiceId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes,
        String storageObjectKey,
        String storageStatus
    ) {
        this.attachmentId = attachmentId;
        this.fileAttachmentId = fileAttachmentId;
        this.invoiceId = invoiceId;
        this.fileName = fileName;
        this.description = description;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storageObjectKey = storageObjectKey;
        this.storageStatus = storageStatus;
        this.createdAt = LocalDateTime.now();
    }

    public String getAttachmentId() {
        return attachmentId;
    }

    public String getFileAttachmentId() {
        return fileAttachmentId;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getDescription() {
        return description;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public String getStorageObjectKey() {
        return storageObjectKey;
    }

    public String getStorageStatus() {
        return storageStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
