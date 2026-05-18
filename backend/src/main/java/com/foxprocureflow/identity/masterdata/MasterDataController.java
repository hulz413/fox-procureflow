package com.foxprocureflow.identity.masterdata;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.BudgetAccountSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.CategorySummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.DepartmentSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.SupplierSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.UserSummary;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/master-data")
public class MasterDataController {

    private final MasterDataService masterDataService;

    public MasterDataController(MasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    @GetMapping("/context")
    public ApiEnvelope<DemoOrganizationContext> context() {
        return ApiEnvelope.ok(masterDataService.getDemoContext());
    }

    @GetMapping("/companies")
    public ApiEnvelope<List<DemoCompanyContext>> companies() {
        return ApiEnvelope.ok(masterDataService.listCompanies());
    }

    @GetMapping("/companies/{companyId}/departments")
    public ApiEnvelope<List<DepartmentSummary>> departments(@PathVariable String companyId) {
        return ApiEnvelope.ok(masterDataService.listDepartments(companyId));
    }

    @GetMapping("/companies/{companyId}/users")
    public ApiEnvelope<List<UserSummary>> users(@PathVariable String companyId) {
        return ApiEnvelope.ok(masterDataService.listUsers(companyId));
    }

    @GetMapping("/companies/{companyId}/budget-accounts")
    public ApiEnvelope<List<BudgetAccountSummary>> budgetAccounts(@PathVariable String companyId) {
        return ApiEnvelope.ok(masterDataService.listBudgetAccounts(companyId));
    }

    @GetMapping("/suppliers")
    public ApiEnvelope<List<SupplierSummary>> suppliers(@RequestParam(required = false) String categoryId) {
        return ApiEnvelope.ok(masterDataService.listSuppliers(categoryId));
    }

    @GetMapping("/categories")
    public ApiEnvelope<List<CategorySummary>> categories() {
        return ApiEnvelope.ok(masterDataService.listCategories());
    }
}
