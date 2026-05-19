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
        this.attachmentId = attachmentId;
        this.quoteId = quoteId;
        this.rfqId = rfqId;
        this.supplierId = supplierId;
        this.fileName = fileName;
        this.description = description;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storageObjectKey = storageObjectKey;
        this.createdAt = LocalDateTime.now();
    }

    public String getAttachmentId() {
        return attachmentId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
