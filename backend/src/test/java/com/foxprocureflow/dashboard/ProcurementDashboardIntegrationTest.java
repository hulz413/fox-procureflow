package com.foxprocureflow.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
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
@Transactional
class ProcurementDashboardIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_dashboard_test")
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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void exposesGroupAndCompanyDashboardScopesWithIsolatedMetrics() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "GROUP"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scope").value("GROUP"))
            .andExpect(jsonPath("$.data.groupId").value("group-xinghe"))
            .andExpect(jsonPath("$.data.companyIds", hasItem("company-digital")))
            .andExpect(jsonPath("$.data.companyIds", hasItem("company-manufacturing")))
            .andExpect(jsonPath("$.data.summary[?(@.key=='issuedPoAmount')].value", hasItem(377307.00)))
            .andExpect(jsonPath("$.data.summary[?(@.key=='matchingExceptions')].value", hasItem(4)))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", hasItem("company-digital")))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", hasItem("company-manufacturing")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scope").value("COMPANY"))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.companyName").value("星河数字科技有限公司"))
            .andExpect(jsonPath("$.data.companyIds.length()").value(1))
            .andExpect(jsonPath("$.data.summary[?(@.key=='issuedPoAmount')].value", hasItem(267471.00)))
            .andExpect(jsonPath("$.data.summary[?(@.key=='matchingExceptions')].value", hasItem(2)))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", not(hasItem("company-manufacturing"))));
    }

    @Test
    void rejectsMissingOrUnknownCompanyScopeWithoutFallback() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("companyId is required")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-unknown"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));
    }

    @Test
    void returnsLifecycleTrendFunnelStatusSupplierAndExceptionDatasets() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.spendTrend[0].period").value("2026-05"))
            .andExpect(jsonPath("$.data.spendTrend[0].amount").value(109836.00))
            .andExpect(jsonPath("$.data.documentFunnel[?(@.key=='issuedPurchaseOrders')].count", hasItem(2)))
            .andExpect(jsonPath("$.data.documentFunnel[?(@.key=='matchedPurchaseOrders')].count", hasItem(0)))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='approval')].status", hasItem("APPROVED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='rfq')].status", hasItem("COMPARISON_READY")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='purchaseOrder')].status", hasItem("ISSUED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='receipt')].status", hasItem("RECORDED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='invoice')].status", hasItem("RECORDED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='threeWayMatching')].status", hasItem("EXCEPTION")))
            .andExpect(jsonPath("$.data.supplierDistribution[*].supplierId", hasItem("supplier-hengrun")))
            .andExpect(jsonPath("$.data.supplierDistribution[*].supplierId", hasItem("supplier-anjie")))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].severity").value("HIGH"));
    }

    @Test
    void dashboardQueryDoesNotMutateSourceTables() throws Exception {
        Map<String, Integer> before = tableCounts();

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "GROUP"))
            .andExpect(status().isOk());

        assertThat(tableCounts()).isEqualTo(before);
    }

    @Test
    void documentsDashboardEndpointAndDoesNotRequireDeferredInfrastructure() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/procurement-dashboard']").exists())
            .andExpect(content().string(containsString("Get group or company scoped procurement dashboard metrics")));

        assertThat(applicationContext.getBeanNamesForType(RabbitTemplate.class)).isEmpty();
        assertThat(applicationContext.getBeanNamesForType(MongoTemplate.class)).isEmpty();
    }

    private Map<String, Integer> tableCounts() {
        List<String> tables = List.of(
            "purchase_requests",
            "approval_instances",
            "rfqs",
            "purchase_orders",
            "purchase_receipts",
            "supplier_invoices",
            "three_way_match_results",
            "three_way_match_actions");

        return tables.stream()
            .collect(java.util.stream.Collectors.toMap(
                table -> table,
                table -> jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class),
                (first, second) -> first,
                java.util.LinkedHashMap::new));
    }
}
