package com.foxprocureflow.identity.masterdata;

import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import java.math.BigDecimal;
import java.util.List;

public final class MasterDataDtos {

    private MasterDataDtos() {
    }

    public record DepartmentSummary(
        String departmentId,
        String companyId,
        String departmentName,
        String functionScope
    ) {
    }

    public record RoleSummary(
        String roleId,
        String roleName,
        String roleType
    ) {
    }

    public record UserSummary(
        String userId,
        String companyId,
        String departmentId,
        String departmentName,
        String displayName,
        String email,
        String positionTitle,
        boolean active,
        List<RoleSummary> roles
    ) {
    }

    public record CategorySummary(
        String categoryId,
        String categoryName,
        String businessScope,
        boolean groupLevel
    ) {
    }

    public record SupplierSummary(
        String supplierId,
        String supplierName,
        String serviceScope,
        String location,
        String status,
        String riskLevel,
        String sharedScope,
        List<CategorySummary> categories
    ) {
    }

    public record BudgetAccountSummary(
        String budgetAccountId,
        String companyId,
        String accountName,
        String categoryId,
        String categoryName,
        BigDecimal annualBudgetAmount,
        BigDecimal availableAmount,
        String currency,
        boolean active
    ) {
    }

    public record MasterDataContextResponse(
        DemoOrganizationContext context
    ) {
    }

    public record CompanyListResponse(
        List<DemoCompanyContext> companies
    ) {
    }
}
