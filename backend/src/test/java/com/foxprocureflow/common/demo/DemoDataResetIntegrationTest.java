package com.foxprocureflow.common.demo;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
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
class DemoDataResetIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_reset_test")
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
    void resetsDatabaseBackToFlywaySeedData() throws Exception {
        String transientRequestId = createDraft();

        mockMvc.perform(get("/api/purchase-requests/{requestId}", transientRequestId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("临时演示申请"));

        mockMvc.perform(post("/api/demo-data/reset"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.migrationsExecuted", greaterThan(0)))
            .andExpect(jsonPath("$.data.schemaVersion").value("23"));

        mockMvc.perform(get("/api/purchase-requests/{requestId}", transientRequestId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Unknown requestId")));

        mockMvc.perform(get("/api/purchase-requests/{requestId}", "PR-20260519-0601"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("会议室智能屏扩容采购"));
    }

    private String createDraft() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/purchase-requests/drafts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draftPayload())))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.requestId");
    }

    private Map<String, Object> draftPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("requesterId", "user-digital-applicant");
        payload.put("departmentId", "dept-digital-it");
        payload.put("categoryId", "category-it-hardware");
        payload.put("budgetAccountId", "budget-digital-it-equipment");
        payload.put("supplierId", "supplier-bluechip");
        payload.put("title", "临时演示申请");
        payload.put("description", "用于验证演示数据重置");
        payload.put("totalAmount", 12000.00);
        payload.put("currency", "CNY");
        payload.put("expectedDeliveryDate", "2026-06-18");
        payload.put("lineItems", List.of(Map.of(
            "itemName", "临时采购设备",
            "specification", "演示重置验证",
            "quantity", 2,
            "unit", "台",
            "estimatedUnitPrice", 6000.00,
            "estimatedAmount", 12000.00
        )));
        return payload;
    }
}
