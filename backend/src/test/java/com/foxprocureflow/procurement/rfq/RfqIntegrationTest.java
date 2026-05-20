package com.foxprocureflow.procurement.rfq;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.util.LinkedHashMap;
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
import org.springframework.test.web.servlet.MvcResult;
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
class RfqIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_rfq_test")
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
    void createsRfqFromApprovedRequestAndRejectsInvalidSources() throws Exception {
        String approvedRequestId = createApprovedDigitalRequest();

        MvcResult created = mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(approvedRequestId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.rfqId", containsString("RFQ-")))
            .andExpect(jsonPath("$.data.requestId").value(approvedRequestId))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.status").value("ISSUED"))
            .andExpect(jsonPath("$.data.suppliers.length()").value(3))
            .andExpect(jsonPath("$.data.requestSnapshot.lineItems[0].itemName").value("商务笔记本电脑"))
            .andReturn();
        String rfqId = JsonPath.read(created.getResponse().getContentAsString(), "$.data.rfqId");

        mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(approvedRequestId))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("RFQ already exists")));

        String unapprovedRequestId = createSubmittedDigitalRequest();
        mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(unapprovedRequestId))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("not APPROVED")));

        String approvedManufacturingRequestId = createApprovedManufacturingRequest();
        mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(approvedManufacturingRequestId))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("requestId does not belong to companyId")));

        mockMvc.perform(get("/api/rfqs/{rfqId}", rfqId)
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));
    }

    @Test
    void validatesSupplierSelectionAndCompanyScopedList() throws Exception {
        String digitalRequestId = createApprovedDigitalRequest();

        mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(digitalRequestId, Map.of(
                    "supplierIds", List.of("supplier-bluechip", "supplier-bluechip")
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("supplier selection must be unique")));

        mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalRfq(digitalRequestId, Map.of(
                    "supplierIds", List.of("supplier-bluechip", "supplier-anjie")
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not support categoryId")));

        String digitalRfqId = createRfq(digitalRequestId, digitalRfq(digitalRequestId));
        String manufacturingRequestId = createApprovedManufacturingRequest();
        createRfq(manufacturingRequestId, manufacturingRfq(manufacturingRequestId));

        mockMvc.perform(get("/api/rfqs").param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].rfqId", hasItem(digitalRfqId)))
            .andExpect(jsonPath("$.data[*].companyId", not(hasItem("company-manufacturing"))));

        mockMvc.perform(get("/api/rfqs").param("companyId", "company-unknown"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));
    }

    @Test
    void listsSeededRfqsWithPartialQuoteProgress() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rfqs").param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].rfqId", hasItem("RFQ-20260519-0601")))
            .andExpect(jsonPath("$.data[*].rfqId", hasItem("RFQ-20260519-0602")))
            .andReturn();

        List<Map<String, Object>> rows = JsonPath.read(result.getResponse().getContentAsString(), "$.data");
        Map<String, Object> oneOfThree = rowByRfqId(rows, "RFQ-20260519-0601");
        Map<String, Object> twoOfThree = rowByRfqId(rows, "RFQ-20260519-0602");

        assertThat(oneOfThree.get("supplierCount")).isEqualTo(3);
        assertThat(oneOfThree.get("quoteCount")).isEqualTo(1);
        assertThat(oneOfThree.get("status")).isEqualTo("QUOTING");
        assertThat(twoOfThree.get("supplierCount")).isEqualTo(3);
        assertThat(twoOfThree.get("quoteCount")).isEqualTo(2);
        assertThat(twoOfThree.get("status")).isEqualTo("COMPARISON_READY");

        mockMvc.perform(get("/api/rfqs/{rfqId}", "RFQ-20260519-0602").param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.suppliers.length()").value(3))
            .andExpect(jsonPath("$.data.quotes.length()").value(2));
    }

    @Test
    void recordsQuotesUpdatesStatusAndReturnsComparisonRanking() throws Exception {
        String requestId = createApprovedDigitalRequest();
        String rfqId = createRfq(requestId, digitalRfq(requestId));

        MvcResult firstQuote = mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-bluechip")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "quoteAmount", 120000.00,
                    "deliveryDate", quoteDate(18),
                    "supplierScore", 86.00
                )))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.attachments[0].fileName").value("bluechip-quote.pdf"))
            .andReturn();
        String quoteId = JsonPath.read(firstQuote.getResponse().getContentAsString(), "$.data.quoteId");

        mockMvc.perform(get("/api/rfqs/{rfqId}", rfqId).param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("QUOTING"))
            .andExpect(jsonPath("$.data.quotes.length()").value(1));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-bluechip")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "quoteAmount", 112000.00,
                    "deliveryDate", quoteDate(12),
                    "supplierScore", 88.00
                )))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.quoteId").value(quoteId))
            .andExpect(jsonPath("$.data.quoteAmount").value(112000.00));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-anjie")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("was not invited")));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-yunzhou")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "quoteAmount", 118000.00,
                    "deliveryDate", quoteDate(10),
                    "supplierScore", 93.00
                )))))
            .andExpect(status().isOk());

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-chengcai")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "quoteAmount", 115000.00,
                    "deliveryDate", quoteDate(14),
                    "supplierScore", 80.00
                )))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/rfqs/{rfqId}", rfqId).param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPARISON_READY"))
            .andExpect(jsonPath("$.data.quotes.length()").value(3));

        mockMvc.perform(get("/api/rfqs/{rfqId}/comparison", rfqId).param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(3))
            .andExpect(jsonPath("$.data[0].rank").value(1))
            .andExpect(jsonPath("$.data[0].supplierId").value("supplier-bluechip"))
            .andExpect(jsonPath("$.data[0].attachments[0].fileName").value("bluechip-quote.pdf"));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-yunzhou")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "companyId", "company-manufacturing"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, "supplier-yunzhou")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "deliveryDate", "2020-01-01"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("deliveryDate must not be in the past")));
    }

    @Test
    void documentsRfqEndpointsAndDoesNotExposeDownstreamRecords() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/rfqs']").exists())
            .andExpect(jsonPath("$['paths']['/api/rfqs/{rfqId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/rfqs/{rfqId}/quotes/{supplierId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/rfqs/{rfqId}/comparison']").exists())
            .andExpect(content().string(containsString("Compare RFQ supplier quotes")));
    }

    private String createApprovedDigitalRequest() throws Exception {
        String requestId = createSubmittedDigitalRequest();
        String approvalId = approvalIdByRequest(requestId);
        approve(approvalId, "user-digital-approver");
        approve(approvalId, "user-digital-finance");
        return requestId;
    }

    private String createSubmittedDigitalRequest() throws Exception {
        String requestId = createDraft(digitalLaptopDraft());
        submit(requestId);
        return requestId;
    }

    private String createApprovedManufacturingRequest() throws Exception {
        String requestId = createDraft(manufacturingSpareDraft());
        submit(requestId);
        approve(approvalIdByRequest(requestId), "user-mfg-approver");
        return requestId;
    }

    private String createDraft(Map<String, Object> payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.requestId");
    }

    private void submit(String requestId) throws Exception {
        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isOk());
    }

    private String approvalIdByRequest(String requestId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/approvals/by-request/{requestId}", requestId))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.approvalId");
    }

    private void approve(String approvalId, String actorId) throws Exception {
        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "actorId", actorId,
                    "comment", "同意进入询报价"
                ))))
            .andExpect(status().isOk());
    }

    private String createRfq(String requestId, Map<String, Object> payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/rfqs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.rfqId");
    }

    private Map<String, Object> digitalRfq(String requestId) {
        return digitalRfq(requestId, Map.of());
    }

    private Map<String, Object> digitalRfq(String requestId, Map<String, Object> overrides) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requestId", requestId);
        payload.put("procurementUserId", "user-digital-buyer");
        payload.put("title", "信息技术设备采购询价");
        payload.put("supplierIds", List.of("supplier-bluechip", "supplier-yunzhou", "supplier-chengcai"));
        payload.putAll(overrides);
        return payload;
    }

    private Map<String, Object> manufacturingRfq(String requestId) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-manufacturing");
        payload.put("requestId", requestId);
        payload.put("procurementUserId", "user-mfg-buyer");
        payload.put("title", "设备备件采购询价");
        payload.put("supplierIds", List.of("supplier-hengrun"));
        return payload;
    }

    private Map<String, Object> quotePayload() {
        return quotePayload(Map.of());
    }

    private Map<String, Object> quotePayload(Map<String, Object> overrides) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("procurementUserId", "user-digital-buyer");
        payload.put("quoteAmount", 120000.00);
        payload.put("taxRate", 0.13);
        payload.put("deliveryDate", quoteDate(12));
        payload.put("supplierScore", 86.00);
        payload.put("riskNote", "交付能力稳定");
        payload.put("attachments", List.of(Map.of(
            "fileName", "bluechip-quote.pdf",
            "description", "报价单 PDF 元数据占位",
            "contentType", "application/pdf",
            "sizeBytes", 128000
        )));
        payload.putAll(overrides);
        return payload;
    }

    private String quoteDate(int daysFromToday) {
        return LocalDate.now().plusDays(daysFromToday).toString();
    }

    private Map<String, Object> digitalLaptopDraft() {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requesterId", "user-digital-applicant");
        payload.put("departmentId", "dept-digital-it");
        payload.put("categoryId", "category-it-hardware");
        payload.put("budgetAccountId", "budget-digital-it-equipment");
        payload.put("supplierId", "supplier-bluechip");
        payload.put("title", "20 台笔记本采购");
        payload.put("description", "研发团队扩编使用");
        payload.put("totalAmount", 186000.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", LocalDate.now().plusDays(30).toString());
        payload.put("lineItems", List.of(Map.of(
            "itemName", "商务笔记本电脑",
            "specification", "14 英寸 / 32G / 1T SSD",
            "quantity", 20,
            "unit", "台",
            "estimatedUnitPrice", 9300.00,
            "estimatedAmount", 186000.00
        )));
        return payload;
    }

    private Map<String, Object> manufacturingSpareDraft() {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-manufacturing");
        payload.put("requesterId", "user-mfg-applicant");
        payload.put("departmentId", "dept-mfg-production");
        payload.put("categoryId", "category-equipment-spares");
        payload.put("budgetAccountId", "budget-mfg-spares");
        payload.put("supplierId", "supplier-hengrun");
        payload.put("title", "灌装线传感器备件采购");
        payload.put("description", "生产线维修备件");
        payload.put("totalAmount", 72400.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", LocalDate.now().plusDays(35).toString());
        payload.put("lineItems", List.of(Map.of(
            "itemName", "高精度传感器",
            "specification", "产线备用件",
            "quantity", 8,
            "unit", "件",
            "estimatedUnitPrice", 9050.00,
            "estimatedAmount", 72400.00
        )));
        return payload;
    }

    private Map<String, Object> rowByRfqId(List<Map<String, Object>> rows, String rfqId) {
        return rows.stream()
            .filter(row -> rfqId.equals(row.get("rfqId")))
            .findFirst()
            .orElseThrow();
    }
}
