package com.foxprocureflow.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.matching.ThreeWayMatchActionRepository;
import com.foxprocureflow.matching.ThreeWayMatchResultRepository;
import com.foxprocureflow.matching.ThreeWayMatchStatus;
import com.foxprocureflow.procurement.request.PurchaseRequestRepository;
import com.foxprocureflow.procurement.rfq.RfqRepository;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
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
class AiAssistantIntegrationTest {

    private static final StubAiProvider STUB_PROVIDER = new StubAiProvider();
    private static final StubAuditStore STUB_AUDIT = new StubAuditStore();

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_ai_test")
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

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private ThreeWayMatchResultRepository matchResultRepository;

    @Autowired
    private ThreeWayMatchActionRepository matchActionRepository;

    @BeforeEach
    void resetStubs() {
        STUB_PROVIDER.reset();
        STUB_AUDIT.reset();
    }

    @Test
    void previewsPurchaseRequestDraftWithoutPersistingBusinessRecord() throws Exception {
        long beforeCount = purchaseRequestRepository.count();

        mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "研发团队下月需要 20 台笔记本"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.invocationId").exists())
            .andExpect(jsonPath("$.data.scenario").value("PURCHASE_REQUEST_DRAFT"))
            .andExpect(jsonPath("$.data.result.title").value("研发笔记本采购"))
            .andExpect(jsonPath("$.data.result.lineItems[0].itemName").value("商务笔记本电脑"));

        assertThat(purchaseRequestRepository.count()).isEqualTo(beforeCount);
        assertThat(STUB_PROVIDER.callCount).isEqualTo(1);
        assertThat(STUB_AUDIT.completed).hasSize(1);
    }

    @Test
    void savesReviewedAiDraftThroughExistingDraftCreationFlow() throws Exception {
        MvcResult preview = mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "研发团队下月需要 20 台笔记本"))))
            .andExpect(status().isOk())
            .andReturn();
        Map<String, Object> aiDraft = com.jayway.jsonpath.JsonPath.read(
            preview.getResponse().getContentAsString(),
            "$.data.result");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requesterId", aiDraft.get("requesterId"));
        payload.put("departmentId", aiDraft.get("departmentId"));
        payload.put("categoryId", aiDraft.get("categoryId"));
        payload.put("budgetAccountId", aiDraft.get("budgetAccountId"));
        payload.put("supplierId", aiDraft.get("supplierId"));
        payload.put("title", aiDraft.get("title"));
        payload.put("description", aiDraft.get("businessPurpose"));
        payload.put("totalAmount", aiDraft.get("totalAmount"));
        payload.put("currency", aiDraft.get("currency"));
        payload.put("expectedDeliveryDate", aiDraft.get("expectedDeliveryDate"));
        payload.put("lineItems", aiDraft.get("lineItems"));

        mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andExpect(jsonPath("$.data.title").value("研发笔记本采购"));
    }

    @Test
    void rejectsAiDraftWithUnknownMasterDataReference() throws Exception {
        long beforeCount = purchaseRequestRepository.count();
        STUB_PROVIDER.unknownDraftReference = true;

        mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "采购一批无法匹配主数据的物资"))))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message", containsString("unknown departmentId")));

        assertThat(purchaseRequestRepository.count()).isEqualTo(beforeCount);
        assertThat(STUB_PROVIDER.callCount).isEqualTo(1);
        assertThat(STUB_AUDIT.failed).hasSize(1);
    }

    @Test
    void unavailableProviderReturnsServiceUnavailableWithoutMockContent() throws Exception {
        STUB_PROVIDER.configured = false;

        mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "采购显示器"))))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message", containsString("Stub provider unavailable")));

        assertThat(STUB_PROVIDER.callCount).isZero();
        assertThat(STUB_AUDIT.failed).hasSize(1);
    }

    @Test
    void unavailableAuditStoragePreventsProviderCall() throws Exception {
        STUB_AUDIT.available = false;

        mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "采购显示器"))))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message", containsString("AI audit storage is unavailable")));

        assertThat(STUB_PROVIDER.callCount).isZero();
    }

    @Test
    void invalidDraftOutputReturnsBadGatewayAndDoesNotPersist() throws Exception {
        long beforeCount = purchaseRequestRepository.count();
        STUB_PROVIDER.invalidOutput = true;

        mockMvc.perform(post("/api/ai-assistant/purchase-request-draft-preview")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "intent", "采购显示器"))))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message", containsString("AI output is not valid JSON")));

        assertThat(purchaseRequestRepository.count()).isEqualTo(beforeCount);
        assertThat(STUB_AUDIT.failed).hasSize(1);
    }

    @Test
    void riskReviewFailureDoesNotBlockPurchaseRequestSubmit() throws Exception {
        String requestId = createDraft();
        STUB_PROVIDER.invalidOutput = true;

        mockMvc.perform(post("/api/ai-assistant/purchase-request-risk-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-applicant",
                    "requestId", requestId))))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message", containsString("AI output is not valid JSON")));

        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.data.approval.status").value("IN_PROGRESS"));
    }

    @Test
    void explainsRfqQuotesWithoutMutatingRfq() throws Exception {
        var before = rfqRepository.findByRfqId("RFQ-20260518-0304").orElseThrow();

        mockMvc.perform(post("/api/ai-assistant/rfq-quote-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-buyer",
                    "rfqId", "RFQ-20260518-0304"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scenario").value("RFQ_QUOTE_EXPLANATION"))
            .andExpect(jsonPath("$.data.result.supplierInsights[0].supplierId").value("supplier-bluechip"));

        var after = rfqRepository.findByRfqId("RFQ-20260518-0304").orElseThrow();
        assertThat(after.getStatus()).isEqualTo(before.getStatus());
        assertThat(after.getUpdatedAt()).isEqualTo(before.getUpdatedAt());
    }

    @Test
    void explainsPartialRfqWhenInsightMentionsInvitedSupplierWithoutQuote() throws Exception {
        mockMvc.perform(post("/api/ai-assistant/rfq-quote-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-buyer",
                    "rfqId", "RFQ-20260519-0602"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.result.supplierInsights[0].supplierId").value("supplier-bluechip"));
    }

    @Test
    void rejectsRfqExplanationWhenComparableQuotesAreInsufficient() throws Exception {
        mockMvc.perform(post("/api/ai-assistant/rfq-quote-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-buyer",
                    "rfqId", "RFQ-20260518-0303"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("at least two valid quotes")));

        assertThat(STUB_PROVIDER.callCount).isZero();
    }

    @Test
    void rfqProviderErrorDoesNotMutateRfq() throws Exception {
        var before = rfqRepository.findByRfqId("RFQ-20260518-0304").orElseThrow();
        STUB_PROVIDER.invalidOutput = true;

        mockMvc.perform(post("/api/ai-assistant/rfq-quote-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-buyer",
                    "rfqId", "RFQ-20260518-0304"))))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message", containsString("AI output is not valid JSON")));

        var after = rfqRepository.findByRfqId("RFQ-20260518-0304").orElseThrow();
        assertThat(after.getStatus()).isEqualTo(before.getStatus());
        assertThat(after.getUpdatedAt()).isEqualTo(before.getUpdatedAt());
        assertThat(STUB_AUDIT.failed).hasSize(1);
    }

    @Test
    void rejectsCrossCompanyRfqBeforeProviderCall() throws Exception {
        mockMvc.perform(post("/api/ai-assistant/rfq-quote-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-buyer",
                    "rfqId", "RFQ-20260518-0201"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("rfqId does not belong to companyId")));

        assertThat(STUB_PROVIDER.callCount).isZero();
    }

    @Test
    void rejectsNonExceptionMatchingResultBeforeProviderCall() throws Exception {
        mockMvc.perform(post("/api/ai-assistant/three-way-matching-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-finance",
                    "matchId", "TWM-20260519-0001"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("Only EXCEPTION matching results")));

        assertThat(STUB_PROVIDER.callCount).isZero();
    }

    @Test
    void rejectsCrossCompanyMatchingBeforeProviderCall() throws Exception {
        mockMvc.perform(post("/api/ai-assistant/three-way-matching-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-finance",
                    "matchId", "TWM-20260519-0004"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("matchId does not belong to companyId")));

        assertThat(STUB_PROVIDER.callCount).isZero();
    }

    @Test
    void matchingProviderErrorDoesNotMutateMatchingResult() throws Exception {
        var before = matchResultRepository.findByMatchId("TWM-20260519-0002").orElseThrow();
        long beforeActionCount = matchActionRepository.findByMatchIdOrderByCreatedAtAsc("TWM-20260519-0002").size();
        STUB_PROVIDER.invalidOutput = true;

        mockMvc.perform(post("/api/ai-assistant/three-way-matching-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-finance",
                    "matchId", "TWM-20260519-0002"))))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message", containsString("AI output is not valid JSON")));

        var after = matchResultRepository.findByMatchId("TWM-20260519-0002").orElseThrow();
        assertThat(after.getStatus()).isEqualTo(before.getStatus());
        assertThat(after.getUpdatedAt()).isEqualTo(before.getUpdatedAt());
        assertThat(matchActionRepository.findByMatchIdOrderByCreatedAtAsc("TWM-20260519-0002")).hasSize((int) beforeActionCount);
        assertThat(STUB_AUDIT.failed).hasSize(1);
    }

    @Test
    void explainsMatchingExceptionWithoutHandlingMutation() throws Exception {
        var before = matchResultRepository.findByMatchId("TWM-20260519-0002").orElseThrow();
        long beforeActionCount = matchActionRepository.findByMatchIdOrderByCreatedAtAsc("TWM-20260519-0002").size();

        mockMvc.perform(post("/api/ai-assistant/three-way-matching-explanation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "companyId", "company-digital",
                    "actorId", "user-digital-finance",
                    "matchId", "TWM-20260519-0002"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.scenario").value("THREE_WAY_MATCHING_EXPLANATION"))
            .andExpect(jsonPath("$.data.result.differenceInsights[0].differenceId").value("TWM-20260519-0002-D01"));

        var after = matchResultRepository.findByMatchId("TWM-20260519-0002").orElseThrow();
        assertThat(after.getStatus()).isEqualTo(ThreeWayMatchStatus.EXCEPTION);
        assertThat(after.getUpdatedAt()).isEqualTo(before.getUpdatedAt());
        assertThat(matchActionRepository.findByMatchIdOrderByCreatedAtAsc("TWM-20260519-0002")).hasSize((int) beforeActionCount);
    }

    @Test
    void documentsAiAssistantEndpointsInOpenApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/ai-assistant/purchase-request-draft-preview']").exists())
            .andExpect(jsonPath("$['paths']['/api/ai-assistant/purchase-request-risk-review']").exists())
            .andExpect(jsonPath("$['paths']['/api/ai-assistant/rfq-quote-explanation']").exists())
            .andExpect(jsonPath("$['paths']['/api/ai-assistant/three-way-matching-explanation']").exists());
    }

    private String createDraft() throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requesterId", "user-digital-applicant");
        payload.put("departmentId", "dept-digital-it");
        payload.put("categoryId", "category-it-hardware");
        payload.put("budgetAccountId", "budget-digital-it-equipment");
        payload.put("supplierId", "supplier-bluechip");
        payload.put("title", "AI 风险提示验证采购");
        payload.put("description", "用于验证 AI 失败不阻塞正式流程");
        payload.put("totalAmount", 9300.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", "2026-06-30");
        payload.put("lineItems", List.of(Map.of(
            "itemName", "商务笔记本电脑",
            "specification", "14 英寸 / 32G",
            "quantity", 1,
            "unit", "台",
            "estimatedUnitPrice", 9300.00,
            "estimatedAmount", 9300.00)));
        MvcResult result = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.requestId");
    }

    @TestConfiguration
    static class AiAssistantTestConfig {

        @Bean
        @Primary
        AiProvider aiProvider() {
            return STUB_PROVIDER;
        }

        @Bean
        @Primary
        AiInvocationAuditStore aiInvocationAuditStore() {
            return STUB_AUDIT;
        }
    }

    private static final class StubAiProvider implements AiProvider {
        boolean configured = true;
        boolean invalidOutput;
        boolean unknownDraftReference;
        int callCount;

        @Override
        public boolean isConfigured() {
            return configured;
        }

        @Override
        public String model() {
            return "stub-deepseek";
        }

        @Override
        public String unavailableReason() {
            return "Stub provider unavailable";
        }

        @Override
        public AiProviderResult generate(AiProviderRequest request) {
            callCount++;
            if (invalidOutput) {
                return new AiProviderResult(model(), "{not-json");
            }
            return new AiProviderResult(model(), switch (request.scenario()) {
                case PURCHASE_REQUEST_DRAFT -> unknownDraftReference
                    ? """
                        {"title":"未知主数据采购","businessPurpose":"验证 AI 主数据引用","requesterId":"user-digital-applicant","departmentId":"dept-unknown","categoryId":"category-it-hardware","budgetAccountId":"budget-digital-it-equipment","supplierId":"supplier-bluechip","expectedDeliveryDate":"2026-06-30","currency":"CNY","totalAmount":9300.00,"lineItems":[{"itemName":"商务笔记本电脑","specification":"14 英寸 / 32G","quantity":1,"unit":"台","estimatedUnitPrice":9300.00,"estimatedAmount":9300.00}],"missingFields":[],"confidenceNotes":["故意引用不存在的部门"]}
                        """
                    : """
                        {"title":"研发笔记本采购","businessPurpose":"研发扩编使用","requesterId":"user-digital-applicant","departmentId":"dept-digital-it","categoryId":"category-it-hardware","budgetAccountId":"budget-digital-it-equipment","supplierId":"supplier-bluechip","expectedDeliveryDate":"2026-06-30","currency":"CNY","totalAmount":186000.00,"lineItems":[{"itemName":"商务笔记本电脑","specification":"14 英寸 / 32G","quantity":20,"unit":"台","estimatedUnitPrice":9300.00,"estimatedAmount":186000.00}],"missingFields":[],"confidenceNotes":["匹配 IT 硬件预算"]}
                        """;
                case PURCHASE_REQUEST_RISK -> """
                    {"riskLevel":"MEDIUM","riskItems":[{"title":"金额较高","evidence":"申请金额需要审批","severity":"MEDIUM"}],"suggestedActions":["确认预算余量"],"followUpQuestions":["是否需要分批交付"],"continueRecommended":true}
                    """;
                case RFQ_QUOTE_EXPLANATION -> """
                    {"summary":"蓝芯价格最低但交期稍晚","supplierInsights":[{"supplierId":"supplier-bluechip","assessment":"价格最低，型号匹配","strengths":["价格优势"],"risks":["需确认交付排期"]}],"keyDifferences":["价格与交期形成权衡"],"riskNotes":["关注批量交付"],"questionsToConfirm":["是否接受 6 月 20 日交付"],"confidenceLevel":"HIGH"}
                    """;
                case THREE_WAY_MATCHING_EXPLANATION -> """
                    {"summary":"发票金额高于 PO","differenceInsights":[{"differenceId":"TWM-20260519-0002-D01","assessment":"发票含税金额比 PO 高 2300","suggestedManualAction":"请财务核对发票明细"}],"likelyCauses":["供应商开票包含额外费用"],"suggestedActions":["确认是否退票重开","与采购员核对 PO"],"requiredFollowUpData":["发票明细","供应商说明"],"confidenceLevel":"HIGH"}
                    """;
            });
        }

        void reset() {
            configured = true;
            invalidOutput = false;
            unknownDraftReference = false;
            callCount = 0;
        }
    }

    private static final class StubAuditStore implements AiInvocationAuditStore {
        boolean available = true;
        final Map<String, Map<String, Object>> started = new LinkedHashMap<>();
        final Map<String, Map<String, Object>> completed = new LinkedHashMap<>();
        final Map<String, Map<String, Object>> failed = new LinkedHashMap<>();

        @Override
        public boolean isAvailable() {
            return available;
        }

        @Override
        public void start(
            String invocationId,
            AiScenario scenario,
            String companyId,
            String actorId,
            List<AiAssistantDtos.AiContextReference> sourceReferences,
            String inputSummary,
            Map<String, Object> sanitizedPromptContext,
            String model,
            OffsetDateTime startedAt
        ) {
            started.put(invocationId, Map.of(
                "scenario", scenario,
                "companyId", companyId,
                "actorId", actorId,
                "inputSummary", inputSummary,
                "context", sanitizedPromptContext,
                "model", model));
        }

        @Override
        public void complete(String invocationId, Map<String, Object> structuredOutput, long latencyMs, OffsetDateTime completedAt) {
            completed.put(invocationId, structuredOutput);
        }

        @Override
        public void fail(String invocationId, String errorCode, String errorMessage, long latencyMs, OffsetDateTime completedAt) {
            failed.put(invocationId, Map.of("errorCode", errorCode, "errorMessage", errorMessage));
        }

        void reset() {
            available = true;
            started.clear();
            completed.clear();
            failed.clear();
        }
    }
}
