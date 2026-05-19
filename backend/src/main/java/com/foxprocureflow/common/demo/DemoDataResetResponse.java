package com.foxprocureflow.common.demo;

import java.time.OffsetDateTime;

public record DemoDataResetResponse(
    OffsetDateTime startedAt,
    OffsetDateTime completedAt,
    int migrationsExecuted,
    String schemaVersion
) {
}
