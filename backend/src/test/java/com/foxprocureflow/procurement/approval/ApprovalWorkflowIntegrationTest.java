package com.foxprocureflow.procurement.approval;

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
import java.util.LinkedHashMap;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
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
class ApprovalWorkflowIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_approval_test")
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
    void migrationBackfillsSeededApprovalTasks() throws Exception {
        mockMvc.perform(get("/api/approvals/tasks")
                .param("companyId", "company-digital")
                .param("approverId", "user-digital-approver"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260518-0102")))
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0401")))
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0402")))
            .andExpect(jsonPath("$.data[*].companyId", not(hasItem("company-manufacturing"))));

        mockMvc.perform(get("/api/approvals/tasks")
                .param("companyId", "company-digital")
                .param("approverId", "user-digital-finance"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0403")))
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0404")));

        mockMvc.perform(get("/api/approvals/tasks")
                .param("companyId", "company-manufacturing")
                .param("approverId", "user-mfg-approver"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0501")))
            .andExpect(jsonPath("$.data[*].requestId", hasItem("PR-20260519-0502")));
    }

    @Test
    void submitsDigitalHighAmountRequestIntoTwoStepApproval() throws Exception {
        String requestId = createDraft(digitalLaptopDraft());

        MvcResult submitted = submit(requestId)
            .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.data.totalAmount").value(186000.00))
            .andExpect(jsonPath("$.data.approval.status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$.data.approval.currentApproverId").value("user-digital-approver"))
            .andExpect(jsonPath("$.data.approval.matchedRuleId").value("rule-digital-it-high"))
            .andReturn();

        String approvalId = JsonPath.read(submitted.getResponse().getContentAsString(), "$.data.approval.approvalId");
        mockMvc.perform(get("/api/approvals/{approvalId}", approvalId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.requestId").value(requestId))
            .andExpect(jsonPath("$.data.nodes.length()").value(2))
            .andExpect(jsonPath("$.data.nodes[0].approverId").value("user-digital-approver"))
            .andExpect(jsonPath("$.data.nodes[0].status").value("ACTIVE"))
            .andExpect(jsonPath("$.data.nodes[1].approverId").value("user-digital-finance"))
            .andExpect(jsonPath("$.data.nodes[1].status").value("PENDING"))
            .andExpect(jsonPath("$.data.contextSnapshot.lineCount").value(1));
    }

    @Test
    void submitsManufacturingSparesRequestIntoOneStepApproval() throws Exception {
        String requestId = createDraft(manufacturingSpareDraft());
        String approvalId = submitAndReadApprovalId(requestId);

        mockMvc.perform(get("/api/approvals/by-request/{requestId}", requestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.approvalId").value(approvalId))
            .andExpect(jsonPath("$.data.companyId").value("company-manufacturing"))
            .andExpect(jsonPath("$.data.matchedRuleId").value("rule-mfg-spares"))
            .andExpect(jsonPath("$.data.nodes.length()").value(1))
            .andExpect(jsonPath("$.data.nodes[0].approverId").value("user-mfg-approver"))
            .andExpect(jsonPath("$.data.nodes[0].status").value("ACTIVE"));
    }

    @Test
    void usesCompanyDefaultRuleForOtherCategories() throws Exception {
        String requestId = createDraft(digitalSoftwareDraft());
        String approvalId = submitAndReadApprovalId(requestId);

        mockMvc.perform(get("/api/approvals/{approvalId}", approvalId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.matchedRuleId").value("rule-digital-default"))
            .andExpect(jsonPath("$.data.nodes.length()").value(1))
            .andExpect(jsonPath("$.data.nodes[0].approverId").value("user-digital-approver"));
    }

    @Test
    void missingRuleRejectsSubmitAndRollsBackDraft() throws Exception {
        ensureCompanyWithoutApprovalRule();
        String requestId = createDraft(noRuleDraft());

        mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("No active approval rule matched")));

        mockMvc.perform(get("/api/purchase-requests/{requestId}", requestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andExpect(jsonPath("$.data.approval").doesNotExist());
    }

    @Test
    void approveAdvancesSerialWorkflowAndRejectsDuplicateTerminalOperation() throws Exception {
        String approvalId = submitAndReadApprovalId(createDraft(digitalLaptopDraft()));

        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-finance", "越级审批")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("actorId is not the current approver")));

        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-approver", "一审通过")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$.data.nodes[0].status").value("APPROVED"))
            .andExpect(jsonPath("$.data.nodes[1].status").value("ACTIVE"))
            .andExpect(jsonPath("$.data.timeline[*].comment", hasItem("一审通过")));

        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-finance", "财务通过")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("APPROVED"))
            .andExpect(jsonPath("$.data.completedAt").exists());

        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-finance", "重复通过")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already terminal")));
    }

    @Test
    void rejectTerminatesWorkflowWithComment() throws Exception {
        String approvalId = submitAndReadApprovalId(createDraft(digitalLaptopDraft()));

        mockMvc.perform(post("/api/approvals/{approvalId}/reject", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-approver", "预算不足")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("REJECTED"))
            .andExpect(jsonPath("$.data.nodes[0].status").value("REJECTED"))
            .andExpect(jsonPath("$.data.nodes[1].status").value("CANCELLED"))
            .andExpect(jsonPath("$.data.timeline[*].action", hasItem("REJECTED")))
            .andExpect(jsonPath("$.data.timeline[*].comment", hasItem("预算不足")));
    }

    @Test
    void requesterCanWithdrawInProgressApprovalOnlyOnce() throws Exception {
        String approvalId = submitAndReadApprovalId(createDraft(digitalLaptopDraft()));

        mockMvc.perform(post("/api/approvals/{approvalId}/withdraw", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-approver", "代申请人撤回")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Only the original requester")));

        mockMvc.perform(post("/api/approvals/{approvalId}/withdraw", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-applicant", "需求调整")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("WITHDRAWN"))
            .andExpect(jsonPath("$.data.nodes[0].status").value("CANCELLED"))
            .andExpect(jsonPath("$.data.nodes[1].status").value("CANCELLED"));

        mockMvc.perform(post("/api/approvals/{approvalId}/withdraw", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-digital-applicant", "重复撤回")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already terminal")));
    }

    @Test
    void taskListIsCompanyScopedAndOpenApiDocumentsApprovalEndpoints() throws Exception {
        String digitalRequestId = createDraft(digitalLaptopDraft());
        String digitalApprovalId = submitAndReadApprovalId(digitalRequestId);
        String manufacturingRequestId = createDraft(manufacturingSpareDraft());
        submitAndReadApprovalId(manufacturingRequestId);

        mockMvc.perform(get("/api/approvals/tasks")
                .param("companyId", "company-digital")
                .param("approverId", "user-digital-approver"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].requestId", not(hasItem(manufacturingRequestId))));

        mockMvc.perform(get("/api/approvals/tasks")
                .param("companyId", "company-unknown")
                .param("approverId", "user-digital-approver"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown companyId")));

        mockMvc.perform(get("/api/approvals/{approvalId}", digitalApprovalId)
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));

        mockMvc.perform(get("/api/approvals/by-request/{requestId}", digitalRequestId)
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));

        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$['paths']['/api/approvals/tasks']").exists())
            .andExpect(jsonPath("$['paths']['/api/approvals/{approvalId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/approvals/by-request/{requestId}']").exists())
            .andExpect(jsonPath("$['paths']['/api/approvals/{approvalId}/approve']").exists())
            .andExpect(jsonPath("$['paths']['/api/approvals/{approvalId}/reject']").exists())
            .andExpect(jsonPath("$['paths']['/api/approvals/{approvalId}/withdraw']").exists());
    }

    @Test
    void approvalDoesNotCreateDownstreamProcurementRecords() throws Exception {
        String requestId = createDraft(manufacturingSpareDraft());
        String approvalId = submitAndReadApprovalId(requestId);
        int initialRfqCount = rowCount("rfqs");
        int initialPurchaseOrderCount = rowCount("purchase_orders");

        mockMvc.perform(post("/api/approvals/{approvalId}/approve", approvalId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(action("user-mfg-approver", "同意采购")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("APPROVED"));

        assertThat(rowCount("rfqs")).isEqualTo(initialRfqCount);
        assertThat(rfqCountForRequest(requestId)).isZero();
        assertThat(rowCount("purchase_orders")).isEqualTo(initialPurchaseOrderCount);
        assertThat(tableExists("receipts")).isFalse();
        assertThat(tableExists("invoices")).isFalse();
        assertThat(tableExists("matching_records")).isFalse();
    }

    private ResultActions submit(String requestId) throws Exception {
        return mockMvc.perform(post("/api/purchase-requests/{requestId}/submit", requestId))
            .andExpect(status().isOk());
    }

    private String submitAndReadApprovalId(String requestId) throws Exception {
        MvcResult result = submit(requestId).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.approval.approvalId");
    }

    private String createDraft(Map<String, Object> payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.requestId");
    }

    private String action(String actorId, String comment) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
            "actorId", actorId,
            "comment", comment
        ));
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
        payload.put("expectedDeliveryDate", "2026-06-15");
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

    private Map<String, Object> digitalSoftwareDraft() {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requesterId", "user-digital-applicant");
        payload.put("departmentId", "dept-digital-it");
        payload.put("categoryId", "category-software-subscription");
        payload.put("budgetAccountId", "budget-digital-software");
        payload.put("supplierId", "supplier-yunzhou");
        payload.put("title", "研发集成开发工具企业订阅续费");
        payload.put("description", "研发工具续费");
        payload.put("totalAmount", 38000.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", "2026-06-01");
        payload.put("lineItems", List.of(Map.of(
            "itemName", "集成开发工具企业订阅",
            "specification", "研发团队年度授权",
            "quantity", 20,
            "unit", "席",
            "estimatedUnitPrice", 1900.00,
            "estimatedAmount", 38000.00
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
        payload.put("expectedDeliveryDate", "2026-06-20");
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

    private Map<String, Object> noRuleDraft() {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-no-rule");
        payload.put("requesterId", "user-no-rule-applicant");
        payload.put("departmentId", "dept-no-rule-admin");
        payload.put("categoryId", "category-office-supplies");
        payload.put("budgetAccountId", "budget-no-rule-office");
        payload.put("title", "测试无审批规则采购");
        payload.put("description", "用于验证提交回滚");
        payload.put("totalAmount", 1200.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", "2026-06-10");
        payload.put("lineItems", List.of(Map.of(
            "itemName", "测试耗材",
            "specification", "无规则测试",
            "quantity", 4,
            "unit", "件",
            "estimatedUnitPrice", 300.00,
            "estimatedAmount", 1200.00
        )));
        return payload;
    }

    private void ensureCompanyWithoutApprovalRule() {
        jdbcTemplate.update("""
            INSERT IGNORE INTO demo_companies (group_id, company_id, company_name, business_scope, active)
            VALUES ('group-xinghe', 'company-no-rule', '无审批规则测试公司', '测试采购', TRUE)
            """);
        jdbcTemplate.update("""
            INSERT IGNORE INTO demo_departments (company_id, department_id, department_name, function_scope, sort_order)
            VALUES ('company-no-rule', 'dept-no-rule-admin', '测试部门', '测试采购申请', 10)
            """);
        jdbcTemplate.update("""
            INSERT IGNORE INTO demo_users (company_id, department_id, user_id, display_name, email, position_title, active)
            VALUES ('company-no-rule', 'dept-no-rule-admin', 'user-no-rule-applicant', '测试申请人', 'no.rule@xinghe.com', '测试申请人', TRUE)
            """);
        jdbcTemplate.update("""
            INSERT IGNORE INTO demo_user_roles (user_id, role_id)
            VALUES ('user-no-rule-applicant', 'role-applicant')
            """);
        jdbcTemplate.update("""
            INSERT IGNORE INTO demo_budget_accounts (
                company_id,
                budget_account_id,
                account_name,
                category_id,
                annual_budget_amount,
                available_amount,
                currency,
                active,
                sort_order
            )
            VALUES (
                'company-no-rule',
                'budget-no-rule-office',
                '无规则办公预算',
                'category-office-supplies',
                10000.00,
                10000.00,
                'CNY',
                TRUE,
                10
            )
            """);
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = ?
            """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private int rowCount(String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        return count == null ? 0 : count;
    }

    private int rfqCountForRequest(String requestId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM rfqs WHERE request_id = ?",
            Integer.class,
            requestId
        );
        return count == null ? 0 : count;
    }
}
