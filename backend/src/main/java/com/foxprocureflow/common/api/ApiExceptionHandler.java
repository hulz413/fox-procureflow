package com.foxprocureflow.common.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiErrorResponse> handleResponseStatusException(ResponseStatusException exception) {
        HttpStatusCode statusCode = exception.getStatusCode();
        String error = statusCode instanceof HttpStatus status ? status.getReasonPhrase() : statusCode.toString();
        String message = exception.getReason() == null ? error : exception.getReason();

        return ResponseEntity
            .status(statusCode)
            .body(ApiErrorResponse.of(statusCode.value(), error, message));
    }
}
