package com.foxprocureflow.identity.masterdata;

import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.BudgetAccountSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.CategorySummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.DepartmentSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.RoleSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.SupplierSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.UserSummary;
import com.foxprocureflow.identity.persistence.DemoBudgetAccountJpaEntity;
import com.foxprocureflow.identity.persistence.DemoBudgetAccountRepository;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterJpaEntity;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoDepartmentJpaEntity;
import com.foxprocureflow.identity.persistence.DemoDepartmentRepository;
import com.foxprocureflow.identity.persistence.DemoGroupJpaEntity;
import com.foxprocureflow.identity.persistence.DemoGroupRepository;
import com.foxprocureflow.identity.persistence.DemoProcurementCategoryJpaEntity;
import com.foxprocureflow.identity.persistence.DemoProcurementCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoRoleJpaEntity;
import com.foxprocureflow.identity.persistence.DemoRoleRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierCategoryJpaEntity;
import com.foxprocureflow.identity.persistence.DemoSupplierCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierJpaEntity;
import com.foxprocureflow.identity.persistence.DemoSupplierRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.identity.persistence.DemoUserRoleRepository;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MasterDataService {

    private static final String DEFAULT_GROUP_ID = "group-xinghe";

    private final DemoGroupRepository groupRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoDepartmentRepository departmentRepository;
    private final DemoUserRepository userRepository;
    private final DemoRoleRepository roleRepository;
    private final DemoUserRoleRepository userRoleRepository;
    private final DemoSupplierRepository supplierRepository;
    private final DemoProcurementCategoryRepository categoryRepository;
    private final DemoSupplierCategoryRepository supplierCategoryRepository;
    private final DemoBudgetAccountRepository budgetAccountRepository;

    public MasterDataService(
        DemoGroupRepository groupRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoDepartmentRepository departmentRepository,
        DemoUserRepository userRepository,
        DemoRoleRepository roleRepository,
        DemoUserRoleRepository userRoleRepository,
        DemoSupplierRepository supplierRepository,
        DemoProcurementCategoryRepository categoryRepository,
        DemoSupplierCategoryRepository supplierCategoryRepository,
        DemoBudgetAccountRepository budgetAccountRepository
    ) {
        this.groupRepository = groupRepository;
        this.companyRepository = companyRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.supplierRepository = supplierRepository;
        this.categoryRepository = categoryRepository;
        this.supplierCategoryRepository = supplierCategoryRepository;
        this.budgetAccountRepository = budgetAccountRepository;
    }

    public DemoOrganizationContext getDemoContext() {
        DemoGroupJpaEntity group = groupRepository.findByGroupId(DEFAULT_GROUP_ID)
            .or(() -> groupRepository.findFirstByOrderByIdAsc())
            .orElseThrow(() -> new IllegalStateException("Demo group master data is missing"));
        List<DemoCompanyContext> companies = listCompanies();
        DemoCompanyContext activeCompany = companyRepository.findFirstByActiveTrueOrderByIdAsc()
            .map(this::toCompanyContext)
            .orElseGet(() -> companies.stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Demo company master data is missing")));

        return new DemoOrganizationContext(
            group.getGroupId(),
            group.getGroupName(),
            activeCompany,
            companies,
            "集团共享供应商池",
            new DemoOrganizationContext.DataBoundary(
                "供应商池、采购品类模板、集团级看板汇总",
                "部门、用户、预算科目，以及后续采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果"));
    }

    public List<DemoCompanyContext> listCompanies() {
        return companyRepository.findAllByOrderByIdAsc()
            .stream()
            .map(this::toCompanyContext)
            .toList();
    }

    public List<DepartmentSummary> listDepartments(String companyId) {
        requireCompany(companyId);
        return departmentRepository.findByCompanyIdOrderBySortOrderAsc(companyId)
            .stream()
            .map(this::toDepartmentSummary)
            .toList();
    }

    public List<UserSummary> listUsers(String companyId) {
        requireCompany(companyId);
        Map<String, DemoDepartmentJpaEntity> departmentsById = departmentRepository.findByCompanyIdOrderBySortOrderAsc(companyId)
            .stream()
            .collect(Collectors.toMap(DemoDepartmentJpaEntity::getDepartmentId, Function.identity()));
        List<DemoUserJpaEntity> users = userRepository.findByCompanyIdOrderByDisplayNameAsc(companyId);
        List<String> userIds = users.stream().map(DemoUserJpaEntity::getUserId).toList();
        Map<String, List<String>> roleIdsByUserId = userRoleRepository.findByUserIdIn(userIds)
            .stream()
            .collect(Collectors.groupingBy(
                userRole -> userRole.getUserId(),
                Collectors.mapping(userRole -> userRole.getRoleId(), Collectors.toList())));
        Map<String, DemoRoleJpaEntity> rolesById = roleRepository.findByRoleIdIn(flatten(roleIdsByUserId.values()))
            .stream()
            .collect(Collectors.toMap(DemoRoleJpaEntity::getRoleId, Function.identity()));

        return users.stream()
            .map(user -> toUserSummary(user, departmentsById, roleIdsByUserId, rolesById))
            .toList();
    }

    public List<SupplierSummary> listSuppliers(String categoryId) {
        List<DemoSupplierJpaEntity> suppliers = supplierRepository.findAllByOrderBySupplierNameAsc();
        Map<String, DemoProcurementCategoryJpaEntity> categoriesById = categoryRepository.findAllByOrderBySortOrderAsc()
            .stream()
            .collect(Collectors.toMap(DemoProcurementCategoryJpaEntity::getCategoryId, Function.identity()));
        Map<String, List<String>> categoryIdsBySupplierId = supplierCategoryRepository.findBySupplierIdIn(
                suppliers.stream().map(DemoSupplierJpaEntity::getSupplierId).toList())
            .stream()
            .collect(Collectors.groupingBy(
                DemoSupplierCategoryJpaEntity::getSupplierId,
                Collectors.mapping(DemoSupplierCategoryJpaEntity::getCategoryId, Collectors.toList())));

        return suppliers.stream()
            .filter(supplier -> categoryId == null || categoryIdsBySupplierId
                .getOrDefault(supplier.getSupplierId(), List.of())
                .contains(categoryId))
            .map(supplier -> toSupplierSummary(supplier, categoryIdsBySupplierId, categoriesById))
            .toList();
    }

    public List<CategorySummary> listCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc()
            .stream()
            .map(this::toCategorySummary)
            .toList();
    }

    public List<BudgetAccountSummary> listBudgetAccounts(String companyId) {
        requireCompany(companyId);
        Map<String, DemoProcurementCategoryJpaEntity> categoriesById = categoryRepository.findAllByOrderBySortOrderAsc()
            .stream()
            .collect(Collectors.toMap(DemoProcurementCategoryJpaEntity::getCategoryId, Function.identity()));

        return budgetAccountRepository.findByCompanyIdOrderBySortOrderAsc(companyId)
            .stream()
            .map(account -> toBudgetAccountSummary(account, categoriesById))
            .toList();
    }

    private DemoCompanyContext requireCompany(String companyId) {
        return companyRepository.findByCompanyId(companyId)
            .map(this::toCompanyContext)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown companyId: " + companyId));
    }

    private DemoCompanyContext toCompanyContext(DemoCompanyMasterJpaEntity company) {
        return new DemoCompanyContext(
            company.getCompanyId(),
            company.getCompanyName(),
            company.getBusinessScope(),
            company.isActive());
    }

    private DepartmentSummary toDepartmentSummary(DemoDepartmentJpaEntity department) {
        return new DepartmentSummary(
            department.getDepartmentId(),
            department.getCompanyId(),
            department.getDepartmentName(),
            department.getFunctionScope());
    }

    private UserSummary toUserSummary(
        DemoUserJpaEntity user,
        Map<String, DemoDepartmentJpaEntity> departmentsById,
        Map<String, List<String>> roleIdsByUserId,
        Map<String, DemoRoleJpaEntity> rolesById
    ) {
        List<RoleSummary> roles = roleIdsByUserId.getOrDefault(user.getUserId(), List.of())
            .stream()
            .map(rolesById::get)
            .filter(role -> role != null)
            .sorted(Comparator.comparing(DemoRoleJpaEntity::getRoleName))
            .map(this::toRoleSummary)
            .toList();
        DemoDepartmentJpaEntity department = departmentsById.get(user.getDepartmentId());

        return new UserSummary(
            user.getUserId(),
            user.getCompanyId(),
            user.getDepartmentId(),
            department == null ? "" : department.getDepartmentName(),
            user.getDisplayName(),
            user.getEmail(),
            user.getPositionTitle(),
            user.isActive(),
            roles);
    }

    private RoleSummary toRoleSummary(DemoRoleJpaEntity role) {
        return new RoleSummary(role.getRoleId(), role.getRoleName(), role.getRoleType());
    }

    private SupplierSummary toSupplierSummary(
        DemoSupplierJpaEntity supplier,
        Map<String, List<String>> categoryIdsBySupplierId,
        Map<String, DemoProcurementCategoryJpaEntity> categoriesById
    ) {
        List<CategorySummary> categories = categoryIdsBySupplierId.getOrDefault(supplier.getSupplierId(), List.of())
            .stream()
            .map(categoriesById::get)
            .filter(category -> category != null)
            .sorted(Comparator.comparingInt(DemoProcurementCategoryJpaEntity::getSortOrder))
            .map(this::toCategorySummary)
            .toList();

        return new SupplierSummary(
            supplier.getSupplierId(),
            supplier.getSupplierName(),
            supplier.getServiceScope(),
            supplier.getLocation(),
            supplier.getStatus(),
            supplier.getRiskLevel(),
            supplier.getSharedScope(),
            categories);
    }

    private CategorySummary toCategorySummary(DemoProcurementCategoryJpaEntity category) {
        return new CategorySummary(
            category.getCategoryId(),
            category.getCategoryName(),
            category.getBusinessScope(),
            category.isGroupLevel());
    }

    private BudgetAccountSummary toBudgetAccountSummary(
        DemoBudgetAccountJpaEntity account,
        Map<String, DemoProcurementCategoryJpaEntity> categoriesById
    ) {
        DemoProcurementCategoryJpaEntity category = categoriesById.get(account.getCategoryId());

        return new BudgetAccountSummary(
            account.getBudgetAccountId(),
            account.getCompanyId(),
            account.getAccountName(),
            account.getCategoryId(),
            category == null ? "" : category.getCategoryName(),
            account.getAnnualBudgetAmount(),
            account.getAvailableAmount(),
            account.getCurrency(),
            account.isActive());
    }

    private static Set<String> flatten(Collection<List<String>> values) {
        return values.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toSet());
    }
}
