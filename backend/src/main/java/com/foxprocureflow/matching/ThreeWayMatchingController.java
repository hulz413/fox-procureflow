package com.foxprocureflow.matching;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.HandleMatchActionRequest;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchDetailResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchListItemResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.RecalculateMatchRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/three-way-matching")
public class ThreeWayMatchingController {

    private final ThreeWayMatchingService matchingService;

    public ThreeWayMatchingController(ThreeWayMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @Operation(summary = "List company-scoped three-way matching results")
    @GetMapping
    public ApiEnvelope<List<MatchListItemResponse>> list(
        @RequestParam String companyId,
        @RequestParam(required = false) ThreeWayMatchStatus status
    ) {
        return ApiEnvelope.ok(matchingService.list(companyId, status));
    }

    @Operation(summary = "List company-scoped three-way matching exceptions")
    @GetMapping("/exceptions")
    public ApiEnvelope<List<MatchListItemResponse>> exceptions(@RequestParam String companyId) {
        return ApiEnvelope.ok(matchingService.exceptions(companyId));
    }

    @Operation(summary = "Get three-way matching detail")
    @GetMapping("/{matchId}")
    public ApiEnvelope<MatchDetailResponse> detail(
        @PathVariable String matchId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(matchingService.detail(matchId, companyId));
    }

    @Operation(summary = "Recalculate three-way matching for an issued purchase order")
    @PostMapping("/recalculate")
    public ApiEnvelope<MatchDetailResponse> recalculate(@Valid @RequestBody RecalculateMatchRequest request) {
        return ApiEnvelope.ok(matchingService.recalculate(request));
    }

    @Operation(summary = "Append a handling action to a three-way matching exception")
    @PostMapping("/{matchId}/actions")
    public ApiEnvelope<MatchDetailResponse> handleAction(
        @PathVariable String matchId,
        @Valid @RequestBody HandleMatchActionRequest request
    ) {
        return ApiEnvelope.ok(matchingService.handleAction(matchId, request));
    }
}
