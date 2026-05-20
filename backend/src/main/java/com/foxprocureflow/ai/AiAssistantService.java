package com.foxprocureflow.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.ai.AiAssistantDtos.AiAssistantResponse;
import com.foxprocureflow.ai.AiAssistantDtos.AiContextReference;
import com.foxprocureflow.ai.AiAssistantDtos.MatchingExplanationRequest;
import com.foxprocureflow.ai.AiAssistantDtos.PurchaseRequestDraftPreviewRequest;
import com.foxprocureflow.ai.AiAssistantDtos.PurchaseRequestRiskReviewRequest;
import com.foxprocureflow.ai.AiAssistantDtos.RfqQuoteExplanationRequest;
import com.foxprocureflow.ai.AiStructuredOutputValidator.DraftAllowedReferences;
import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.BudgetAccountSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.CategorySummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.DepartmentSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.SupplierSummary;
import com.foxprocureflow.identity.masterdata.MasterDataDtos.UserSummary;
import com.foxprocureflow.identity.masterdata.MasterDataService;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.matching.ThreeWayMatchStatus;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchDetailResponse;
import com.foxprocureflow.matching.ThreeWayMatchingService;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalDetailResponse;
import com.foxprocureflow.procurement.approval.ApprovalService;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestDetailResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestService;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqComparisonRowResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqDetailResponse;
import com.foxprocureflow.procurement.rfq.RfqService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiAssistantService {

    private final AiProvider provider;
    private final AiInvocationAuditStore auditStore;
    private final AiPromptSanitizer sanitizer;
    private final AiStructuredOutputValidator outputValidator;
    private final MasterDataService masterDataService;
    private final PurchaseRequestService purchaseRequestService;
    private final ApprovalService approvalService;
    private final RfqService rfqService;
    private final ThreeWayMatchingService matchingService;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AiAssistantService(
        AiProvider provider,
        AiInvocationAuditStore auditStore,
        AiPromptSanitizer sanitizer,
        AiStructuredOutputValidator outputValidator,
        MasterDataService masterDataService,
        PurchaseRequestService purchaseRequestService,
        ApprovalService approvalService,
        RfqService rfqService,
        ThreeWayMatchingService matchingService,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        ObjectMapper objectMapper
    ) {
        this.provider = provider;
        this.auditStore = auditStore;
        this.sanitizer = sanitizer;
        this.outputValidator = outputValidator;
        this.masterDataService = masterDataService;
        this.purchaseRequestService = purchaseRequestService;
        this.approvalService = approvalService;
        this.rfqService = rfqService;
        this.matchingService = matchingService;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AiAssistantResponse previewPurchaseRequestDraft(PurchaseRequestDraftPreviewRequest request) {
        DemoUserJpaEntity actor = requireUserInCompany(request.companyId(), request.actorId());
        DemoCompanyContext company = requireCompany(request.companyId());
        List<DepartmentSummary> departments = masterDataService.listDepartments(request.companyId());
        List<UserSummary> users = masterDataService.listUsers(request.companyId());
        List<CategorySummary> categories = masterDataService.listCategories();
        List<BudgetAccountSummary> budgetAccounts = masterDataService.listBudgetAccounts(request.companyId());
        List<SupplierSummary> suppliers = masterDataService.listSuppliers(null);
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("company", company);
        context.put("actor", actorSummary(actor));
        context.put("intent", request.intent());
        context.put("today", LocalDate.now().toString());
        context.put("departments", departments);
        context.put("requesters", users.stream().map(this::userOption).toList());
        context.put("categories", categories);
        context.put("budgetAccounts", budgetAccounts);
        context.put("suppliers", suppliers.stream().map(this::supplierOption).toList());
        DraftAllowedReferences references = new DraftAllowedReferences(
            users.stream().map(UserSummary::userId).collect(Collectors.toSet()),
            departments.stream().map(DepartmentSummary::departmentId).collect(Collectors.toSet()),
            categories.stream().map(CategorySummary::categoryId).collect(Collectors.toSet()),
            budgetAccounts.stream().map(BudgetAccountSummary::budgetAccountId).collect(Collectors.toSet()),
            suppliers.stream().map(SupplierSummary::supplierId).collect(Collectors.toSet()));

        return invokeScenario(
            AiScenario.PURCHASE_REQUEST_DRAFT,
            request.companyId(),
            request.actorId(),
            "Draft purchase request from natural language intent",
            List.of(new AiContextReference("company", request.companyId(), company.companyName())),
            context,
            draftSystemPrompt(),
            "用户采购意图与可选主数据如下。请只基于 allowed options 生成草稿预览。\n" + toPrettyJson(context),
            result -> outputValidator.validateDraft(result, references));
    }

    @Transactional(readOnly = true)
    public AiAssistantResponse reviewPurchaseRequestRisk(PurchaseRequestRiskReviewRequest request) {
        requireUserInCompany(request.companyId(), request.actorId());
        requireCompany(request.companyId());
        PurchaseRequestDetailResponse detail = purchaseRequestService.detail(request.requestId());
        requireCompanyOwnership(detail.companyId(), request.companyId(), "requestId");
        ApprovalDetailResponse approvalDetail = null;
        if (detail.approval() != null) {
            approvalDetail = approvalService.detailByRequestId(detail.requestId(), request.companyId());
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("purchaseRequest", detail);
        context.put("approval", approvalDetail);
        context.put("company", requireCompany(request.companyId()));
        context.put("actorId", request.actorId());

        List<AiContextReference> references = detail.approval() == null
            ? List.of(new AiContextReference("purchaseRequest", detail.requestId(), detail.title()))
            : List.of(
                new AiContextReference("purchaseRequest", detail.requestId(), detail.title()),
                new AiContextReference("approval", detail.approval().approvalId(), detail.approval().matchedRuleId()));

        return invokeScenario(
            AiScenario.PURCHASE_REQUEST_RISK,
            request.companyId(),
            request.actorId(),
            "Review purchase request risk before submission or approval",
            references,
            context,
            riskSystemPrompt(),
            "请基于以下采购申请和审批上下文生成风险提示，不得改变业务状态。\n" + toPrettyJson(context),
            outputValidator::validateRiskReview);
    }

    @Transactional(readOnly = true)
    public AiAssistantResponse explainRfqQuotes(RfqQuoteExplanationRequest request) {
        requireUserInCompany(request.companyId(), request.actorId());
        requireCompany(request.companyId());
        RfqDetailResponse detail = rfqService.detail(request.rfqId(), request.companyId());
        List<RfqComparisonRowResponse> comparison = rfqService.comparison(request.rfqId(), request.companyId());
        if (comparison.size() < 2) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RFQ needs at least two valid quotes before AI explanation");
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("rfq", detail);
        context.put("comparisonRows", comparison);
        context.put("company", requireCompany(request.companyId()));
        context.put("actorId", request.actorId());
        Set<String> supplierIds = detail.suppliers().stream()
            .map(supplier -> supplier.supplierId())
            .collect(Collectors.toCollection(LinkedHashSet::new));
        comparison.stream().map(RfqComparisonRowResponse::supplierId).forEach(supplierIds::add);

        return invokeScenario(
            AiScenario.RFQ_QUOTE_EXPLANATION,
            request.companyId(),
            request.actorId(),
            "Explain RFQ quote comparison without changing deterministic rank",
            List.of(new AiContextReference("rfq", detail.rfqId(), detail.title())),
            context,
            rfqSystemPrompt(),
            "请解释以下 RFQ 报价对比。supplierInsights 只能引用 rfq.suppliers 中的 supplierId；必须保留 comparisonRows 中的 rank，不得建议自动创建 PO。\n"
                + toPrettyJson(context),
            result -> outputValidator.validateRfqExplanation(result, supplierIds));
    }

    @Transactional(readOnly = true)
    public AiAssistantResponse explainMatchingException(MatchingExplanationRequest request) {
        requireUserInCompany(request.companyId(), request.actorId());
        requireCompany(request.companyId());
        MatchDetailResponse detail = matchingService.detail(request.matchId(), request.companyId());
        if (detail.status() != ThreeWayMatchStatus.EXCEPTION) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only EXCEPTION matching results can use AI exception explanation");
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("matchingResult", detail);
        context.put("company", requireCompany(request.companyId()));
        context.put("actorId", request.actorId());
        Set<String> differenceIds = detail.differences().stream()
            .map(difference -> difference.differenceId())
            .collect(Collectors.toSet());

        return invokeScenario(
            AiScenario.THREE_WAY_MATCHING_EXPLANATION,
            request.companyId(),
            request.actorId(),
            "Explain three-way matching exception without mutating matching state",
            List.of(
                new AiContextReference("matchingResult", detail.matchId(), detail.sourcePo().poId()),
                new AiContextReference("purchaseOrder", detail.sourcePo().poId(), detail.sourcePo().title())),
            context,
            matchingSystemPrompt(),
            "请解释以下三单匹配异常，并给出人工处理建议。不得自动追加处理记录或改变状态。\n" + toPrettyJson(context),
            result -> outputValidator.validateMatchingExplanation(result, differenceIds));
    }

    private AiAssistantResponse invokeScenario(
        AiScenario scenario,
        String companyId,
        String actorId,
        String inputSummary,
        List<AiContextReference> sourceReferences,
        Map<String, Object> promptContext,
        String systemPrompt,
        String userPrompt,
        Consumer<Map<String, Object>> validator
    ) {
        if (!auditStore.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI audit storage is unavailable");
        }
        String invocationId = nextInvocationId();
        OffsetDateTime startedAt = OffsetDateTime.now();
        long startNanos = System.nanoTime();
        Map<String, Object> sanitizedPromptContext = sanitizer.sanitize(promptContext);
        try {
            auditStore.start(
                invocationId,
                scenario,
                companyId,
                actorId,
                sourceReferences,
                inputSummary,
                sanitizedPromptContext,
                provider.model(),
                startedAt);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI audit storage is unavailable");
        }

        if (!provider.isConfigured()) {
            failAudit(invocationId, "AI_PROVIDER_UNAVAILABLE", provider.unavailableReason(), startNanos);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, provider.unavailableReason());
        }

        try {
            AiProviderResult providerResult = provider.generate(new AiProviderRequest(scenario, systemPrompt, userPrompt));
            Map<String, Object> parsed = outputValidator.parseObject(providerResult.content());
            validator.accept(parsed);
            auditStore.complete(invocationId, parsed, elapsedMillis(startNanos), OffsetDateTime.now());
            return new AiAssistantResponse(
                invocationId,
                scenario,
                providerResult.model(),
                parsed,
                sourceReferences,
                OffsetDateTime.now());
        } catch (AiProviderException exception) {
            failAudit(invocationId, exception.errorCode(), exception.getMessage(), startNanos);
            throw new ResponseStatusException(exception.status(), exception.getMessage());
        } catch (RuntimeException exception) {
            failAudit(invocationId, "AI_ASSISTANT_ERROR", exception.getMessage(), startNanos);
            throw exception;
        }
    }

    private void failAudit(String invocationId, String errorCode, String errorMessage, long startNanos) {
        try {
            auditStore.fail(invocationId, errorCode, errorMessage, elapsedMillis(startNanos), OffsetDateTime.now());
        } catch (RuntimeException ignored) {
            // The user-facing response already reports the failed AI call; audit recovery is handled operationally.
        }
    }

    private DemoCompanyContext requireCompany(String companyId) {
        return companyRepository.findByCompanyId(companyId)
            .map(company -> new DemoCompanyContext(
                company.getCompanyId(),
                company.getCompanyName(),
                company.getBusinessScope(),
                company.isActive()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown companyId: " + companyId));
    }

    private DemoUserJpaEntity requireUserInCompany(String companyId, String actorId) {
        DemoUserJpaEntity user = userRepository.findByUserId(actorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown actorId: " + actorId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "actorId does not belong to companyId: " + actorId);
        }
        return user;
    }

    private void requireCompanyOwnership(String actualCompanyId, String requestedCompanyId, String label) {
        if (!actualCompanyId.equals(requestedCompanyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " does not belong to companyId: " + requestedCompanyId);
        }
    }

    private Map<String, Object> actorSummary(DemoUserJpaEntity user) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("userId", user.getUserId());
        summary.put("companyId", user.getCompanyId());
        summary.put("departmentId", user.getDepartmentId());
        summary.put("displayName", user.getDisplayName());
        summary.put("positionTitle", user.getPositionTitle());
        return summary;
    }

    private Map<String, Object> userOption(UserSummary user) {
        Map<String, Object> option = new LinkedHashMap<>();
        option.put("userId", user.userId());
        option.put("companyId", user.companyId());
        option.put("departmentId", user.departmentId());
        option.put("departmentName", user.departmentName());
        option.put("displayName", user.displayName());
        option.put("positionTitle", user.positionTitle());
        option.put("active", user.active());
        return option;
    }

    private Map<String, Object> supplierOption(SupplierSummary supplier) {
        Map<String, Object> option = new LinkedHashMap<>();
        option.put("supplierId", supplier.supplierId());
        option.put("supplierName", supplier.supplierName());
        option.put("serviceScope", supplier.serviceScope());
        option.put("status", supplier.status());
        option.put("riskLevel", supplier.riskLevel());
        option.put("sharedScope", supplier.sharedScope());
        option.put("categories", supplier.categories());
        return option;
    }

    private String toPrettyJson(Object value) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize AI prompt context", exception);
        }
    }

    private String nextInvocationId() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "AI-" + date + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private long elapsedMillis(long startNanos) {
        return Math.max(1L, (System.nanoTime() - startNanos) / 1_000_000L);
    }

    private String draftSystemPrompt() {
        return """
            You are Fox Procureflow's procurement drafting assistant for an internal multi-company purchasing platform.
            Return ONLY one JSON object. Do not return Markdown.
            Use only IDs present in the provided context.
            Schema:
            {
              "title": string,
              "businessPurpose": string,
              "requesterId": string,
              "departmentId": string,
              "categoryId": string,
              "budgetAccountId": string,
              "supplierId": string | "",
              "expectedDeliveryDate": "YYYY-MM-DD",
              "currency": "CNY",
              "totalAmount": number,
              "lineItems": [{"itemName": string, "specification": string, "quantity": number, "unit": string, "estimatedUnitPrice": number, "estimatedAmount": number}],
              "missingFields": string[],
              "confidenceNotes": string[]
            }
            """;
    }

    private String riskSystemPrompt() {
        return """
            You are Fox Procureflow's procurement risk assistant.
            Return ONLY one JSON object. Do not mutate business state.
            Schema:
            {
              "riskLevel": "LOW" | "MEDIUM" | "HIGH",
              "riskItems": [{"title": string, "evidence": string, "severity": "LOW" | "MEDIUM" | "HIGH"}],
              "suggestedActions": string[],
              "followUpQuestions": string[],
              "continueRecommended": boolean
            }
            """;
    }

    private String rfqSystemPrompt() {
        return """
            You are Fox Procureflow's RFQ comparison explanation assistant.
            Return ONLY one JSON object. Preserve the provided deterministic rank and never create purchase orders.
            Schema:
            {
              "summary": string,
              "supplierInsights": [{"supplierId": string, "assessment": string, "strengths": string[], "risks": string[]}],
              "keyDifferences": string[],
              "riskNotes": string[],
              "questionsToConfirm": string[],
              "confidenceLevel": "LOW" | "MEDIUM" | "HIGH"
            }
            """;
    }

    private String matchingSystemPrompt() {
        return """
            You are Fox Procureflow's three-way matching exception explanation assistant.
            Return ONLY one JSON object. Do not append handling records or change matching status.
            Schema:
            {
              "summary": string,
              "differenceInsights": [{"differenceId": string, "assessment": string, "suggestedManualAction": string}],
              "likelyCauses": string[],
              "suggestedActions": string[],
              "requiredFollowUpData": string[],
              "confidenceLevel": "LOW" | "MEDIUM" | "HIGH"
            }
            """;
    }
}
