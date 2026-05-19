package com.foxprocureflow.matching;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
class ThreeWayMatchingIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_matching_test")
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
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void exposesSeededMatchingListsDetailsAndCompanyScopedExceptions() throws Exception {
        mockMvc.perform(get("/api/three-way-matching")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0301")))
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0302")))
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0303")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0301')].status", hasItem("PENDING_INPUT")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0302')].status", hasItem("EXCEPTION")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0303')].status", hasItem("EXCEPTION")))
            .andExpect(jsonPath("$.data[*].companyId", not(hasItem("company-manufacturing"))));

        mockMvc.perform(get("/api/three-way-matching/exceptions")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0302")))
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0303")))
            .andExpect(jsonPath("$.data[*].poId", not(hasItem("PO-20260518-0201"))));

        mockMvc.perform(get("/api/three-way-matching/TWM-20260519-0002")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.invoiceVarianceAmount").value(2300.00))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("INVOICE_AMOUNT_MISMATCH")))
            .andExpect(jsonPath("$.data.actions.length()").value(0));
    }

    @Test
    void recalculatesMatchedPendingAmountMissingReceiptAndQuantityOverReceiptScenariosIdempotently() throws Exception {
        recalculate("company-digital", "PO-20260518-0303", "user-digital-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("INVOICE_AMOUNT_MISMATCH")));

        recalculate("company-digital", "PO-20260518-0301", "user-digital-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING_INPUT"));

        recalculate("company-digital", "PO-20260518-0302", "user-digital-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("INVOICE_AMOUNT_MISMATCH")));

        recalculate("company-digital", "PO-20260518-0302", "user-digital-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.differences.length()").value(1));

        recalculate("company-manufacturing", "PO-20260518-0201", "user-mfg-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("MISSING_RECEIPT")));

        recalculate("company-manufacturing", "PO-20260518-0202", "user-mfg-finance")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("INVOICE_QUANTITY_OVER_RECEIPT")));
    }

    @Test
    void rejectsInvalidMatchingScopesAndDocumentsApi() throws Exception {
        recalculate("company-digital", "PO-20260518-0201", "user-digital-finance")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("poId does not belong to companyId")));

        recalculate("company-digital", "PO-20260518-0304", "user-digital-finance")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only ISSUED")));

        recalculate("company-unknown", "PO-20260518-0302", "user-digital-finance")
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));

        mockMvc.perform(get("/api/three-way-matching/TWM-20260519-0004")
                .param("companyId", "company-digital"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("matchId does not belong to companyId")));

        mockMvc.perform(post("/api/three-way-matching/TWM-20260519-0004/actions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload("company-digital", "user-digital-finance", "ACKNOWLEDGE", "跨公司处理"))))
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/three-way-matching']").exists())
            .andExpect(jsonPath("$['paths']['/api/three-way-matching/exceptions']").exists())
            .andExpect(jsonPath("$['paths']['/api/three-way-matching/{matchId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/three-way-matching/recalculate']").exists())
            .andExpect(jsonPath("$['paths']['/api/three-way-matching/{matchId}/actions']").exists())
            .andExpect(content().string(containsString("Recalculate three-way matching")));
    }

    @Test
    void handlesExceptionsWithAuditableActionsWithoutMutatingSourceDocuments() throws Exception {
        int receiptCount = tableCount("purchase_receipts");
        int invoiceCount = tableCount("supplier_invoices");

        mockMvc.perform(post("/api/three-way-matching/TWM-20260519-0002/actions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload("company-digital", "user-digital-finance", "ACKNOWLEDGE", "已通知采购员核对供应商发票"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.actions[*].actionType", hasItem("ACKNOWLEDGE")));

        mockMvc.perform(post("/api/three-way-matching/TWM-20260519-0002/actions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload("company-digital", "user-digital-finance", "MARK_IN_PROGRESS", "财务处理中"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.actions[*].actionType", hasItem("MARK_IN_PROGRESS")));

        mockMvc.perform(post("/api/three-way-matching/TWM-20260519-0002/actions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload("company-digital", "user-digital-finance", "RESOLVE", "供应商已确认差额走补充说明，暂关闭异常"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("RESOLVED"))
            .andExpect(jsonPath("$.data.actions[*].actionType", hasItem("RESOLVE")));

        mockMvc.perform(post("/api/three-way-matching/TWM-20260519-0002/actions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload("company-digital", "user-digital-finance", "REOPEN", "复核后重新打开"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.actions[*].actionType", hasItem("REOPEN")));

        assertThat(tableCount("purchase_receipts")).isEqualTo(receiptCount);
        assertThat(tableCount("supplier_invoices")).isEqualTo(invoiceCount);
    }

    @Test
    void receiptAndInvoiceCreationSynchronouslyRefreshMatchingResult() throws Exception {
        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.sourcePo.poId").value("PO-20260518-0301"));

        mockMvc.perform(get("/api/three-way-matching/TWM-20260519-0001")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING_INPUT"))
            .andExpect(jsonPath("$.data.receivedTotalQuantity").value(1.00));

        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.sourcePo.poId").value("PO-20260518-0301"));

        mockMvc.perform(get("/api/three-way-matching/TWM-20260519-0001")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("EXCEPTION"))
            .andExpect(jsonPath("$.data.invoiceTotalAmount").value(113.00))
            .andExpect(jsonPath("$.data.differences[*].differenceType", hasItem("INVOICE_AMOUNT_MISMATCH")));
    }

    private org.springframework.test.web.servlet.ResultActions recalculate(String companyId, String poId, String actorId) throws Exception {
        return mockMvc.perform(post("/api/three-way-matching/recalculate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "companyId", companyId,
                "poId", poId,
                "actorId", actorId
            ))));
    }

    private Map<String, Object> actionPayload(String companyId, String actorId, String actionType, String note) {
        return Map.of(
            "companyId", companyId,
            "actorId", actorId,
            "actionType", actionType,
            "note", note
        );
    }

    private Map<String, Object> receiptPayload() {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "receivedBy", "user-demo-operator",
            "receivedDate", "2026-06-08",
            "note", "测试收货登记触发三单匹配刷新",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "receivedQuantity", 1.00
            )),
            "attachments", List.of(Map.of(
                "fileName", "matching-receipt-test.jpg",
                "description", "收货凭证元数据",
                "contentType", "image/jpeg",
                "sizeBytes", 0
            ))
        );
    }

    private Map<String, Object> invoicePayload() {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "invoiceNumber", "FP-MATCHING-REFRESH-001",
            "invoiceDate", "2026-06-09",
            "registeredBy", "user-digital-finance",
            "note", "测试发票登记触发三单匹配刷新",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "invoicedQuantity", 1.00,
                "untaxedAmount", 100.00,
                "taxRate", 0.1300,
                "taxAmount", 13.00,
                "totalAmount", 113.00
            )),
            "attachments", List.of(Map.of(
                "fileName", "matching-invoice-test.pdf",
                "description", "发票元数据",
                "contentType", "application/pdf",
                "sizeBytes", 0
            ))
        );
    }

    private int tableCount(String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        return count == null ? 0 : count;
    }
}
