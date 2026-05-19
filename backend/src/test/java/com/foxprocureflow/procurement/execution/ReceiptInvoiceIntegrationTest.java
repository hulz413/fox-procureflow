package com.foxprocureflow.procurement.execution;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
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
class ReceiptInvoiceIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_receipt_invoice_test")
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

    @Test
    void exposesSeededFulfillmentSummariesReceiptsAndInvoices() throws Exception {
        mockMvc.perform(get("/api/receipts-invoices/purchase-orders")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0301")))
            .andExpect(jsonPath("$.data[*].poId", hasItem("PO-20260518-0302")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0301')].receiptSummary", hasItem("NOT_RECEIVED")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0302')].receiptSummary", hasItem("FULLY_RECEIVED")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0302')].invoiceAmountStatus", hasItem("VARIANCE")))
            .andExpect(jsonPath("$.data[?(@.poId=='PO-20260518-0302')].invoiceAmountVariance", hasItem(2300.00)));

        mockMvc.perform(get("/api/receipts")
                .param("companyId", "company-digital")
            .param("poId", "PO-20260518-0302"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].receiptId", hasItem("RCPT-20260519-0301")))
            .andExpect(jsonPath("$.data[0].attachments[0].fileName").value("诚采办公耗材补送到货签收照片.jpg"));

        mockMvc.perform(get("/api/invoices")
                .param("companyId", "company-digital")
            .param("poId", "PO-20260518-0302"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].invoiceId", hasItem("INV-20260519-0301")))
            .andExpect(jsonPath("$.data[0].attachments[0].fileName").value("诚采办公耗材发票.pdf"));
    }

    @Test
    void createsReceiptAndRejectsInvalidReceiptScopesAndQuantities() throws Exception {
        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload(Map.of(
                    "poId", "PO-20260518-0301",
                    "lines", List.of(Map.of(
                        "poLineId", "PO-20260518-0301-L01",
                        "receivedQuantity", 1.00,
                        "note", "测试收货"
                    ))
                )))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.receiptId", containsString("RCPT-")))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.sourcePo.poId").value("PO-20260518-0301"))
            .andExpect(jsonPath("$.data.lines[0].poLineId").value("PO-20260518-0301-L01"))
            .andExpect(jsonPath("$.data.attachments[0].storageObjectKey").value(nullValue()));

        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload(Map.of(
                    "poId", "PO-20260518-0301",
                    "lines", List.of(Map.of(
                        "poLineId", "PO-20260518-0301-L01",
                        "receivedQuantity", 999.00
                    ))
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("received quantity exceeds ordered quantity")));

        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload(Map.of(
                    "companyId", "company-manufacturing",
                    "poId", "PO-20260518-0301",
                    "receivedBy", "user-mfg-warehouse"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("poId does not belong to companyId")));

        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload(Map.of("poId", "PO-20260518-0304")))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only ISSUED")));
    }

    @Test
    void createsInvoiceAndRejectsInvalidInvoiceScopesQuantitiesAndDuplicates() throws Exception {
        String invoiceNumber = "FP-TEST-PO-0301";
        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload(invoiceNumber, Map.of(
                    "poId", "PO-20260518-0301",
                    "lines", List.of(Map.of(
                        "poLineId", "PO-20260518-0301-L01",
                        "invoicedQuantity", 1.00,
                        "untaxedAmount", 100.00,
                        "taxRate", 0.1300,
                        "taxAmount", 13.00,
                        "totalAmount", 113.00
                    ))
                )))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.invoiceId", containsString("INV-")))
            .andExpect(jsonPath("$.data.invoiceNumber").value(invoiceNumber))
            .andExpect(jsonPath("$.data.lines[0].poLineId").value("PO-20260518-0301-L01"))
            .andExpect(jsonPath("$.data.attachments[0].storageObjectKey").value(nullValue()));

        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload(invoiceNumber, Map.of("poId", "PO-20260518-0301")))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Invoice number already exists")));

        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload("FP-TEST-PO-0301-OVER", Map.of(
                    "poId", "PO-20260518-0301",
                    "lines", List.of(Map.of(
                        "poLineId", "PO-20260518-0301-L01",
                        "invoicedQuantity", 999.00,
                        "untaxedAmount", 100.00,
                        "taxRate", 0.1300,
                        "taxAmount", 13.00,
                        "totalAmount", 113.00
                    ))
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("invoiced quantity exceeds ordered quantity")));

        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload("FP-TEST-CROSS", Map.of(
                    "companyId", "company-manufacturing",
                    "poId", "PO-20260518-0301",
                    "registeredBy", "user-mfg-finance"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("poId does not belong to companyId")));

        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload("FP-TEST-CANCELLED", Map.of("poId", "PO-20260518-0304")))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only ISSUED")));
    }

    @Test
    void documentsReceiptAndInvoiceEndpointsAndCompanyIsolation() throws Exception {
        mockMvc.perform(get("/api/receipts").param("companyId", "company-manufacturing"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].companyId", not(hasItem("company-digital"))));

        mockMvc.perform(get("/api/receipts").param("companyId", "company-unknown"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));

        mockMvc.perform(get("/api/receipts/RCPT-20260519-0301")
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("receiptId does not belong to companyId")));

        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/receipts']").exists())
            .andExpect(jsonPath("$['paths']['/api/receipts/{receiptId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/invoices']").exists())
            .andExpect(jsonPath("$['paths']['/api/invoices/{invoiceId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/receipts-invoices/purchase-orders']").exists())
            .andExpect(content().string(containsString("Create a purchase receipt from an issued purchase order")))
            .andExpect(content().string(containsString("Create a supplier invoice from an issued purchase order")));
    }

    private Map<String, Object> receiptPayload(Map<String, Object> overrides) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("poId", "PO-20260518-0301");
        payload.put("receivedBy", "user-demo-operator");
        payload.put("receivedDate", "2026-06-08");
        payload.put("note", "测试收货登记");
        payload.put("lines", List.of(Map.of(
            "poLineId", "PO-20260518-0301-L01",
            "receivedQuantity", 1.00
        )));
        payload.put("attachments", List.of(Map.of(
            "fileName", "receipt-test.jpg",
            "description", "收货凭证元数据",
            "contentType", "image/jpeg",
            "sizeBytes", 0
        )));
        payload.putAll(overrides);
        return payload;
    }

    private Map<String, Object> invoicePayload(String invoiceNumber, Map<String, Object> overrides) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("poId", "PO-20260518-0301");
        payload.put("invoiceNumber", invoiceNumber);
        payload.put("invoiceDate", "2026-06-09");
        payload.put("registeredBy", "user-digital-finance");
        payload.put("note", "测试发票登记");
        payload.put("lines", List.of(Map.of(
            "poLineId", "PO-20260518-0301-L01",
            "invoicedQuantity", 1.00,
            "untaxedAmount", 100.00,
            "taxRate", 0.1300,
            "taxAmount", 13.00,
            "totalAmount", 113.00
        )));
        payload.put("attachments", List.of(Map.of(
            "fileName", "invoice-test.pdf",
            "description", "发票元数据",
            "contentType", "application/pdf",
            "sizeBytes", 0
        )));
        payload.putAll(overrides);
        return payload;
    }
}
