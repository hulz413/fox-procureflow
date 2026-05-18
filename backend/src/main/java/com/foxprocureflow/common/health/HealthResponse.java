package com.foxprocureflow.common.health;

import com.foxprocureflow.identity.DemoOrganizationContext;
import java.time.OffsetDateTime;

public record HealthResponse(
    String status,
    String application,
    OffsetDateTime checkedAt,
    DemoOrganizationContext demoContext
) {
}
