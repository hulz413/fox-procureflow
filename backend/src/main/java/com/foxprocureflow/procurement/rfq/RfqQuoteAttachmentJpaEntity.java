package com.foxprocureflow.procurement.rfq;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "rfq_quote_attachments")
public class RfqQuoteAttachmentJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String attachmentId;

    @Column(length = 96)
    private String fileAttachmentId;

    @Column(nullable = false, length = 80)
    private String quoteId;

    @Column(nullable = false, length = 64)
    private String rfqId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(length = 500)
    private String description;

    @Column(length = 128)
    private String contentType;

    private Long sizeBytes;

    @Column(length = 512)
    private String storageObjectKey;

    @Column(nullable = false, length = 32)
    private String storageStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected RfqQuoteAttachmentJpaEntity() {
    }

    RfqQuoteAttachmentJpaEntity(
        String attachmentId,
        String quoteId,
        String rfqId,
        String supplierId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes,
        String storageObjectKey
    ) {
        this(
            attachmentId,
            null,
            quoteId,
            rfqId,
            supplierId,
            fileName,
            description,
            contentType,
            sizeBytes,
            storageObjectKey,
            storageObjectKey == null ? "METADATA_ONLY" : "READY");
    }

    RfqQuoteAttachmentJpaEntity(
        String attachmentId,
        String fileAttachmentId,
        String quoteId,
        String rfqId,
        String supplierId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes,
        String storageObjectKey,
        String storageStatus
    ) {
        this.attachmentId = attachmentId;
        this.fileAttachmentId = fileAttachmentId;
        this.quoteId = quoteId;
        this.rfqId = rfqId;
        this.supplierId = supplierId;
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

    public String getQuoteId() {
        return quoteId;
    }

    public String getRfqId() {
        return rfqId;
    }

    public String getSupplierId() {
        return supplierId;
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
