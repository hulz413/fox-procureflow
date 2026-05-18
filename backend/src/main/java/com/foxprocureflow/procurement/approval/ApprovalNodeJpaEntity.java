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
@Table(name = "approval_nodes")
public class ApprovalNodeJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String nodeId;

    @Column(nullable = false, length = 64)
    private String approvalId;

    @Column(nullable = false, length = 64)
    private String requestId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false)
    private int stepOrder;

    @Column(nullable = false, length = 128)
    private String nodeName;

    @Column(nullable = false, length = 64)
    private String approverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ApprovalNodeStatus status;

    private LocalDateTime activatedAt;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ApprovalNodeJpaEntity() {
    }

    ApprovalNodeJpaEntity(
        String nodeId,
        String approvalId,
        String requestId,
        String companyId,
        int stepOrder,
        String nodeName,
        String approverId,
        boolean active
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.nodeId = nodeId;
        this.approvalId = approvalId;
        this.requestId = requestId;
        this.companyId = companyId;
        this.stepOrder = stepOrder;
        this.nodeName = nodeName;
        this.approverId = approverId;
        this.status = active ? ApprovalNodeStatus.ACTIVE : ApprovalNodeStatus.PENDING;
        this.activatedAt = active ? now : null;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void activate(LocalDateTime activatedAt) {
        this.status = ApprovalNodeStatus.ACTIVE;
        this.activatedAt = activatedAt;
        this.updatedAt = activatedAt;
    }

    void approve(LocalDateTime completedAt) {
        this.status = ApprovalNodeStatus.APPROVED;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    void reject(LocalDateTime completedAt) {
        this.status = ApprovalNodeStatus.REJECTED;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    void cancel(LocalDateTime completedAt) {
        this.status = ApprovalNodeStatus.CANCELLED;
        this.completedAt = completedAt;
        this.updatedAt = completedAt;
    }

    public String getNodeId() {
        return nodeId;
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

    public int getStepOrder() {
        return stepOrder;
    }

    public String getNodeName() {
        return nodeName;
    }

    public String getApproverId() {
        return approverId;
    }

    public ApprovalNodeStatus getStatus() {
        return status;
    }

    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
