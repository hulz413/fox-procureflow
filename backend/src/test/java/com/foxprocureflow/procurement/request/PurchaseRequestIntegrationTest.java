package com.foxprocureflow.procurement.request;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
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
class PurchaseRequestIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_purchase_request_test")
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
    private PurchaseRequestRepository purchaseRequestRepository;

    @Test
    void createsDraftAndSubmitsDigitalLaptopRequest() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalLaptopDraft())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.requestId", containsString("PR-")))
            .andExpect(jsonPath("$.data.companyId").value("company-digital"))
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andExpect(jsonPath("$.data.totalAmount").value(186000.00))
            .andExpect(jsonPath("$.data.lineItems.length()").value(1))
            .andReturn();

        String requestId = JsonPath.read(created.getResponse().getContentAsString(), "$.data.requestId");
        assertThat(purchaseRequestRepository.findByRequestId(requestId)).isPresent();

        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.requestId").value(requestId))
            .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.data.submittedAt").exists())
            .andExpect(jsonPath("$.data.totalAmount").value(186000.00));

        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only DRAFT")));
    }

    @Test
    void listsRequestsByCompanyAndStatus() throws Exception {
        String digitalRequestId = createDraft(digitalLaptopDraft());
        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", digitalRequestId))
            .andExpect(status().isOk());
        String manufacturingRequestId = createDraft(manufacturingSpareDraft());

        mockMvc.perform(get("/api/purchase-requests")
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].requestId", hasItem(digitalRequestId)))
            .andExpect(jsonPath("$.data[*].requestId", not(hasItem(manufacturingRequestId))));

        mockMvc.perform(get("/api/purchase-requests")
                .param("companyId", "company-digital")
                .param("status", "SUBMITTED"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].status", hasItem("SUBMITTED")));
    }

    @Test
    void returnsPurchaseRequestDetailWithFieldSnapshotAndLines() throws Exception {
        String requestId = createDraft(digitalLaptopDraft());

        mockMvc.perform(get("/api/purchase-requests/{requestId}", requestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.requestId").value(requestId))
            .andExpect(jsonPath("$.data.fieldSnapshot.formVersion").value("purchase-request-intake-v1"))
            .andExpect(jsonPath("$.data.lineItems[0].itemName").value("商务笔记本电脑"))
            .andExpect(jsonPath("$.data.lineItems[0].estimatedAmount").value(186000.00));
    }

    @Test
    void rejectsInvalidMasterDataReferencesWithoutFallback() throws Exception {
        mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalLaptopDraft(Map.of(
                    "budgetAccountId", "budget-mfg-spares"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("budgetAccountId does not belong to companyId")));

        mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalLaptopDraft(Map.of(
                    "categoryId", "category-software-subscription"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("budget account is not valid for categoryId")));

        mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(digitalLaptopDraft(Map.of(
                    "requesterId", "user-mfg-applicant"
                )))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("requesterId does not belong to companyId")));

        mockMvc.perform(get("/api/purchase-requests").param("companyId", "company-unknown"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId: company-unknown")));

        mockMvc.perform(post("/api/purchase-requests/PR-UNKNOWN/submit"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown requestId: PR-UNKNOWN")));
    }

    @Test
    void documentsPurchaseRequestEndpointsInOpenApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/purchase-requests/drafts']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-requests/{requestId}/submit']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-requests']").exists())
            .andExpect(jsonPath("$['paths']['/api/purchase-requests/{requestId}']").exists());
    }

    private String createDraft(Map<String, Object> payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.requestId");
    }

    private Map<String, Object> digitalLaptopDraft() {
        return digitalLaptopDraft(Map.of());
    }

    private Map<String, Object> digitalLaptopDraft(Map<String, Object> overrides) {
        java.util.LinkedHashMap<String, Object> payload = new java.util.LinkedHashMap<>();
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
        payload.put("expectedDeliveryDate", "2026-06-15");
        payload.put("lineItems", java.util.List.of(Map.of(
                "itemName", "商务笔记本电脑",
                "specification", "14 英寸 / 32G / 1T SSD",
                "quantity", 20,
                "unit", "台",
                "estimatedUnitPrice", 9300.00,
                "estimatedAmount", 186000.00
        )));
        return merge(payload, overrides);
    }

    private Map<String, Object> manufacturingSpareDraft() {
        java.util.LinkedHashMap<String, Object> payload = new java.util.LinkedHashMap<>();
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
        payload.put("expectedDeliveryDate", "2026-06-20");
        payload.put("lineItems", java.util.List.of(Map.of(
                "itemName", "高精度传感器",
                "specification", "产线备用件",
                "quantity", 8,
                "unit", "件",
                "estimatedUnitPrice", 9050.00,
                "estimatedAmount", 72400.00
        )));
        return payload;
    }

    private Map<String, Object> merge(Map<String, Object> source, Map<String, Object> overrides) {
        java.util.LinkedHashMap<String, Object> merged = new java.util.LinkedHashMap<>(source);
        merged.putAll(overrides);
        return merged;
    }
}
