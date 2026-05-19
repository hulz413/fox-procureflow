package com.foxprocureflow.attachments;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.MinioException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
class MinioAttachmentObjectStorage implements AttachmentObjectStorage {

    private final MinioClient minioClient;
    private final Set<String> checkedBuckets = ConcurrentHashMap.newKeySet();

    MinioAttachmentObjectStorage(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @Override
    public void ensureBucket(String bucketName) {
        if (checkedBuckets.contains(bucketName)) {
            return;
        }
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
            checkedBuckets.add(bucketName);
        } catch (Exception ex) {
            throw new AttachmentStorageException("Unable to validate MinIO bucket: " + bucketName, ex);
        }
    }

    @Override
    public StoredObject upload(
        String bucketName,
        String objectKey,
        InputStream stream,
        long sizeBytes,
        String contentType,
        Map<String, String> metadata
    ) {
        ensureBucket(bucketName);
        try {
            minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .stream(stream, sizeBytes, -1L)
                .contentType(contentType)
                .userMetadata(metadata)
                .build());
            StatObjectResponse stat = minioClient.statObject(StatObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
            return new StoredObject(stat.etag());
        } catch (MinioException ex) {
            throw new AttachmentStorageException("Unable to upload file to MinIO", ex);
        } catch (Exception ex) {
            throw new AttachmentStorageException("Unable to upload file to object storage", ex);
        }
    }

    @Override
    public InputStream download(String bucketName, String objectKey) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
        } catch (Exception ex) {
            throw new AttachmentStorageException("Unable to download file from object storage", ex);
        }
    }

    @Override
    public void delete(String bucketName, String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
        } catch (Exception ex) {
            throw new AttachmentStorageException("Unable to delete file from object storage", ex);
        }
    }
}
