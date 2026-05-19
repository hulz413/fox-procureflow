package com.foxprocureflow.attachments;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration",
    "fox.procureflow.attachments.max-size-bytes=1024",
    "fox.procureflow.attachments.allowed-content-types=application/pdf,image/jpeg,text/plain"
})
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FileAttachmentIntegrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("fox_procureflow_file_attachment_test")
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
    private AttachmentObjectStorage objectStorage;

    @BeforeEach
    void setUpStorage() {
        when(objectStorage.upload(anyString(), anyString(), any(InputStream.class), anyLong(), anyString(), anyMap()))
            .thenReturn(new AttachmentObjectStorage.StoredObject("etag-test"));
        when(objectStorage.download(anyString(), anyString()))
            .thenReturn(new ByteArrayInputStream("pdf-content".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void uploadsListsDownloadsAndAssociatesRfqReceiptAndInvoiceAttachments() throws Exception {
        String rfqAttachmentId = uploadAttachment(
            "RFQ_QUOTE",
            "RFQ-20260518-0301",
            "supplier-bluechip",
            "user-digital-buyer",
            pdf("bluechip-quote-upload.pdf"));

        mockMvc.perform(get("/api/attachments")
                .param("companyId", "company-digital")
                .param("targetType", "RFQ_QUOTE")
                .param("targetId", "RFQ-20260518-0301")
                .param("supplierId", "supplier-bluechip"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].attachmentId").value(rfqAttachmentId))
            .andExpect(jsonPath("$.data[0].downloadable").value(true));

        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", "RFQ-20260518-0301", "supplier-bluechip")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(rfqAttachmentId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.attachments[0].attachmentId").value(rfqAttachmentId))
            .andExpect(jsonPath("$.data.attachments[0].downloadable").value(true));

        String receiptAttachmentId = uploadAttachment(
            "RECEIPT",
            "PO-20260518-0301",
            "supplier-bluechip",
            "user-demo-operator",
            jpeg("receipt-proof.jpg"));
        mockMvc.perform(post("/api/receipts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(receiptPayload(List.of(receiptAttachmentId)))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.attachments[0].attachmentId").value(receiptAttachmentId))
            .andExpect(jsonPath("$.data.attachments[0].downloadable").value(true));

        String invoiceAttachmentId = uploadAttachment(
            "INVOICE",
            "PO-20260518-0301",
            "supplier-bluechip",
            "user-digital-finance",
            pdf("invoice-file.pdf"));
        mockMvc.perform(post("/api/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invoicePayload("FP-UPLOAD-ATTACH-001", List.of(invoiceAttachmentId)))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.attachments[0].attachmentId").value(invoiceAttachmentId))
            .andExpect(jsonPath("$.data.attachments[0].downloadable").value(true));

        mockMvc.perform(get("/api/attachments/{attachmentId}/download", rfqAttachmentId)
                .param("companyId", "company-digital"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", containsString("bluechip-quote-upload.pdf")))
            .andExpect(content().string("pdf-content"));

        verify(objectStorage).download(anyString(), anyString());
    }

    @Test
    void rejectsUnsupportedOversizedCrossCompanyMissingStorageAndInvalidReuse() throws Exception {
        mockMvc.perform(multipart("/api/attachments")
                .file(new MockMultipartFile("file", "quote.exe", "application/octet-stream", "bad".getBytes()))
                .param("companyId", "company-digital")
                .param("targetType", "RFQ_QUOTE")
                .param("targetId", "RFQ-20260518-0301")
                .param("supplierId", "supplier-bluechip"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Unsupported attachment content type")));

        mockMvc.perform(multipart("/api/attachments")
                .file(new MockMultipartFile("file", "too-large.pdf", "application/pdf", new byte[2048]))
                .param("companyId", "company-digital")
                .param("targetType", "RFQ_QUOTE")
                .param("targetId", "RFQ-20260518-0301")
                .param("supplierId", "supplier-bluechip"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("exceeds max size")));

        mockMvc.perform(multipart("/api/attachments")
                .file(pdf("cross-company.pdf"))
                .param("companyId", "company-manufacturing")
                .param("targetType", "RFQ_QUOTE")
                .param("targetId", "RFQ-20260518-0301")
                .param("supplierId", "supplier-bluechip"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("rfqId does not belong to companyId")));

        String receiptAttachmentId = uploadAttachment(
            "RECEIPT",
            "PO-20260518-0301",
            "supplier-bluechip",
            "user-demo-operator",
            jpeg("wrong-target.jpg"));
        mockMvc.perform(put("/api/rfqs/{rfqId}/quotes/{supplierId}", "RFQ-20260518-0301", "supplier-bluechip")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quotePayload(receiptAttachmentId))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("incompatible targetType")));

        insertMetadataOnlyAttachment("ATT-METADATA-ONLY-RFQ");
        mockMvc.perform(get("/api/attachments/{attachmentId}/download", "ATT-METADATA-ONLY-RFQ")
                .param("companyId", "company-digital"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("metadata-only")));

        when(objectStorage.download(anyString(), anyString()))
            .thenThrow(new AttachmentStorageException("missing object", new IllegalStateException("missing")));
        mockMvc.perform(get("/api/attachments/{attachmentId}/download", "RFQ-20260518-0301-Q02-A01")
                .param("companyId", "company-digital"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", containsString("Stored object is not available")));

        mockMvc.perform(get("/api/attachments/{attachmentId}/download", "RCPT-20260519-0301-A01")
                .param("companyId", "company-manufacturing"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("does not belong to companyId")));
    }

    private String uploadAttachment(
        String targetType,
        String targetId,
        String supplierId,
        String uploadedBy,
        MockMultipartFile file
    ) throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/attachments")
                .file(file)
                .param("companyId", "company-digital")
                .param("targetType", targetType)
                .param("targetId", targetId)
                .param("supplierId", supplierId)
                .param("uploadedBy", uploadedBy)
                .param("description", "测试上传附件"))
            .andExpect(status().isOk())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.attachmentId");
    }

    private MockMultipartFile pdf(String fileName) {
        return new MockMultipartFile("file", fileName, "application/pdf", "pdf-content".getBytes(StandardCharsets.UTF_8));
    }

    private MockMultipartFile jpeg(String fileName) {
        return new MockMultipartFile("file", fileName, "image/jpeg", "jpeg-content".getBytes(StandardCharsets.UTF_8));
    }

    private void insertMetadataOnlyAttachment(String attachmentId) {
        jdbcTemplate.update("""
            INSERT INTO file_attachments (
                attachment_id,
                company_id,
                target_type,
                target_id,
                target_secondary_id,
                supplier_id,
                bucket_name,
                object_key,
                original_file_name,
                description,
                content_type,
                size_bytes,
                etag,
                storage_status,
                uploaded_by,
                linked_business_id,
                linked_at,
                created_at,
                updated_at
            )
            VALUES (?, 'company-digital', 'RFQ_QUOTE', 'RFQ-20260518-0301', 'supplier-bluechip',
                    'supplier-bluechip', 'rfq-attachments', ?, 'metadata-only.pdf',
                    '元数据附件下载拒绝测试', 'application/pdf', 0, NULL, 'METADATA_ONLY',
                    'user-digital-buyer', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """,
            attachmentId,
            "metadata-only/" + attachmentId + ".pdf");
    }

    private Map<String, Object> quotePayload(String attachmentId) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", "company-digital");
        payload.put("procurementUserId", "user-digital-buyer");
        payload.put("quoteAmount", 111000.00);
        payload.put("taxRate", 0.13);
        payload.put("deliveryDate", LocalDate.now().plusDays(15).toString());
        payload.put("supplierScore", 90.00);
        payload.put("riskNote", "上传报价单测试");
        payload.put("attachmentIds", List.of(attachmentId));
        return payload;
    }

    private Map<String, Object> receiptPayload(List<String> attachmentIds) {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "receivedBy", "user-demo-operator",
            "receivedDate", "2026-06-08",
            "note", "测试真实收货凭证上传",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "receivedQuantity", 1.00
            )),
            "attachmentIds", attachmentIds
        );
    }

    private Map<String, Object> invoicePayload(String invoiceNumber, List<String> attachmentIds) {
        return Map.of(
            "companyId", "company-digital",
            "poId", "PO-20260518-0301",
            "invoiceNumber", invoiceNumber,
            "invoiceDate", "2026-06-09",
            "registeredBy", "user-digital-finance",
            "note", "测试真实发票文件上传",
            "lines", List.of(Map.of(
                "poLineId", "PO-20260518-0301-L01",
                "invoicedQuantity", 1.00,
                "untaxedAmount", 100.00,
                "taxRate", 0.1300,
                "taxAmount", 13.00,
                "totalAmount", 113.00
            )),
            "attachmentIds", attachmentIds
        );
    }
}
