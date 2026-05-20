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
                .param("scope", "GROUP")
                .param("actorId", "user-digital-admin"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scope").value("GROUP"))
            .andExpect(jsonPath("$.data.groupId").value("group-xinghe"))
            .andExpect(jsonPath("$.data.companyIds", hasItem("company-digital")))
            .andExpect(jsonPath("$.data.companyIds", hasItem("company-manufacturing")))
            .andExpect(jsonPath("$.data.summary[?(@.key=='issuedPoAmount')].value", hasItem(544434.00)))
            .andExpect(jsonPath("$.data.summary[?(@.key=='matchingExceptions')].value", hasItem(4)))
            .andExpect(jsonPath("$.data.spendTrend.length()").value(11))
            .andExpect(jsonPath("$.data.spendTrend[0].period").value("2026-05-10"))
            .andExpect(jsonPath("$.data.spendTrend[1].amount").value(0.00))
            .andExpect(jsonPath("$.data.spendTrend[9].period").value("2026-05-19"))
            .andExpect(jsonPath("$.data.spendTrend[10].period").value("2026-05-20"))
            .andExpect(jsonPath("$.data.spendTrend[10].amount").value(167127.00))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", hasItem("company-digital")))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", hasItem("company-manufacturing")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-digital")
                .param("actorId", "user-digital-admin"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scope").value("COMPANY"))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.companyName").value("星河数字科技有限公司"))
            .andExpect(jsonPath("$.data.companyIds.length()").value(1))
            .andExpect(jsonPath("$.data.summary[?(@.key=='issuedPoAmount')].value", hasItem(350978.00)))
            .andExpect(jsonPath("$.data.summary[?(@.key=='matchingExceptions')].value", hasItem(2)))
            .andExpect(jsonPath("$.data.exceptionHighlights[*].companyId", not(hasItem("company-manufacturing"))));
    }

    @Test
    void rejectsMissingOrUnknownCompanyScopeWithoutFallback() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("actorId", "user-digital-admin"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("companyId is required")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-unknown")
                .param("actorId", "user-digital-admin"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));
    }

    @Test
    void allowsOnlyDashboardViewerRoles() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "GROUP")
                .param("actorId", "user-digital-buyer"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", containsString("Only administrators")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-digital")
                .param("actorId", "user-digital-buyer"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-digital")
                .param("actorId", "user-digital-finance"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "COMPANY")
                .param("companyId", "company-manufacturing")
                .param("actorId", "user-digital-finance"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", containsString("own company")));

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "GROUP")
                .param("actorId", "user-digital-applicant"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", containsString("not allowed")));
    }

    @Test
    void returnsLifecycleTrendFunnelStatusSupplierAndExceptionDatasets() throws Exception {
        mockMvc.perform(get("/api/procurement-dashboard")
            .param("scope", "COMPANY")
            .param("companyId", "company-manufacturing")
            .param("actorId", "user-digital-admin"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.spendTrend.length()").value(4))
            .andExpect(jsonPath("$.data.spendTrend[0].period").value("2026-05-17"))
            .andExpect(jsonPath("$.data.spendTrend[0].amount").value(28024.00))
            .andExpect(jsonPath("$.data.spendTrend[1].period").value("2026-05-18"))
            .andExpect(jsonPath("$.data.spendTrend[1].amount").value(0.00))
            .andExpect(jsonPath("$.data.spendTrend[2].period").value("2026-05-19"))
            .andExpect(jsonPath("$.data.spendTrend[2].amount").value(81812.00))
            .andExpect(jsonPath("$.data.spendTrend[3].period").value("2026-05-20"))
            .andExpect(jsonPath("$.data.spendTrend[3].amount").value(83620.00))
            .andExpect(jsonPath("$.data.documentFunnel[?(@.key=='issuedPurchaseOrders')].count", hasItem(6)))
            .andExpect(jsonPath("$.data.documentFunnel[?(@.key=='matchedPurchaseOrders')].count", hasItem(1)))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='approval')].status", hasItem("APPROVED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='rfq')].status", hasItem("COMPARISON_READY")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='purchaseOrder')].status", hasItem("ISSUED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='receipt')].status", hasItem("RECORDED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='invoice')].status", hasItem("RECORDED")))
            .andExpect(jsonPath("$.data.statusDistributions[?(@.documentType=='threeWayMatching')].status", hasItem("EXCEPTION")))
            .andExpect(jsonPath("$.data.supplierDistribution[*].supplierId", hasItem("supplier-hengrun")))
            .andExpect(jsonPath("$.data.supplierDistribution[*].supplierId", hasItem("supplier-anjie")))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].severity").value("HIGH"))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].differenceCount").value(1))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].primaryDifferenceType").value("MISSING_RECEIPT"))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].primaryDifferenceDescription").value("已开票但未登记对应收货"))
            .andExpect(jsonPath("$.data.exceptionHighlights[0].invoiceVarianceAmount").value(0.00));
    }

    @Test
    void dashboardQueryDoesNotMutateSourceTables() throws Exception {
        Map<String, Integer> before = tableCounts();

        mockMvc.perform(get("/api/procurement-dashboard")
                .param("scope", "GROUP")
                .param("actorId", "user-digital-admin"))
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
