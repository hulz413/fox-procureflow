package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "demo_budget_accounts")
public class DemoBudgetAccountJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64, unique = true)
    private String budgetAccountId;

    @Column(nullable = false, length = 128)
    private String accountName;

    @Column(nullable = false, length = 64)
    private String categoryId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal annualBudgetAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal availableAmount;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private int sortOrder;

    protected DemoBudgetAccountJpaEntity() {
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getBudgetAccountId() {
        return budgetAccountId;
    }

    public String getAccountName() {
        return accountName;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public BigDecimal getAnnualBudgetAmount() {
        return annualBudgetAmount;
    }

    public BigDecimal getAvailableAmount() {
        return availableAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public boolean isActive() {
        return active;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
