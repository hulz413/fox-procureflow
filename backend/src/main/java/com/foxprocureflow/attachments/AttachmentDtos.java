package com.foxprocureflow.attachments;

import java.io.InputStream;
import java.time.LocalDateTime;

public final class AttachmentDtos {

    private AttachmentDtos() {
    }

    public record AttachmentMetadataResponse(
        String attachmentId,
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String targetSecondaryId,
        String supplierId,
        String originalFileName,
        String description,
        String contentType,
        Long sizeBytes,
        FileAttachmentStorageStatus storageStatus,
        boolean downloadable,
        String downloadUrl,
        String downloadDisabledReason,
        String uploadedBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record BusinessAttachmentSnapshot(
        String attachmentId,
        String fileName,
        String description,
        String contentType,
        Long sizeBytes,
        String storageObjectKey,
        FileAttachmentStorageStatus storageStatus
    ) {
    }

    public record AttachmentDownload(
        String fileName,
        String contentType,
        long sizeBytes,
        InputStream stream
    ) {
    }
}
