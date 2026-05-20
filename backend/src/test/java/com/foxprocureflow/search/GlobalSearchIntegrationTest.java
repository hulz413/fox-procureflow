package com.foxprocureflow.search;

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
class GlobalSearchIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_global_search_test")
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
    void searchesCurrentCompanyProcurementObjectsWithoutCrossCompanyLeakage() throws Exception {
        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-digital")
                .param("query", "PO-20260518"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.groups[*].type", hasItem("PURCHASE_ORDER")))
            .andExpect(jsonPath("$.data.groups[*].type", hasItem("THREE_WAY_MATCH")))
            .andExpect(jsonPath("$.data.groups[*].results[*].id", hasItem("PO-20260518-0303")))
            .andExpect(jsonPath("$.data.groups[*].results[*].companyId", not(hasItem("company-manufacturing"))))
            .andExpect(content().string(not(containsString("星河智能制造有限公司"))));
    }

    @Test
    void returnsGroupSharedSuppliersAlongsideCurrentCompanyContext() throws Exception {
        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-digital")
                .param("query", "上海云舟"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.groups[*].type", hasItem("SUPPLIER")))
            .andExpect(content().string(containsString("supplier-yunzhou")))
            .andExpect(content().string(containsString("GROUP_SHARED")))
            .andExpect(content().string(containsString("/suppliers")));
    }

    @Test
    void searchesSeededDemoTermsAcrossCoreObjectTypes() throws Exception {
        List<SearchExpectation> expectations = List.of(
            new SearchExpectation("PR", "PURCHASE_REQUEST"),
            new SearchExpectation("RFQ-20260518-0301", "RFQ"),
            new SearchExpectation("PO-20260518-0302", "PURCHASE_ORDER"),
            new SearchExpectation("上海云舟", "SUPPLIER"),
            new SearchExpectation("FP-CHENGCAI-202606-001", "INVOICE"),
            new SearchExpectation("INVOICE_AMOUNT_MISMATCH", "THREE_WAY_MATCH")
        );

        for (SearchExpectation expectation : expectations) {
            mockMvc.perform(get("/api/global-search")
                    .param("companyId", "company-digital")
                    .param("query", expectation.query()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[*].type", hasItem(expectation.resultType())));
        }
    }

    @Test
    void keepsTransactionSearchCompanyScopedWhileSupplierPoolStaysShared() throws Exception {
        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-manufacturing")
                .param("query", "PO-20260518-0201"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.groups[*].results[*].companyId", hasItem("company-manufacturing")))
            .andExpect(jsonPath("$.data.groups[*].results[*].companyId", not(hasItem("company-digital"))));

        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-manufacturing")
                .param("query", "上海云舟"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("supplier-yunzhou")))
            .andExpect(content().string(containsString("GROUP_SHARED")));
    }

    @Test
    void rejectsUnknownCompanyAndReturnsEmptyResultsForShortQuery() throws Exception {
        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-unknown")
                .param("query", "PO"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));

        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-digital")
                .param("query", "P"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.query").value("P"))
            .andExpect(jsonPath("$.data.groups.length()").value(0));
    }

    @Test
    void globalSearchDoesNotMutateProcurementRecords() throws Exception {
        Map<String, Integer> before = tableCounts();

        mockMvc.perform(get("/api/global-search")
                .param("companyId", "company-digital")
                .param("query", "PO-20260518"))
            .andExpect(status().isOk());

        assertThat(tableCounts()).isEqualTo(before);
    }

    @Test
    void documentsGlobalSearchEndpointAndDoesNotRequireDeferredInfrastructure() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/global-search']").exists())
            .andExpect(content().string(containsString("Search procurement business objects")));

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

    private record SearchExpectation(String query, String resultType) {
    }
}
