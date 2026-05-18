package com.foxprocureflow.procurement.approval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ApprovalDtos {

    private ApprovalDtos() {
    }

    public record ApprovalActionRequest(
        @NotBlank String actorId,
        @Size(max = 1000) String comment
    ) {
    }

    public record ApprovalSummaryResponse(
        String approvalId,
        ApprovalInstanceStatus status,
        String currentNodeId,
        Integer currentStepOrder,
        String currentNodeName,
        String currentApproverId,
        String matchedRuleId,
        List<ApprovalRecordResponse> timeline
    ) {
    }

    public record ApprovalTaskResponse(
        String approvalId,
        String nodeId,
        String requestId,
        String companyId,
        String requesterId,
        String title,
        BigDecimal totalAmount,
        String currency,
        String nodeName,
        String approverId,
        LocalDateTime activatedAt
    ) {
    }

    public record ApprovalDetailResponse(
        String approvalId,
        String requestId,
        String companyId,
        String requesterId,
        String matchedRuleId,
        ApprovalInstanceStatus status,
        Integer currentStepOrder,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        Map<String, Object> contextSnapshot,
        List<ApprovalNodeResponse> nodes,
        List<ApprovalRecordResponse> timeline
    ) {
    }

    public record ApprovalNodeResponse(
        String nodeId,
        int stepOrder,
        String nodeName,
        String approverId,
        ApprovalNodeStatus status,
        LocalDateTime activatedAt,
        LocalDateTime completedAt
    ) {
    }

    public record ApprovalRecordResponse(
        String recordId,
        String nodeId,
        String actorId,
        ApprovalAction action,
        String comment,
        LocalDateTime createdAt
    ) {
    }
}
