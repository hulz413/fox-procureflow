package com.foxprocureflow.attachments;

import com.foxprocureflow.attachments.AttachmentDtos.AttachmentDownload;
import com.foxprocureflow.attachments.AttachmentDtos.AttachmentMetadataResponse;
import com.foxprocureflow.common.api.ApiEnvelope;
import io.swagger.v3.oas.annotations.Operation;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachments")
public class FileAttachmentController {

    private final FileAttachmentService attachmentService;

    public FileAttachmentController(FileAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @Operation(summary = "Upload a company-scoped procurement attachment")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiEnvelope<AttachmentMetadataResponse> upload(
        @RequestParam String companyId,
        @RequestParam FileAttachmentTargetType targetType,
        @RequestParam String targetId,
        @RequestParam(required = false) String supplierId,
        @RequestParam(required = false) String uploadedBy,
        @RequestParam(required = false) String description,
        @RequestPart("file") MultipartFile file
    ) {
        return ApiEnvelope.ok(attachmentService.upload(
            companyId,
            targetType,
            targetId,
            supplierId,
            uploadedBy,
            description,
            file));
    }

    @Operation(summary = "List company-scoped procurement attachments")
    @GetMapping
    public ApiEnvelope<List<AttachmentMetadataResponse>> list(
        @RequestParam String companyId,
        @RequestParam FileAttachmentTargetType targetType,
        @RequestParam String targetId,
        @RequestParam(required = false) String supplierId
    ) {
        return ApiEnvelope.ok(attachmentService.list(companyId, targetType, targetId, supplierId));
    }

    @Operation(summary = "Download a company-scoped procurement attachment")
    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<InputStreamResource> download(
        @PathVariable String attachmentId,
        @RequestParam String companyId
    ) {
        AttachmentDownload download = attachmentService.download(attachmentId, companyId);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.contentType()))
            .contentLength(download.sizeBytes())
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename(download.fileName(), StandardCharsets.UTF_8)
                    .build()
                    .toString())
            .body(new InputStreamResource(download.stream()));
    }
}
