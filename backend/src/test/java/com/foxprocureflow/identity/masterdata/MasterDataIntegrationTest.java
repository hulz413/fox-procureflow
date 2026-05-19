package com.foxprocureflow.identity.masterdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.foxprocureflow.identity.persistence.DemoBudgetAccountRepository;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoGroupRepository;
import com.foxprocureflow.identity.persistence.DemoProcurementCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration"
})
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MasterDataIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_test")
        .withUsername("fox")
        .withPassword("fox");

    @DynamicPropertySource
    static void mysqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DemoGroupRepository groupRepository;

    @Autowired
    private DemoCompanyMasterRepository companyRepository;

    @Autowired
    private DemoSupplierRepository supplierRepository;

    @Autowired
    private DemoProcurementCategoryRepository categoryRepository;

    @Autowired
    private DemoBudgetAccountRepository budgetAccountRepository;

    @Test
    void loadsSeededMasterDataWithStableBusinessIds() {
        assertThat(groupRepository.findByGroupId("group-xinghe")).isPresent();
        assertThat(companyRepository.findByCompanyId("company-digital")).isPresent();
        assertThat(companyRepository.findByCompanyId("company-manufacturing")).isPresent();
        assertThat(supplierRepository.findAllByOrderBySupplierNameAsc())
            .extracting("supplierId")
            .containsExactlyInAnyOrder(
                "supplier-yunzhou",
                "supplier-bluechip",
                "supplier-hengrun",
                "supplier-chengcai",
                "supplier-anjie");
        assertThat(categoryRepository.findAllByOrderBySortOrderAsc())
            .extracting("categoryId")
            .contains(
                "category-it-hardware",
                "category-software-subscription",
                "category-office-supplies",
                "category-production-consumables",
                "category-equipment-spares",
                "category-logistics-service");
        assertThat(budgetAccountRepository.findByCompanyIdOrderBySortOrderAsc("company-digital"))
            .extracting("budgetAccountId")
            .contains("budget-digital-it-equipment");
    }

    @Test
    void exposesReadOnlyMasterDataApis() throws Exception {
        mockMvc.perform(get("/api/master-data/context"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.groupId").value("group-xinghe"))
            .andExpect(jsonPath("$.data.activeCompany.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.supplierPoolScope").value("集团共享供应商池"));

        mockMvc.perform(get("/api/master-data/companies"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].companyId", hasItem("company-digital")))
            .andExpect(jsonPath("$.data[*].companyId", hasItem("company-manufacturing")));

        mockMvc.perform(get("/api/master-data/companies/company-digital/departments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].departmentId", hasItem("dept-digital-it")));

        mockMvc.perform(get("/api/master-data/companies/company-digital/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].userId", hasItem("user-digital-applicant")))
            .andExpect(jsonPath("$.data[0].roles").isArray());

        mockMvc.perform(get("/api/master-data/suppliers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].supplierId", hasItem("supplier-yunzhou")));

        mockMvc.perform(get("/api/master-data/suppliers").param("categoryId", "category-it-hardware"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(3))
            .andExpect(jsonPath("$.data[*].supplierId", hasItem("supplier-bluechip")))
            .andExpect(jsonPath("$.data[*].supplierId", hasItem("supplier-chengcai")));

        mockMvc.perform(get("/api/master-data/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].categoryId", hasItem("category-equipment-spares")));

        mockMvc.perform(get("/api/master-data/companies/company-digital/budget-accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].budgetAccountId", hasItem("budget-digital-it-equipment")));
    }

    @Test
    void keepsCompanyScopedBudgetAccountsIsolated() throws Exception {
        mockMvc.perform(get("/api/master-data/companies/company-digital/budget-accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].companyId", everyItem(startsWith("company-digital"))))
            .andExpect(jsonPath("$.data[*].budgetAccountId", not(hasItem("budget-mfg-spares"))));
    }

    @Test
    void rejectsUnknownCompanyWithoutFallingBackToDefaultCompany() throws Exception {
        mockMvc.perform(get("/api/master-data/companies/company-unknown/budget-accounts"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message", containsString("Unknown companyId: company-unknown")));
    }

    @Test
    void documentsMasterDataEndpointsInOpenApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/master-data/context']").exists())
            .andExpect(jsonPath("$['paths']['/api/master-data/companies/{companyId}/budget-accounts']").exists());
    }
}
