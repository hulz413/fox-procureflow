package com.foxprocureflow.attachments;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fox.procureflow.attachments")
public record AttachmentProperties(
    Minio minio,
    long maxSizeBytes,
    List<String> allowedContentTypes
) {

    public record Minio(
        String endpoint,
        String accessKey,
        String secretKey,
        String rfqBucket,
        String receiptInvoiceBucket,
        boolean validateBucketsOnStartup
    ) {
    }
}
