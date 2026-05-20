package com.foxprocureflow.dashboard;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.ProcurementDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/procurement-dashboard")
public class ProcurementDashboardController {

    private final ProcurementDashboardService dashboardService;

    public ProcurementDashboardController(ProcurementDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Get group or company scoped procurement dashboard metrics")
    @GetMapping
    public ApiEnvelope<ProcurementDashboardResponse> dashboard(
        @RequestParam ProcurementDashboardScope scope,
        @RequestParam(required = false) String companyId,
        @RequestParam String actorId
    ) {
        return ApiEnvelope.ok(dashboardService.dashboard(scope, companyId, actorId));
    }
}
