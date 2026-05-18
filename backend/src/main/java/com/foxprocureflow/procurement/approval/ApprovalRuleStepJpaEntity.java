package com.foxprocureflow.procurement.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "approval_rule_steps")
public class ApprovalRuleStepJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String ruleId;

    @Column(nullable = false)
    private int stepOrder;

    @Column(nullable = false, length = 128)
    private String nodeName;

    @Column(nullable = false, length = 64)
    private String approverId;

    protected ApprovalRuleStepJpaEntity() {
    }

    public String getRuleId() {
        return ruleId;
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
}
