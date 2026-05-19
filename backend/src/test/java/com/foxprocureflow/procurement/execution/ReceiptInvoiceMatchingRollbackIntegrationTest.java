package com.foxprocureflow.procurement.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.matching.ThreeWayMatchingService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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
class ReceiptInvoiceMatchingRollbackIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_matching_rollback_test")
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

    @MockitoBean
    private ThreeWayMatchingService matchingService;

    @Test
    void rollsBackReceiptAndInvoiceCreationWhenMatchingRefreshFails() throws Exception {
        when(matchingService.recalculateForPo("company-digital", "PO-20260518-0301"))
            .thenThrow(new IllegalStateException("matching refresh failed"));

        int receiptCount = tableCount("purchase_receipts");
        int receiptLineCount = tableCount("purchase_receipt_lines");
        int receiptAttachmentCount = tableCount("purchase_receipt_attachments");

        assertThatThrownBy(() -> mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload()))))
            .hasRootCauseInstanceOf(IllegalStateException.class)
            .hasMessageContaining("matching refresh failed");

        assertThat(tableCount("purchase_receipts")).isEqualTo(receiptCount);
        assertThat(tableCount("purchase_receipt_lines")).isEqualTo(receiptLineCount);
        assertThat(tableCount("purchase_receipt_attachments")).isEqualTo(receiptAttachmentCount);

        int invoiceCount = tableCount("supplier_invoices");
        int invoiceLineCount = tableCount("supplier_invoice_lines");
        int invoiceAttachmentCount = tableCount("supplier_invoice_attachments");

        assertThatThrownBy(() -> mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload()))))
            .hasRootCauseInstanceOf(IllegalStateException.class)
            .hasMessageContaining("matching refresh failed");

        assertThat(tableCount("supplier_invoices")).isEqualTo(invoiceCount);
        assertThat(tableCount("supplier_invoice_lines")).isEqualTo(invoiceLineCount);
        assertThat(tableCount("supplier_invoice_attachments")).isEqualTo(invoiceAttachmentCount);
    }

    private Map<String, Object> receiptPayload() {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "receivedBy", "user-demo-operator",
            "receivedDate", "2026-06-08",
            "note", "测试 matching refresh 失败时回滚收货登记",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "receivedQuantity", 1.00
            )),
            "attachments", List.of(Map.of(
                "fileName", "rollback-receipt-test.jpg",
                "description", "回滚测试收货凭证元数据",
                "contentType", "image/jpeg",
                "sizeBytes", 0
            ))
        );
    }

    private Map<String, Object> invoicePayload() {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "invoiceNumber", "FP-MATCHING-ROLLBACK-001",
            "invoiceDate", "2026-06-09",
            "registeredBy", "user-digital-finance",
            "note", "测试 matching refresh 失败时回滚发票登记",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "invoicedQuantity", 1.00,
                "untaxedAmount", 100.00,
                "taxRate", 0.1300,
                "taxAmount", 13.00,
                "totalAmount", 113.00
            )),
            "attachments", List.of(Map.of(
                "fileName", "rollback-invoice-test.pdf",
                "description", "回滚测试发票元数据",
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
