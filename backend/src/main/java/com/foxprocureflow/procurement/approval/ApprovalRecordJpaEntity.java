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
@Table(name = "approval_records")
public class ApprovalRecordJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String recordId;

    @Column(nullable = false, length = 64)
    private String approvalId;

    @Column(length = 80)
    private String nodeId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ApprovalAction action;

    @Column(name = "comment_text", length = 1000)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected ApprovalRecordJpaEntity() {
    }

    ApprovalRecordJpaEntity(
        String recordId,
        String approvalId,
        String nodeId,
        String companyId,
        String actorId,
        ApprovalAction action,
        String comment
    ) {
        this.recordId = recordId;
        this.approvalId = approvalId;
        this.nodeId = nodeId;
        this.companyId = companyId;
        this.actorId = actorId;
        this.action = action;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
    }

    public String getRecordId() {
        return recordId;
    }

    public String getApprovalId() {
        return approvalId;
    }

    public String getNodeId() {
        return nodeId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getActorId() {
        return actorId;
    }

    public ApprovalAction getAction() {
        return action;
    }

    public String getComment() {
        return comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
