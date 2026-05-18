package com.foxprocureflow.procurement.approval;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalActionRequest;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalDetailResponse;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalTaskResponse;
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
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @Operation(summary = "List active approval tasks for an approver")
    @GetMapping("/tasks")
    public ApiEnvelope<List<ApprovalTaskResponse>> tasks(
        @RequestParam String companyId,
        @RequestParam String approverId
    ) {
        return ApiEnvelope.ok(approvalService.tasks(companyId, approverId));
    }

    @Operation(summary = "Get approval detail by purchase request ID")
    @GetMapping("/by-request/{requestId}")
    public ApiEnvelope<ApprovalDetailResponse> detailByRequest(
        @PathVariable String requestId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(approvalService.detailByRequestId(requestId, companyId));
    }

    @Operation(summary = "Get approval detail")
    @GetMapping("/{approvalId}")
    public ApiEnvelope<ApprovalDetailResponse> detail(
        @PathVariable String approvalId,
        @RequestParam(required = false) String companyId
    ) {
        return ApiEnvelope.ok(approvalService.detail(approvalId, companyId));
    }

    @Operation(summary = "Approve an active approval task")
    @PostMapping("/{approvalId}/approve")
    public ApiEnvelope<ApprovalDetailResponse> approve(
        @PathVariable String approvalId,
        @Valid @RequestBody ApprovalActionRequest request
    ) {
        return ApiEnvelope.ok(approvalService.approve(approvalId, request));
    }

    @Operation(summary = "Reject an active approval task")
    @PostMapping("/{approvalId}/reject")
    public ApiEnvelope<ApprovalDetailResponse> reject(
        @PathVariable String approvalId,
        @Valid @RequestBody ApprovalActionRequest request
    ) {
        return ApiEnvelope.ok(approvalService.reject(approvalId, request));
    }

    @Operation(summary = "Withdraw an in-progress approval")
    @PostMapping("/{approvalId}/withdraw")
    public ApiEnvelope<ApprovalDetailResponse> withdraw(
        @PathVariable String approvalId,
        @Valid @RequestBody ApprovalActionRequest request
    ) {
        return ApiEnvelope.ok(approvalService.withdraw(approvalId, request));
    }
}
