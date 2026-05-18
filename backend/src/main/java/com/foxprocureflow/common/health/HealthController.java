package com.foxprocureflow.common.health;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.identity.DemoOrganizationService;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DemoOrganizationService demoOrganizationService;

    public HealthController(DemoOrganizationService demoOrganizationService) {
        this.demoOrganizationService = demoOrganizationService;
    }

    @GetMapping
    public ApiEnvelope<HealthResponse> health() {
        return ApiEnvelope.ok(new HealthResponse(
            "UP",
            "Fox Procureflow",
            OffsetDateTime.now(),
            demoOrganizationService.getDemoContext()));
    }
}
