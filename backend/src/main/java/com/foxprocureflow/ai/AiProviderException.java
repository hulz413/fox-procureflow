package com.foxprocureflow.ai;

import org.springframework.http.HttpStatus;

public class AiProviderException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    AiProviderException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    HttpStatus status() {
        return status;
    }

    String errorCode() {
        return errorCode;
    }
}
