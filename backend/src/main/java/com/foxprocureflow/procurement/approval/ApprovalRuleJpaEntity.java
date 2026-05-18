package com.foxprocureflow.procurement.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_rules")
public class ApprovalRuleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String ruleId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(length = 64)
    private String categoryId;

    @Column(nullable = false, length = 160)
    private String ruleName;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal minAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal maxAmount;

    @Column(nullable = false)
    private int priority;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ApprovalRuleJpaEntity() {
    }

    public String getRuleId() {
        return ruleId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getRuleName() {
        return ruleName;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public int getPriority() {
        return priority;
    }

    public boolean isActive() {
        return active;
    }
}
