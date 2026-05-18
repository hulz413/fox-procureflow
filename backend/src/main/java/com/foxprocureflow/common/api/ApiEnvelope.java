package com.foxprocureflow.common.api;

import java.time.OffsetDateTime;

public record ApiEnvelope<T>(
    boolean success,
    T data,
    OffsetDateTime timestamp
) {

    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(true, data, OffsetDateTime.now());
    }
}
