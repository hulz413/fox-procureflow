package com.foxprocureflow.procurement.request;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.identity.persistence.DemoBudgetAccountJpaEntity;
import com.foxprocureflow.identity.persistence.DemoBudgetAccountRepository;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoDepartmentJpaEntity;
import com.foxprocureflow.identity.persistence.DemoDepartmentRepository;
import com.foxprocureflow.identity.persistence.DemoProcurementCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierJpaEntity;
import com.foxprocureflow.identity.persistence.DemoSupplierRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalSummaryResponse;
import com.foxprocureflow.procurement.approval.ApprovalService;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.CreateDraftLineRequest;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.CreateDraftRequest;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestDetailResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestLineResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestDtos.PurchaseRequestListItemResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PurchaseRequestService {

    private static final TypeReference<Map<String, Object>> FIELD_SNAPSHOT_TYPE = new TypeReference<>() {
    };

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestLineRepository lineRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final DemoDepartmentRepository departmentRepository;
    private final DemoProcurementCategoryRepository categoryRepository;
    private final DemoBudgetAccountRepository budgetAccountRepository;
    private final DemoSupplierRepository supplierRepository;
    private final DemoSupplierCategoryRepository supplierCategoryRepository;
    private final ApprovalService approvalService;
    private final ObjectMapper objectMapper;

    public PurchaseRequestService(
        PurchaseRequestRepository purchaseRequestRepository,
        PurchaseRequestLineRepository lineRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        DemoDepartmentRepository departmentRepository,
        DemoProcurementCategoryRepository categoryRepository,
        DemoBudgetAccountRepository budgetAccountRepository,
        DemoSupplierRepository supplierRepository,
        DemoSupplierCategoryRepository supplierCategoryRepository,
        ApprovalService approvalService,
        ObjectMapper objectMapper
    ) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.lineRepository = lineRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
        this.budgetAccountRepository = budgetAccountRepository;
        this.supplierRepository = supplierRepository;
        this.supplierCategoryRepository = supplierCategoryRepository;
        this.approvalService = approvalService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PurchaseRequestDetailResponse createDraft(CreateDraftRequest request) {
        validateMasterData(request);
        List<String> supplierIds = normalizedSupplierIds(request);

        String requestId = nextRequestId();
        List<PurchaseRequestLineJpaEntity> lines = buildLines(requestId, request.categoryId(), request.lineItems());
        BigDecimal calculatedTotal = normalize(lines.stream()
            .map(PurchaseRequestLineJpaEntity::getEstimatedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add));
        if (normalize(request.totalAmount()).compareTo(calculatedTotal) != 0) {
            throw badRequest("totalAmount must equal the sum of line estimated amounts");
        }

        String fieldSnapshotJson = toJson(fieldSnapshot(request, calculatedTotal, supplierIds));
        PurchaseRequestJpaEntity saved = purchaseRequestRepository.saveAndFlush(new PurchaseRequestJpaEntity(
            requestId,
            request.companyId(),
            request.requesterId(),
            request.departmentId(),
            request.categoryId(),
            request.budgetAccountId(),
            supplierIds.isEmpty() ? null : supplierIds.get(0),
            request.title().trim(),
            blankToNull(request.description()),
            calculatedTotal,
            request.currency().trim().toUpperCase(),
            request.expectedDeliveryDate(),
            fieldSnapshotJson));
        lineRepository.saveAll(lines);

        return toDetailResponse(saved, lineRepository.findByRequestIdOrderByLineNoAsc(saved.getRequestId()), null);
    }

    @Transactional
    public PurchaseRequestDetailResponse submit(String requestId) {
        PurchaseRequestJpaEntity request = purchaseRequestRepository.findByRequestId(requestId)
            .orElseThrow(() -> notFound("Unknown requestId: " + requestId));
        if (request.getStatus() != PurchaseRequestStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only DRAFT purchase requests can be submitted");
        }

        List<PurchaseRequestLineJpaEntity> lines = lineRepository.findByRequestIdOrderByLineNoAsc(request.getRequestId());
        request.submit();
        PurchaseRequestJpaEntity saved = purchaseRequestRepository.save(request);
        ApprovalSummaryResponse approval = approvalService.createForSubmittedRequest(saved, lines);

        return toDetailResponse(saved, lines, approval);
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestListItemResponse> list(String companyId, PurchaseRequestStatus status) {
        requireCompany(companyId);
        List<PurchaseRequestJpaEntity> requests = status == null
            ? purchaseRequestRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            : purchaseRequestRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status);
        List<String> requestIds = requests.stream()
            .map(PurchaseRequestJpaEntity::getRequestId)
            .toList();
        Map<String, Long> lineCounts = requests.isEmpty()
            ? Map.of()
            : lineRepository.findByRequestIdIn(requestIds)
                .stream()
                .collect(Collectors.groupingBy(
                    PurchaseRequestLineJpaEntity::getRequestId,
                    Collectors.counting()));
        Map<String, ApprovalSummaryResponse> approvalSummaries = approvalService.summariesByRequestIds(requestIds);

        return requests.stream()
            .map(request -> toListItemResponse(
                request,
                lineCounts.getOrDefault(request.getRequestId(), 0L).intValue(),
                approvalSummaries.get(request.getRequestId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseRequestDetailResponse detail(String requestId) {
        PurchaseRequestJpaEntity request = purchaseRequestRepository.findByRequestId(requestId)
            .orElseThrow(() -> notFound("Unknown requestId: " + requestId));
        return toDetailResponse(
            request,
            lineRepository.findByRequestIdOrderByLineNoAsc(requestId),
            approvalService.findSummaryByRequestId(requestId));
    }

    private void validateMasterData(CreateDraftRequest request) {
        requireCompany(request.companyId());

        DemoUserJpaEntity requester = userRepository.findByUserId(request.requesterId())
            .orElseThrow(() -> badRequest("Unknown requesterId: " + request.requesterId()));
        if (!requester.isActive() || !request.companyId().equals(requester.getCompanyId())) {
            throw badRequest("requesterId does not belong to companyId: " + request.requesterId());
        }

        DemoDepartmentJpaEntity department = departmentRepository.findByDepartmentId(request.departmentId())
            .orElseThrow(() -> badRequest("Unknown departmentId: " + request.departmentId()));
        if (!request.companyId().equals(department.getCompanyId())) {
            throw badRequest("departmentId does not belong to companyId: " + request.departmentId());
        }

        categoryRepository.findByCategoryId(request.categoryId())
            .orElseThrow(() -> badRequest("Unknown categoryId: " + request.categoryId()));

        DemoBudgetAccountJpaEntity budgetAccount = budgetAccountRepository.findByBudgetAccountId(request.budgetAccountId())
            .orElseThrow(() -> badRequest("Unknown budgetAccountId: " + request.budgetAccountId()));
        if (!budgetAccount.isActive() || !request.companyId().equals(budgetAccount.getCompanyId())) {
            throw badRequest("budgetAccountId does not belong to companyId: " + request.budgetAccountId());
        }
        if (!request.categoryId().equals(budgetAccount.getCategoryId())) {
            throw badRequest("budget account is not valid for categoryId: " + request.categoryId());
        }

        normalizedSupplierIds(request).forEach(value -> validateSupplier(value, request.categoryId()));
    }

    private void validateSupplier(String supplierId, String categoryId) {
        DemoSupplierJpaEntity supplier = supplierRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> badRequest("Unknown supplierId: " + supplierId));
        if (!"active".equals(supplier.getStatus())) {
            throw badRequest("supplierId is not active: " + supplierId);
        }
        if (!supplierCategoryRepository.existsBySupplierIdAndCategoryId(supplierId, categoryId)) {
            throw badRequest("supplierId does not support categoryId: " + categoryId);
        }
    }

    private List<PurchaseRequestLineJpaEntity> buildLines(
        String requestId,
        String categoryId,
        Collection<CreateDraftLineRequest> lines
    ) {
        int[] nextLineNo = {1};
        return lines.stream()
            .map(line -> {
                BigDecimal quantity = normalize(line.quantity());
                BigDecimal unitPrice = normalize(line.estimatedUnitPrice());
                BigDecimal calculatedAmount = normalize(quantity.multiply(unitPrice));
                if (normalize(line.estimatedAmount()).compareTo(calculatedAmount) != 0) {
                    throw badRequest("line estimatedAmount must equal quantity multiplied by estimatedUnitPrice");
                }
                return new PurchaseRequestLineJpaEntity(
                    requestId,
                    nextLineNo[0]++,
                    line.itemName().trim(),
                    blankToNull(line.specification()),
                    quantity,
                    line.unit().trim(),
                    unitPrice,
                    calculatedAmount,
                    categoryId);
            })
            .toList();
    }

    private String nextRequestId() {
        String prefix = "PR-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = purchaseRequestRepository.findFirstByRequestIdStartingWithOrderByRequestIdDesc(prefix)
            .map(PurchaseRequestJpaEntity::getRequestId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private List<String> normalizedSupplierIds(CreateDraftRequest request) {
        java.util.LinkedHashSet<String> supplierIds = new java.util.LinkedHashSet<>();
        String supplierId = blankToNull(request.supplierId());
        if (supplierId != null) {
            supplierIds.add(supplierId);
        }
        if (request.supplierIds() != null) {
            request.supplierIds().stream()
                .map(PurchaseRequestService::blankToNull)
                .filter(value -> value != null)
                .forEach(supplierIds::add);
        }
        return supplierIds.stream().toList();
    }

    private Map<String, Object> fieldSnapshot(CreateDraftRequest request, BigDecimal calculatedTotal, List<String> supplierIds) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("formVersion", "purchase-request-intake-v1");
        snapshot.put("companyId", request.companyId());
        snapshot.put("requesterId", request.requesterId());
        snapshot.put("departmentId", request.departmentId());
        snapshot.put("categoryId", request.categoryId());
        snapshot.put("budgetAccountId", request.budgetAccountId());
        snapshot.put("supplierId", supplierIds.isEmpty() ? null : supplierIds.get(0));
        snapshot.put("supplierIds", supplierIds);
        snapshot.put("title", request.title());
        snapshot.put("expectedDeliveryDate", request.expectedDeliveryDate().toString());
        snapshot.put("totalAmount", calculatedTotal);
        snapshot.put("currency", request.currency().trim().toUpperCase());
        snapshot.put("lineCount", request.lineItems().size());
        return snapshot;
    }

    private PurchaseRequestListItemResponse toListItemResponse(
        PurchaseRequestJpaEntity request,
        int lineCount,
        ApprovalSummaryResponse approval
    ) {
        return new PurchaseRequestListItemResponse(
            request.getRequestId(),
            request.getCompanyId(),
            request.getRequesterId(),
            request.getDepartmentId(),
            request.getCategoryId(),
            request.getBudgetAccountId(),
            request.getSupplierId(),
            supplierIdsFromSnapshot(request.getSupplierId(), fromJson(request.getFieldSnapshotJson())),
            request.getTitle(),
            request.getStatus(),
            request.getTotalAmount(),
            request.getCurrency(),
            request.getExpectedDeliveryDate(),
            request.getSubmittedAt(),
            request.getCreatedAt(),
            lineCount,
            approval);
    }

    private PurchaseRequestDetailResponse toDetailResponse(
        PurchaseRequestJpaEntity request,
        List<PurchaseRequestLineJpaEntity> lines,
        ApprovalSummaryResponse approval
    ) {
        Map<String, Object> fieldSnapshot = fromJson(request.getFieldSnapshotJson());
        return new PurchaseRequestDetailResponse(
            request.getRequestId(),
            request.getCompanyId(),
            request.getRequesterId(),
            request.getDepartmentId(),
            request.getCategoryId(),
            request.getBudgetAccountId(),
            request.getSupplierId(),
            supplierIdsFromSnapshot(request.getSupplierId(), fieldSnapshot),
            request.getTitle(),
            request.getDescription(),
            request.getStatus(),
            request.getTotalAmount(),
            request.getCurrency(),
            request.getExpectedDeliveryDate(),
            request.getSubmittedAt(),
            request.getCreatedAt(),
            request.getUpdatedAt(),
            fieldSnapshot,
            lines.stream().map(this::toLineResponse).toList(),
            approval);
    }

    private List<String> supplierIdsFromSnapshot(String supplierId, Map<String, Object> fieldSnapshot) {
        Object value = fieldSnapshot.get("supplierIds");
        if (value instanceof Collection<?> supplierIds) {
            List<String> normalized = supplierIds.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(PurchaseRequestService::blankToNull)
                .filter(item -> item != null)
                .distinct()
                .toList();
            if (!normalized.isEmpty()) {
                return normalized;
            }
        }
        String fallbackSupplierId = blankToNull(supplierId);
        return fallbackSupplierId == null ? List.of() : List.of(fallbackSupplierId);
    }

    private PurchaseRequestLineResponse toLineResponse(PurchaseRequestLineJpaEntity line) {
        return new PurchaseRequestLineResponse(
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            line.getQuantity(),
            line.getUnit(),
            line.getEstimatedUnitPrice(),
            line.getEstimatedAmount(),
            line.getCategoryId());
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize purchase request field snapshot", exception);
        }
    }

    private Map<String, Object> fromJson(String value) {
        try {
            return objectMapper.readValue(value, FIELD_SNAPSHOT_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to deserialize purchase request field snapshot", exception);
        }
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private static BigDecimal normalize(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
