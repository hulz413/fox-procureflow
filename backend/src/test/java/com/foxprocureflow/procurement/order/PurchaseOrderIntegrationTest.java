package com.foxprocureflow.procurement.order;

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
class PurchaseOrderIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_po_test")
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
    void createsPurchaseOrderFromComparableRfqQuoteAndKeepsSnapshotStable() throws Exception {
        ReadyRfq readyRfq = createReadyDigitalRfq();

        MvcResult created = mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(readyRfq.rfqId(), readyRfq.bluechipQuoteId()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.poId", containsString("PO-")))
            .andExpect(jsonPath("$.data.rfqId").value(readyRfq.rfqId()))
            .andExpect(jsonPath("$.data.quoteId").value(readyRfq.bluechipQuoteId()))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andExpect(jsonPath("$.data.supplierId").value("supplier-bluechip"))
            .andExpect(jsonPath("$.data.totalAmount").value(126560.00))
            .andExpect(jsonPath("$.data.lines[0].itemName").value("商务笔记本电脑"))
            .andExpect(jsonPath("$.data.deliverySchedule.deliveryLocation").value("星河数字科技研发中心"))
            .andExpect(jsonPath("$.data.statusRecords[0].action").value("CREATED"))
            .andExpect(jsonPath("$.data.upstreamSnapshot.quote.quoteId").value(readyRfq.bluechipQuoteId()))
            .andReturn();
        String poId = JsonPath.read(created.getResponse().getContentAsString(), "$.data.poId");

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", readyRfq.rfqId(), "supplier-bluechip")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(Map.of(
                    "quoteAmount", 99000.00,
                    "deliveryDate", quoteDate(9),
                    "supplierScore", 95.00
                )))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/purchase-orders/{poId}", poId).param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalAmount").value(126560.00))
            .andExpect(jsonPath("$.data.quoteAmount").value(112000.00));

        mockMvc.perform(get("/api/purchase-orders").param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].poId", hasItem(poId)))
            .andExpect(jsonPath("$.data[*].companyId", not(hasItem("company-manufacturing"))));
    }

    @Test
    void rejectsInvalidPurchaseOrderCreationSourcesAndScopes() throws Exception {
        String approvedRequestId = createApprovedDigitalRequest();
        String issuedRfqId = createRfq(approvedRequestId, digitalRfq(approvedRequestId));

        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(issuedRfqId, "unknown-quote"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("not COMPARISON_READY")));

        ReadyRfq first = createReadyDigitalRfq();
        ReadyRfq second = createReadyDigitalRfq();

        String poId = createPurchaseOrder(first.rfqId(), first.bluechipQuoteId());
        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(first.rfqId(), first.bluechipQuoteId()))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already exists")));

        mockMvc.perform(get("/api/purchase-orders/{poId}", poId)
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));

        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(second.rfqId(), first.bluechipQuoteId()))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("quoteId does not belong to rfqId")));

        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(second.rfqId(), second.bluechipQuoteId(), Map.of(
                    "companyId", "company-manufacturing",
                    "procurementUserId", "user-mfg-buyer"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("rfqId does not belong to companyId")));

        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(second.rfqId(), second.bluechipQuoteId(), Map.of(
                    "procurementUserId", "user-mfg-buyer"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("procurementUserId does not belong to companyId")));

        mockMvc.perform(get("/api/purchase-orders").param("companyId", "company-unknown"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));
    }

    @Test
    void publishesAndCancelsPurchaseOrdersWithStatusRecords() throws Exception {
        ReadyRfq publishRfq = createReadyDigitalRfq();
        String poId = createPurchaseOrder(publishRfq.rfqId(), publishRfq.bluechipQuoteId());

        mockMvc.perform(post("/api/purchase-orders/{poId}/publish", poId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("ISSUED"))
            .andExpect(jsonPath("$.data.statusRecords[1].action").value("PUBLISHED"));

        mockMvc.perform(post("/api/purchase-orders/{poId}/publish", poId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(actionPayload())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only DRAFT")));

        mockMvc.perform(post("/api/purchase-orders/{poId}/cancel", poId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelPayload("供应商交付窗口调整"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CANCELLED"))
            .andExpect(jsonPath("$.data.statusRecords[2].action").value("CANCELLED"))
            .andExpect(jsonPath("$.data.statusRecords[2].comment").value("供应商交付窗口调整"));

        mockMvc.perform(post("/api/purchase-orders/{poId}/cancel", poId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelPayload("重复取消"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already CANCELLED")));

        ReadyRfq draftCancelRfq = createReadyDigitalRfq();
        String draftPoId = createPurchaseOrder(draftCancelRfq.rfqId(), draftCancelRfq.bluechipQuoteId());
        mockMvc.perform(post("/api/purchase-orders/{poId}/cancel", draftPoId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelPayload("采购计划取消"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CANCELLED"))
            .andExpect(jsonPath("$.data.statusRecords[1].fromStatus").value("DRAFT"));
    }

    @Test
    void documentsPurchaseOrderEndpointsAndPreservesBoundary() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/purchase-orders']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-orders/{poId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-orders/{poId}/publish']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-orders/{poId}/cancel']").exists())
            .andExpect(content().string(containsString("Create a purchase order from an RFQ quote")))
            .andExpect(content().string(not(containsString("/api/receipts"))))
            .andExpect(content().string(not(containsString("/api/invoices"))))
            .andExpect(content().string(not(containsString("/api/matching"))));
    }

    private ReadyRfq createReadyDigitalRfq() throws Exception {
        String requestId = createApprovedDigitalRequest();
        String rfqId = createRfq(requestId, digitalRfq(requestId));
        String bluechipQuoteId = upsertQuote(rfqId, "supplier-bluechip", quotePayload(Map.of(
            "quoteAmount", 112000.00,
            "deliveryDate", quoteDate(12),
            "supplierScore", 88.00
        )));
        upsertQuote(rfqId, "supplier-yunzhou", quotePayload(Map.of(
            "quoteAmount", 118000.00,
            "deliveryDate", quoteDate(10),
            "supplierScore", 93.00
        )));
        upsertQuote(rfqId, "supplier-chengcai", quotePayload(Map.of(
            "quoteAmount", 115000.00,
            "deliveryDate", quoteDate(14),
            "supplierScore", 80.00
        )));
        return new ReadyRfq(rfqId, bluechipQuoteId);
    }

    private String createApprovedDigitalRequest() throws Exception {
        String requestId = createDraft(digitalLaptopDraft());
        submit(requestId);
        String approvalId = approvalIdByRequest(requestId);
        approve(approvalId, "user-digital-approver");
        approve(approvalId, "user-digital-finance");
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
                    "comment", "同意进入采购执行"
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

    private String upsertQuote(String rfqId, String supplierId, Map<String, Object> payload) throws Exception {
        MvcResult result = mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", rfqId, supplierId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.quoteId");
    }

    private String createPurchaseOrder(String rfqId, String quoteId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poPayload(rfqId, quoteId))))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.poId");
    }

    private Map<String, Object> digitalRfq(String requestId) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requestId", requestId);
        payload.put("procurementUserId", "user-digital-buyer");
        payload.put("title", "IT 设备采购 RFQ");
        payload.put("supplierIds", List.of("supplier-bluechip", "supplier-yunzhou", "supplier-chengcai"));
        return payload;
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

    private Map<String, Object> poPayload(String rfqId, String quoteId) {
        return poPayload(rfqId, quoteId, Map.of());
    }

    private Map<String, Object> poPayload(String rfqId, String quoteId, Map<String, Object> overrides) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("rfqId", rfqId);
        payload.put("quoteId", quoteId);
        payload.put("procurementUserId", "user-digital-buyer");
        payload.put("plannedDeliveryDate", quoteDate(18));
        payload.put("deliveryLocation", "星河数字科技研发中心");
        payload.put("contactPerson", "王然");
        payload.put("contactPhone", "138-0000-0000");
        payload.put("deliveryNote", "分批送达研发楼前台");
        payload.putAll(overrides);
        return payload;
    }

    private Map<String, Object> actionPayload() {
        return Map.of(
            "companyId", "company-digital",
            "actorId", "user-digital-buyer",
            "comment", "发布给供应商"
        );
    }

    private Map<String, Object> cancelPayload(String reason) {
        return Map.of(
            "companyId", "company-digital",
            "actorId", "user-digital-buyer",
            "reason", reason
        );
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

    private record ReadyRfq(String rfqId, String bluechipQuoteId) {
    }
}
