package com.foxprocureflow.attachments;

import com.foxprocureflow.attachments.AttachmentDtos.AttachmentDownload;
import com.foxprocureflow.attachments.AttachmentDtos.AttachmentMetadataResponse;
import com.foxprocureflow.attachments.AttachmentDtos.BusinessAttachmentSnapshot;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderJpaEntity;
import com.foxprocureflow.procurement.order.PurchaseOrderRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderStatus;
import com.foxprocureflow.procurement.rfq.RfqJpaEntity;
import com.foxprocureflow.procurement.rfq.RfqRepository;
import com.foxprocureflow.procurement.rfq.RfqSupplierRepository;
import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileAttachmentService {

    private final FileAttachmentRepository attachmentRepository;
    private final AttachmentObjectStorage objectStorage;
    private final AttachmentProperties properties;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final RfqRepository rfqRepository;
    private final RfqSupplierRepository rfqSupplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public FileAttachmentService(
        FileAttachmentRepository attachmentRepository,
        AttachmentObjectStorage objectStorage,
        AttachmentProperties properties,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        RfqRepository rfqRepository,
        RfqSupplierRepository rfqSupplierRepository,
        PurchaseOrderRepository purchaseOrderRepository
    ) {
        this.attachmentRepository = attachmentRepository;
        this.objectStorage = objectStorage;
        this.properties = properties;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.rfqRepository = rfqRepository;
        this.rfqSupplierRepository = rfqSupplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional
    public AttachmentMetadataResponse upload(
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String supplierId,
        String uploadedBy,
        String description,
        MultipartFile file
    ) {
        requireCompany(companyId);
        String normalizedUploadedBy = blankToNull(uploadedBy);
        if (normalizedUploadedBy != null) {
            requireUserInCompany(companyId, normalizedUploadedBy);
        }
        ValidatedTarget target = validateTarget(companyId, targetType, targetId, supplierId);
        validateFile(file);

        String originalFileName = safeOriginalFileName(file.getOriginalFilename());
        String contentType = normalizedContentType(file.getContentType());
        String attachmentId = nextAttachmentId();
        String bucketName = bucketName(targetType);
        String objectKey = objectKey(companyId, targetType, target, attachmentId, originalFileName);
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("company-id", companyId);
        metadata.put("target-type", targetType.name());
        metadata.put("target-id", target.targetId());
        if (target.targetSecondaryId() != null) {
            metadata.put("target-secondary-id", target.targetSecondaryId());
        }
        if (normalizedUploadedBy != null) {
            metadata.put("uploaded-by", normalizedUploadedBy);
        }

        AttachmentObjectStorage.StoredObject stored;
        try (InputStream input = file.getInputStream()) {
            stored = objectStorage.upload(bucketName, objectKey, input, file.getSize(), contentType, metadata);
        } catch (AttachmentStorageException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        } catch (IOException ex) {
            throw badRequest("Unable to read uploaded file");
        }

        FileAttachmentJpaEntity entity = new FileAttachmentJpaEntity(
            attachmentId,
            companyId,
            targetType,
            target.targetId(),
            target.targetSecondaryId(),
            target.supplierId(),
            bucketName,
            objectKey,
            originalFileName,
            blankToNull(description),
            contentType,
            file.getSize(),
            stored.etag(),
            normalizedUploadedBy);
        try {
            return toResponse(attachmentRepository.saveAndFlush(entity));
        } catch (RuntimeException ex) {
            try {
                objectStorage.delete(bucketName, objectKey);
            } catch (AttachmentStorageException cleanupFailure) {
                entity.markOrphaned();
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<AttachmentMetadataResponse> list(
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String supplierId
    ) {
        requireCompany(companyId);
        List<FileAttachmentJpaEntity> entities = attachmentRepository
            .findByCompanyIdAndTargetTypeAndTargetIdOrderByCreatedAtDesc(companyId, targetType, targetId);
        String normalizedSupplierId = blankToNull(supplierId);
        return entities.stream()
            .filter(entity -> normalizedSupplierId == null || normalizedSupplierId.equals(entity.getSupplierId()))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AttachmentDownload download(String attachmentId, String companyId) {
        FileAttachmentJpaEntity attachment = requireAttachment(attachmentId);
        requireCompany(companyId);
        if (!companyId.equals(attachment.getCompanyId())) {
            throw badRequest("attachmentId does not belong to companyId: " + companyId);
        }
        validateStoredTarget(attachment);
        if (attachment.getStorageStatus() != FileAttachmentStorageStatus.READY || attachment.getObjectKey() == null) {
            throw conflict("Attachment is metadata-only and cannot be downloaded: " + attachmentId);
        }
        try {
            return new AttachmentDownload(
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                objectStorage.download(attachment.getBucketName(), attachment.getObjectKey()));
        } catch (AttachmentStorageException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stored object is not available: " + attachmentId, ex);
        }
    }

    @Transactional
    public List<BusinessAttachmentSnapshot> claimForRfqQuote(
        String companyId,
        String rfqId,
        String supplierId,
        String quoteId,
        List<String> attachmentIds
    ) {
        return claim(companyId, FileAttachmentTargetType.RFQ_QUOTE, rfqId, supplierId, quoteId, attachmentIds);
    }

    @Transactional
    public List<BusinessAttachmentSnapshot> claimForReceipt(
        String companyId,
        String poId,
        String supplierId,
        String receiptId,
        List<String> attachmentIds
    ) {
        return claim(companyId, FileAttachmentTargetType.RECEIPT, poId, supplierId, receiptId, attachmentIds);
    }

    @Transactional
    public List<BusinessAttachmentSnapshot> claimForInvoice(
        String companyId,
        String poId,
        String supplierId,
        String invoiceId,
        List<String> attachmentIds
    ) {
        return claim(companyId, FileAttachmentTargetType.INVOICE, poId, supplierId, invoiceId, attachmentIds);
    }

    @Transactional
    public void releaseBusinessLinks(List<String> fileAttachmentIds, String businessId) {
        if (fileAttachmentIds == null || fileAttachmentIds.isEmpty()) {
            return;
        }
        attachmentRepository.findByAttachmentIdIn(fileAttachmentIds).forEach(attachment -> attachment.releaseLink(businessId));
    }

    public static boolean isDownloadable(String fileAttachmentId, String storageObjectKey, String storageStatus) {
        return fileAttachmentId != null
            && storageObjectKey != null
            && FileAttachmentStorageStatus.READY.name().equals(storageStatus);
    }

    public static String downloadDisabledReason(String fileAttachmentId, String storageObjectKey, String storageStatus) {
        if (isDownloadable(fileAttachmentId, storageObjectKey, storageStatus)) {
            return null;
        }
        if (storageObjectKey == null || fileAttachmentId == null) {
            return "仅有附件元数据，未上传真实文件";
        }
        if (!FileAttachmentStorageStatus.READY.name().equals(storageStatus)) {
            return "文件尚未处于可下载状态";
        }
        return "文件暂不可下载";
    }

    private List<BusinessAttachmentSnapshot> claim(
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String supplierId,
        String businessId,
        List<String> attachmentIds
    ) {
        List<String> normalizedIds = normalizedAttachmentIds(attachmentIds);
        if (normalizedIds.isEmpty()) {
            return List.of();
        }
        Map<String, FileAttachmentJpaEntity> byId = attachmentRepository.findByAttachmentIdIn(normalizedIds).stream()
            .collect(Collectors.toMap(FileAttachmentJpaEntity::getAttachmentId, Function.identity()));
        List<BusinessAttachmentSnapshot> snapshots = new ArrayList<>();
        for (String attachmentId : normalizedIds) {
            FileAttachmentJpaEntity attachment = byId.get(attachmentId);
            if (attachment == null) {
                throw badRequest("Unknown attachmentId: " + attachmentId);
            }
            validateClaimTarget(attachment, companyId, targetType, targetId, supplierId, businessId);
            attachment.linkTo(businessId);
            snapshots.add(new BusinessAttachmentSnapshot(
                attachment.getAttachmentId(),
                attachment.getOriginalFileName(),
                attachment.getDescription(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getObjectKey(),
                attachment.getStorageStatus()));
        }
        return snapshots;
    }

    private void validateClaimTarget(
        FileAttachmentJpaEntity attachment,
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String supplierId,
        String businessId
    ) {
        if (!companyId.equals(attachment.getCompanyId())) {
            throw badRequest("attachmentId does not belong to companyId: " + attachment.getAttachmentId());
        }
        if (attachment.getTargetType() != targetType) {
            throw badRequest("attachmentId has incompatible targetType: " + attachment.getAttachmentId());
        }
        if (!targetId.equals(attachment.getTargetId())) {
            throw badRequest("attachmentId does not belong to targetId: " + attachment.getAttachmentId());
        }
        if (supplierId != null && attachment.getSupplierId() != null && !supplierId.equals(attachment.getSupplierId())) {
            throw badRequest("attachmentId does not belong to supplierId: " + attachment.getAttachmentId());
        }
        if (attachment.getStorageStatus() != FileAttachmentStorageStatus.READY || attachment.getObjectKey() == null) {
            throw badRequest("attachmentId is not a ready uploaded file: " + attachment.getAttachmentId());
        }
        String linkedBusinessId = attachment.getLinkedBusinessId();
        if (linkedBusinessId != null && !linkedBusinessId.equals(businessId)) {
            throw badRequest("attachmentId is already linked to another business object: " + attachment.getAttachmentId());
        }
    }

    private List<String> normalizedAttachmentIds(List<String> attachmentIds) {
        if (attachmentIds == null) {
            return List.of();
        }
        List<String> normalized = attachmentIds.stream()
            .map(this::blankToNull)
            .filter(value -> value != null)
            .toList();
        Set<String> seen = new HashSet<>(normalized);
        if (seen.size() != normalized.size()) {
            throw badRequest("attachmentIds must be unique");
        }
        return normalized;
    }

    private ValidatedTarget validateTarget(
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId,
        String supplierId
    ) {
        String normalizedTargetId = requireText(targetId, "targetId");
        return switch (targetType) {
            case RFQ_QUOTE -> validateRfqQuoteTarget(companyId, normalizedTargetId, requireText(supplierId, "supplierId"));
            case RECEIPT, INVOICE -> validatePurchaseOrderTarget(companyId, targetType, normalizedTargetId, blankToNull(supplierId));
        };
    }

    private ValidatedTarget validateRfqQuoteTarget(String companyId, String rfqId, String supplierId) {
        RfqJpaEntity rfq = rfqRepository.findByRfqId(rfqId)
            .orElseThrow(() -> notFound("Unknown rfqId: " + rfqId));
        if (!companyId.equals(rfq.getCompanyId())) {
            throw badRequest("rfqId does not belong to companyId: " + companyId);
        }
        if (!rfqSupplierRepository.existsByRfqIdAndSupplierId(rfqId, supplierId)) {
            throw badRequest("supplierId was not invited to rfqId: " + supplierId);
        }
        return new ValidatedTarget(rfqId, supplierId, supplierId);
    }

    private ValidatedTarget validatePurchaseOrderTarget(
        String companyId,
        FileAttachmentTargetType targetType,
        String poId,
        String supplierId
    ) {
        PurchaseOrderJpaEntity purchaseOrder = purchaseOrderRepository.findByPoId(poId)
            .orElseThrow(() -> notFound("Unknown poId: " + poId));
        if (!companyId.equals(purchaseOrder.getCompanyId())) {
            throw badRequest("poId does not belong to companyId: " + companyId);
        }
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.ISSUED) {
            throw conflict("Only ISSUED purchase orders can receive " + targetType.name() + " attachments: " + poId);
        }
        if (supplierId != null && !supplierId.equals(purchaseOrder.getSupplierId())) {
            throw badRequest("supplierId does not belong to poId: " + supplierId);
        }
        return new ValidatedTarget(poId, null, purchaseOrder.getSupplierId());
    }

    private void validateStoredTarget(FileAttachmentJpaEntity attachment) {
        switch (attachment.getTargetType()) {
            case RFQ_QUOTE -> validateRfqQuoteTarget(
                attachment.getCompanyId(),
                attachment.getTargetId(),
                attachment.getSupplierId());
            case RECEIPT, INVOICE -> validatePurchaseOrderTarget(
                attachment.getCompanyId(),
                attachment.getTargetType(),
                attachment.getTargetId(),
                attachment.getSupplierId());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw badRequest("Uploaded file must not be empty");
        }
        if (file.getSize() > properties.maxSizeBytes()) {
            throw badRequest("Uploaded file exceeds max size: " + properties.maxSizeBytes());
        }
        String contentType = normalizedContentType(file.getContentType());
        boolean allowed = properties.allowedContentTypes().stream()
            .map(value -> value.toLowerCase(Locale.ROOT))
            .anyMatch(value -> value.equals(contentType.toLowerCase(Locale.ROOT)));
        if (!allowed) {
            throw badRequest("Unsupported attachment content type: " + contentType);
        }
    }

    private AttachmentMetadataResponse toResponse(FileAttachmentJpaEntity attachment) {
        boolean downloadable = attachment.getStorageStatus() == FileAttachmentStorageStatus.READY
            && attachment.getObjectKey() != null;
        return new AttachmentMetadataResponse(
            attachment.getAttachmentId(),
            attachment.getCompanyId(),
            attachment.getTargetType(),
            attachment.getTargetId(),
            attachment.getTargetSecondaryId(),
            attachment.getSupplierId(),
            attachment.getOriginalFileName(),
            attachment.getDescription(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            attachment.getStorageStatus(),
            downloadable,
            downloadable ? "/api/attachments/" + attachment.getAttachmentId() + "/download?companyId=" + attachment.getCompanyId() : null,
            downloadable ? null : "文件尚未上传或不可下载",
            attachment.getUploadedBy(),
            attachment.getCreatedAt(),
            attachment.getUpdatedAt());
    }

    private FileAttachmentJpaEntity requireAttachment(String attachmentId) {
        return attachmentRepository.findByAttachmentId(attachmentId)
            .orElseThrow(() -> notFound("Unknown attachmentId: " + attachmentId));
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private void requireUserInCompany(String companyId, String userId) {
        DemoUserJpaEntity user = userRepository.findByUserId(userId)
            .orElseThrow(() -> badRequest("Unknown uploadedBy: " + userId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw badRequest("uploadedBy does not belong to companyId: " + userId);
        }
    }

    private String bucketName(FileAttachmentTargetType targetType) {
        return targetType == FileAttachmentTargetType.RFQ_QUOTE
            ? properties.minio().rfqBucket()
            : properties.minio().receiptInvoiceBucket();
    }

    private String objectKey(
        String companyId,
        FileAttachmentTargetType targetType,
        ValidatedTarget target,
        String attachmentId,
        String originalFileName
    ) {
        String safeFileName = safeObjectKeyFileName(originalFileName);
        return switch (targetType) {
            case RFQ_QUOTE -> "companies/%s/rfqs/%s/suppliers/%s/%s-%s".formatted(
                companyId,
                target.targetId(),
                target.targetSecondaryId(),
                attachmentId,
                safeFileName);
            case RECEIPT -> "companies/%s/receipts/purchase-orders/%s/%s-%s".formatted(
                companyId,
                target.targetId(),
                attachmentId,
                safeFileName);
            case INVOICE -> "companies/%s/invoices/purchase-orders/%s/%s-%s".formatted(
                companyId,
                target.targetId(),
                attachmentId,
                safeFileName);
        };
    }

    private String nextAttachmentId() {
        String date = LocalDate.now().toString().replace("-", "");
        return "ATT-" + date + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String safeOriginalFileName(String originalFileName) {
        String value = blankToNull(originalFileName);
        if (value == null) {
            return "attachment";
        }
        String fileName = value.replace("\\", "/");
        int lastSlash = fileName.lastIndexOf('/');
        if (lastSlash >= 0) {
            fileName = fileName.substring(lastSlash + 1);
        }
        if (fileName.length() > 255) {
            fileName = fileName.substring(fileName.length() - 255);
        }
        return fileName;
    }

    private String safeObjectKeyFileName(String fileName) {
        String normalized = Normalizer.normalize(fileName, Normalizer.Form.NFKD)
            .replaceAll("[^A-Za-z0-9._-]+", "-")
            .replaceAll("-{2,}", "-");
        normalized = normalized.replaceAll("^-+", "").replaceAll("-+$", "");
        return normalized.isBlank() ? "attachment" : normalized;
    }

    private String normalizedContentType(String contentType) {
        String normalized = blankToNull(contentType);
        return normalized == null ? "application/octet-stream" : normalized.toLowerCase(Locale.ROOT);
    }

    private String requireText(String value, String fieldName) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            throw badRequest(fieldName + " is required");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private static ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private record ValidatedTarget(String targetId, String targetSecondaryId, String supplierId) {
    }
}
