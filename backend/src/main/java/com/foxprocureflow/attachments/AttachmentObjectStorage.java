package com.foxprocureflow.attachments;

import java.io.InputStream;
import java.util.Map;

public interface AttachmentObjectStorage {

    void ensureBucket(String bucketName);

    StoredObject upload(
        String bucketName,
        String objectKey,
        InputStream stream,
        long sizeBytes,
        String contentType,
        Map<String, String> metadata
    );

    InputStream download(String bucketName, String objectKey);

    void delete(String bucketName, String objectKey);

    record StoredObject(String etag) {
    }
}
