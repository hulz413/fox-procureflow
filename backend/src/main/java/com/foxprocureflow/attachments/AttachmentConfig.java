package com.foxprocureflow.attachments;

import io.minio.MinioClient;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AttachmentProperties.class)
class AttachmentConfig {

    @Bean
    MinioClient minioClient(AttachmentProperties properties) {
        return MinioClient.builder()
            .endpoint(properties.minio().endpoint())
            .credentials(properties.minio().accessKey(), properties.minio().secretKey())
            .build();
    }

    @Bean
    ApplicationRunner attachmentBucketValidation(
        AttachmentProperties properties,
        AttachmentObjectStorage storage
    ) {
        return args -> {
            if (!properties.minio().validateBucketsOnStartup()) {
                return;
            }
            storage.ensureBucket(properties.minio().rfqBucket());
            storage.ensureBucket(properties.minio().receiptInvoiceBucket());
        };
    }
}
