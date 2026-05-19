package com.foxprocureflow.attachments;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_attachments")
public class FileAttachmentJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String attachmentId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FileAttachmentTargetType targetType;

    @Column(nullable = false, length = 96)
    private String targetId;

    @Column(length = 96)
    private String targetSecondaryId;

    @Column(length = 64)
    private String supplierId;

    @Column(nullable = false, length = 120)
    private String bucketName;

    @Column(nullable = false, length = 700)
    private String objectKey;

    @Column(nullable = false, length = 255)
    private String originalFileName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 128)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    @Column(length = 160)
    private String etag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FileAttachmentStorageStatus storageStatus;

    @Column(length = 64)
    private String uploadedBy;

    @Column(length = 96)
    private String linkedBusinessId;

    private LocalDateTime linkedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected FileAttachmentJpaEntity() {
    }

    FileAttachmentJpaEntity(
        String attachmentId,
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String targetSecondaryId,
        String supplierId,
        String bucketName,
        String objectKey,
        String originalFileName,
        String description,
        String contentType,
        Long sizeBytes,
        String etag,
        String uploadedBy
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.attachmentId = attachmentId;
        this.companyId = companyId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetSecondaryId = targetSecondaryId;
        this.supplierId = supplierId;
        this.bucketName = bucketName;
        this.objectKey = objectKey;
        this.originalFileName = originalFileName;
        this.description = description;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.etag = etag;
        this.storageStatus = FileAttachmentStorageStatus.READY;
        this.uploadedBy = uploadedBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void linkTo(String businessId) {
        LocalDateTime now = LocalDateTime.now();
        this.linkedBusinessId = businessId;
        this.linkedAt = now;
        this.updatedAt = now;
    }

    void releaseLink(String businessId) {
        if (businessId != null && !businessId.equals(this.linkedBusinessId)) {
            return;
        }
        this.linkedBusinessId = null;
        this.linkedAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    void markOrphaned() {
        this.storageStatus = FileAttachmentStorageStatus.ORPHANED;
        this.updatedAt = LocalDateTime.now();
    }

    public String getAttachmentId() {
        return attachmentId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public FileAttachmentTargetType getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getTargetSecondaryId() {
        return targetSecondaryId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getBucketName() {
        return bucketName;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getOriginalFileName() {
        return originalFileName;
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

    public String getEtag() {
        return etag;
    }

    public FileAttachmentStorageStatus getStorageStatus() {
        return storageStatus;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public String getLinkedBusinessId() {
        return linkedBusinessId;
    }

    public LocalDateTime getLinkedAt() {
        return linkedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
