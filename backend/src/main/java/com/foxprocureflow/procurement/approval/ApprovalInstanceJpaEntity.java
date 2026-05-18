package com.foxprocureflow.procurement.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_instances")
public class ApprovalInstanceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String approvalId;

    @Column(nullable = false, length = 64, unique = true)
    private String requestId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String requesterId;

    @Column(nullable = false, length = 64)
    private String matchedRuleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ApprovalInstanceStatus status;

    private Integer currentStepOrder;

    @Column(nullable = false, columnDefinition = "JSON")
    private String contextSnapshotJson;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ApprovalInstanceJpaEntity() {
    }

    ApprovalInstanceJpaEntity(
        String approvalId,
        String requestId,
        String companyId,
        String requesterId,
        String matchedRuleId,
        Integer currentStepOrder,
        String contextSnapshotJson
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.approvalId = approvalId;
        this.requestId = requestId;
        this.companyId = companyId;
        this.requesterId = requesterId;
        this.matchedRuleId = matchedRuleId;
        this.status = ApprovalInstanceStatus.IN_PROGRESS;
        this.currentStepOrder = currentStepOrder;
        this.contextSnapshotJson = contextSnapshotJson;
        this.startedAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void setCurrentStepOrder(Integer currentStepOrder) {
        this.currentStepOrder = currentStepOrder;
        this.updatedAt = LocalDateTime.now();
    }

    void approve(LocalDateTime completedAt) {
        this.status = ApprovalInstanceStatus.APPROVED;
        this.currentStepOrder = null;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    void reject(LocalDateTime completedAt) {
        this.status = ApprovalInstanceStatus.REJECTED;
        this.currentStepOrder = null;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    void withdraw(LocalDateTime completedAt) {
        this.status = ApprovalInstanceStatus.WITHDRAWN;
        this.currentStepOrder = null;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    public String getApprovalId() {
        return approvalId;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getRequesterId() {
        return requesterId;
    }

    public String getMatchedRuleId() {
        return matchedRuleId;
    }

    public ApprovalInstanceStatus getStatus() {
        return status;
    }

    public Integer getCurrentStepOrder() {
        return currentStepOrder;
    }

    public String getContextSnapshotJson() {
        return contextSnapshotJson;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
