package com.foxprocureflow.common.demo;

import com.foxprocureflow.common.api.ApiEnvelope;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo-data")
public class DemoDataResetController {

    private final DemoDataResetService resetService;

    public DemoDataResetController(DemoDataResetService resetService) {
        this.resetService = resetService;
    }

    @PostMapping("/reset")
    public ApiEnvelope<DemoDataResetResponse> reset() {
        return ApiEnvelope.ok(resetService.reset());
    }
}
