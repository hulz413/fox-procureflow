package com.foxprocureflow.common.api;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
    boolean success,
    int status,
    String error,
    String message,
    OffsetDateTime timestamp
) {

    public static ApiErrorResponse of(int status, String error, String message) {
        return new ApiErrorResponse(false, status, error, message, OffsetDateTime.now());
    }
}
