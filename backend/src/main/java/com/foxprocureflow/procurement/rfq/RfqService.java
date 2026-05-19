package com.foxprocureflow.procurement.rfq;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierCategoryJpaEntity;
import com.foxprocureflow.identity.persistence.DemoSupplierCategoryRepository;
import com.foxprocureflow.identity.persistence.DemoSupplierJpaEntity;
import com.foxprocureflow.identity.persistence.DemoSupplierRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.procurement.approval.ApprovalInstanceJpaEntity;
import com.foxprocureflow.procurement.approval.ApprovalInstanceRepository;
import com.foxprocureflow.procurement.approval.ApprovalInstanceStatus;
import com.foxprocureflow.procurement.request.PurchaseRequestJpaEntity;
import com.foxprocureflow.procurement.request.PurchaseRequestLineJpaEntity;
import com.foxprocureflow.procurement.request.PurchaseRequestLineRepository;
import com.foxprocureflow.procurement.request.PurchaseRequestRepository;
import com.foxprocureflow.procurement.rfq.RfqDtos.CreateRfqRequest;
import com.foxprocureflow.procurement.rfq.RfqDtos.QuoteAttachmentRequest;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqComparisonRowResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqDetailResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqListItemResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqQuoteAttachmentResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqQuoteResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.RfqSupplierResponse;
import com.foxprocureflow.procurement.rfq.RfqDtos.UpsertQuoteRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RfqService {

    private static final TypeReference<Map<String, Object>> SNAPSHOT_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final RfqRepository rfqRepository;
    private final RfqSupplierRepository supplierRepository;
    private final RfqQuoteRepository quoteRepository;
    private final RfqQuoteAttachmentRepository attachmentRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestLineRepository lineRepository;
    private final ApprovalInstanceRepository approvalRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final DemoSupplierRepository demoSupplierRepository;
    private final DemoSupplierCategoryRepository supplierCategoryRepository;
    private final ObjectMapper objectMapper;

    public RfqService(
        RfqRepository rfqRepository,
        RfqSupplierRepository supplierRepository,
        RfqQuoteRepository quoteRepository,
        RfqQuoteAttachmentRepository attachmentRepository,
        PurchaseRequestRepository purchaseRequestRepository,
        PurchaseRequestLineRepository lineRepository,
        ApprovalInstanceRepository approvalRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        DemoSupplierRepository demoSupplierRepository,
        DemoSupplierCategoryRepository supplierCategoryRepository,
        ObjectMapper objectMapper
    ) {
        this.rfqRepository = rfqRepository;
        this.supplierRepository = supplierRepository;
        this.quoteRepository = quoteRepository;
        this.attachmentRepository = attachmentRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.lineRepository = lineRepository;
        this.approvalRepository = approvalRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.demoSupplierRepository = demoSupplierRepository;
        this.supplierCategoryRepository = supplierCategoryRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RfqDetailResponse create(CreateRfqRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.procurementUserId());

        PurchaseRequestJpaEntity purchaseRequest = purchaseRequestRepository.findByRequestId(request.requestId())
            .orElseThrow(() -> notFound("Unknown requestId: " + request.requestId()));
        if (!request.companyId().equals(purchaseRequest.getCompanyId())) {
            throw badRequest("requestId does not belong to companyId: " + request.companyId());
        }

        ApprovalInstanceJpaEntity approval = approvalRepository.findByRequestId(request.requestId())
            .orElseThrow(() -> badRequest("Purchase request has no approval instance: " + request.requestId()));
        if (!request.companyId().equals(approval.getCompanyId())) {
            throw badRequest("approval does not belong to companyId: " + request.companyId());
        }
        if (approval.getStatus() != ApprovalInstanceStatus.APPROVED) {
            throw badRequest("Purchase request approval is not APPROVED: " + request.requestId());
        }
        if (rfqRepository.existsByRequestId(request.requestId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RFQ already exists for requestId: " + request.requestId());
        }

        List<String> supplierIds = normalizedSupplierIds(request.supplierIds());
        List<PurchaseRequestLineJpaEntity> lines = lineRepository.findByRequestIdOrderByLineNoAsc(request.requestId());
        String rfqId = nextRfqId();
        String title = blankToNull(request.title()) == null
            ? defaultRfqTitle(purchaseRequest.getTitle())
            : request.title().trim();

        RfqJpaEntity rfq = rfqRepository.saveAndFlush(new RfqJpaEntity(
            rfqId,
            request.companyId(),
            purchaseRequest.getRequestId(),
            approval.getApprovalId(),
            purchaseRequest.getRequesterId(),
            request.procurementUserId(),
            purchaseRequest.getCategoryId(),
            purchaseRequest.getBudgetAccountId(),
            title,
            normalizeMoney(purchaseRequest.getTotalAmount()),
            purchaseRequest.getCurrency(),
            purchaseRequest.getExpectedDeliveryDate(),
            toJson(requestSnapshot(purchaseRequest, approval, lines))));

        List<RfqSupplierJpaEntity> suppliers = buildSuppliers(rfqId, purchaseRequest.getCategoryId(), supplierIds);
        supplierRepository.saveAll(suppliers);

        return toDetailResponse(rfq, suppliers, List.of(), Map.of());
    }

    @Transactional(readOnly = true)
    public List<RfqListItemResponse> list(String companyId, RfqStatus status) {
        requireCompany(companyId);
        List<RfqJpaEntity> rfqs = status == null
            ? rfqRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            : rfqRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status);
        if (rfqs.isEmpty()) {
            return List.of();
        }

        List<String> rfqIds = rfqs.stream().map(RfqJpaEntity::getRfqId).toList();
        Map<String, Long> supplierCounts = supplierRepository.findByRfqIdIn(rfqIds).stream()
            .collect(Collectors.groupingBy(RfqSupplierJpaEntity::getRfqId, Collectors.counting()));
        Map<String, Long> quoteCounts = quoteRepository.findByRfqIdIn(rfqIds).stream()
            .collect(Collectors.groupingBy(RfqQuoteJpaEntity::getRfqId, Collectors.counting()));

        return rfqs.stream()
            .map(rfq -> new RfqListItemResponse(
                rfq.getRfqId(),
                rfq.getCompanyId(),
                rfq.getRequestId(),
                rfq.getApprovalId(),
                rfq.getTitle(),
                rfq.getStatus(),
                rfq.getRequestTotalAmount(),
                rfq.getCurrency(),
                rfq.getExpectedDeliveryDate(),
                rfq.getRequesterId(),
                rfq.getProcurementUserId(),
                rfq.getCategoryId(),
                supplierCounts.getOrDefault(rfq.getRfqId(), 0L).intValue(),
                quoteCounts.getOrDefault(rfq.getRfqId(), 0L).intValue(),
                rfq.getCreatedAt(),
                rfq.getUpdatedAt()))
            .toList();
    }

    @Transactional(readOnly = true)
    public RfqDetailResponse detail(String rfqId, String companyId) {
        RfqJpaEntity rfq = requireRfq(rfqId);
        requireOptionalCompanyOwnership(rfq, companyId);
        List<RfqQuoteJpaEntity> quotes = quoteRepository.findByRfqIdOrderByCreatedAtAsc(rfqId);
        return toDetailResponse(
            rfq,
            supplierRepository.findByRfqIdOrderBySupplierNameAsc(rfqId),
            quotes,
            attachmentsByQuote(quotes));
    }

    @Transactional
    public RfqQuoteResponse upsertQuote(String rfqId, String supplierId, UpsertQuoteRequest request) {
        RfqJpaEntity rfq = requireRfq(rfqId);
        requireCompany(request.companyId());
        requireCompanyOwnership(rfq, request.companyId());
        requireUserInCompany(rfq.getCompanyId(), request.procurementUserId());
        RfqSupplierJpaEntity supplier = supplierRepository.findByRfqIdAndSupplierId(rfqId, supplierId)
            .orElseThrow(() -> badRequest("supplierId was not invited to rfqId: " + supplierId));
        validateQuotePayload(request);

        BigDecimal quoteAmount = normalizeMoney(request.quoteAmount());
        BigDecimal taxRate = normalizeRate(request.taxRate());
        BigDecimal taxAmount = normalizeMoney(quoteAmount.multiply(taxRate));
        BigDecimal totalAmount = normalizeMoney(quoteAmount.add(taxAmount));
        BigDecimal supplierScore = normalizeScore(request.supplierScore());

        RfqQuoteJpaEntity quote = quoteRepository.findByRfqIdAndSupplierId(rfqId, supplierId)
            .map(existing -> {
                existing.update(
                    quoteAmount,
                    taxRate,
                    taxAmount,
                    totalAmount,
                    request.deliveryDate(),
                    supplierScore,
                    blankToNull(request.riskNote()));
                return existing;
            })
            .orElseGet(() -> new RfqQuoteJpaEntity(
                nextQuoteId(rfqId),
                rfqId,
                supplierId,
                quoteAmount,
                taxRate,
                taxAmount,
                totalAmount,
                request.deliveryDate(),
                supplierScore,
                blankToNull(request.riskNote())));
        RfqQuoteJpaEntity savedQuote = quoteRepository.saveAndFlush(quote);
        replaceAttachments(savedQuote, request.attachments());
        refreshStatus(rfq);

        return toQuoteResponse(savedQuote, attachmentRepository.findByQuoteId(savedQuote.getQuoteId()));
    }

    @Transactional(readOnly = true)
    public List<RfqComparisonRowResponse> comparison(String rfqId, String companyId) {
        RfqJpaEntity rfq = requireRfq(rfqId);
        requireOptionalCompanyOwnership(rfq, companyId);
        List<RfqQuoteJpaEntity> quotes = quoteRepository.findByRfqIdOrderByCreatedAtAsc(rfqId);
        Map<String, RfqSupplierJpaEntity> suppliers = supplierRepository.findByRfqIdOrderBySupplierNameAsc(rfqId)
            .stream()
            .collect(Collectors.toMap(RfqSupplierJpaEntity::getSupplierId, Function.identity()));
        Map<String, List<RfqQuoteAttachmentJpaEntity>> attachmentsByQuote = attachmentsByQuote(quotes);
        Map<String, BigDecimal> scores = recommendationScores(quotes, suppliers);

        List<RfqQuoteJpaEntity> sorted = quotes.stream()
            .sorted(Comparator
                .comparing((RfqQuoteJpaEntity quote) -> scores.getOrDefault(quote.getQuoteId(), BigDecimal.ZERO))
                .reversed()
                .thenComparing(RfqQuoteJpaEntity::getTotalAmount)
                .thenComparing(RfqQuoteJpaEntity::getDeliveryDate)
                .thenComparing(quote -> suppliers.get(quote.getSupplierId()).getSupplierName()))
            .toList();

        int[] rank = {1};
        return sorted.stream()
            .map(quote -> {
                RfqSupplierJpaEntity supplier = suppliers.get(quote.getSupplierId());
                return new RfqComparisonRowResponse(
                    rank[0]++,
                    scores.get(quote.getQuoteId()),
                    supplier.getSupplierId(),
                    supplier.getSupplierName(),
                    supplier.getServiceScope(),
                    supplier.getRiskLevel(),
                    quote.getQuoteAmount(),
                    quote.getTaxRate(),
                    quote.getTaxAmount(),
                    quote.getTotalAmount(),
                    quote.getDeliveryDate(),
                    quote.getSupplierScore(),
                    quote.getRiskNote(),
                    attachmentsByQuote
                        .getOrDefault(quote.getQuoteId(), List.of())
                        .stream()
                        .map(this::toAttachmentResponse)
                        .toList());
            })
            .toList();
    }

    private List<String> normalizedSupplierIds(List<String> supplierIds) {
        List<String> normalized = supplierIds.stream()
            .map(String::trim)
            .toList();
        if (new HashSet<>(normalized).size() != normalized.size()) {
            throw badRequest("supplier selection must be unique");
        }
        return normalized;
    }

    private List<RfqSupplierJpaEntity> buildSuppliers(String rfqId, String categoryId, List<String> supplierIds) {
        Map<String, DemoSupplierJpaEntity> suppliers = supplierIds.stream()
            .map(supplierId -> demoSupplierRepository.findBySupplierId(supplierId)
                .orElseThrow(() -> badRequest("Unknown supplierId: " + supplierId)))
            .collect(Collectors.toMap(DemoSupplierJpaEntity::getSupplierId, Function.identity()));
        Map<String, List<String>> categoriesBySupplier = supplierCategoryRepository.findBySupplierIdIn(supplierIds)
            .stream()
            .collect(Collectors.groupingBy(
                DemoSupplierCategoryJpaEntity::getSupplierId,
                Collectors.mapping(DemoSupplierCategoryJpaEntity::getCategoryId, Collectors.toList())));

        return supplierIds.stream()
            .map(supplierId -> {
                DemoSupplierJpaEntity supplier = suppliers.get(supplierId);
                if (!"active".equals(supplier.getStatus())) {
                    throw badRequest("supplierId is not active: " + supplierId);
                }
                List<String> categoryCoverage = categoriesBySupplier.getOrDefault(supplierId, List.of());
                if (!categoryCoverage.contains(categoryId)) {
                    throw badRequest("supplierId does not support categoryId: " + categoryId);
                }
                return new RfqSupplierJpaEntity(
                    rfqId,
                    supplier.getSupplierId(),
                    supplier.getSupplierName(),
                    supplier.getServiceScope(),
                    supplier.getLocation(),
                    supplier.getRiskLevel(),
                    supplier.getSharedScope(),
                    toJson(categoryCoverage));
            })
            .toList();
    }

    private void validateQuotePayload(UpsertQuoteRequest request) {
        if (request.deliveryDate().isBefore(LocalDate.now())) {
            throw badRequest("deliveryDate must not be in the past");
        }
    }

    private void replaceAttachments(RfqQuoteJpaEntity quote, List<QuoteAttachmentRequest> attachments) {
        List<RfqQuoteAttachmentJpaEntity> existing = attachmentRepository.findByQuoteId(quote.getQuoteId());
        if (!existing.isEmpty()) {
            attachmentRepository.deleteAll(existing);
            attachmentRepository.flush();
        }
        if (attachments == null || attachments.isEmpty()) {
            return;
        }
        int[] index = {1};
        attachmentRepository.saveAll(attachments.stream()
            .map(attachment -> new RfqQuoteAttachmentJpaEntity(
                quote.getQuoteId() + "-A" + "%02d".formatted(index[0]++),
                quote.getQuoteId(),
                quote.getRfqId(),
                quote.getSupplierId(),
                attachment.fileName().trim(),
                blankToNull(attachment.description()),
                blankToNull(attachment.contentType()),
                attachment.sizeBytes(),
                null))
            .toList());
    }

    private void refreshStatus(RfqJpaEntity rfq) {
        int quoteCount = quoteRepository.findByRfqIdOrderByCreatedAtAsc(rfq.getRfqId()).size();
        rfq.markStatus(quoteCount >= 2 ? RfqStatus.COMPARISON_READY : RfqStatus.QUOTING);
        rfqRepository.save(rfq);
    }

    private RfqDetailResponse toDetailResponse(
        RfqJpaEntity rfq,
        List<RfqSupplierJpaEntity> suppliers,
        List<RfqQuoteJpaEntity> quotes,
        Map<String, List<RfqQuoteAttachmentJpaEntity>> attachmentsByQuote
    ) {
        return new RfqDetailResponse(
            rfq.getRfqId(),
            rfq.getCompanyId(),
            rfq.getRequestId(),
            rfq.getApprovalId(),
            rfq.getTitle(),
            rfq.getStatus(),
            rfq.getRequestTotalAmount(),
            rfq.getCurrency(),
            rfq.getExpectedDeliveryDate(),
            rfq.getRequesterId(),
            rfq.getProcurementUserId(),
            rfq.getCategoryId(),
            rfq.getBudgetAccountId(),
            fromSnapshotJson(rfq.getRequestSnapshotJson()),
            suppliers.stream().map(this::toSupplierResponse).toList(),
            quotes.stream()
                .map(quote -> toQuoteResponse(
                    quote,
                    attachmentsByQuote.getOrDefault(quote.getQuoteId(), List.of())))
                .toList(),
            rfq.getCreatedAt(),
            rfq.getUpdatedAt());
    }

    private RfqSupplierResponse toSupplierResponse(RfqSupplierJpaEntity supplier) {
        return new RfqSupplierResponse(
            supplier.getSupplierId(),
            supplier.getSupplierName(),
            supplier.getServiceScope(),
            supplier.getLocation(),
            supplier.getRiskLevel(),
            supplier.getSharedScope(),
            supplier.getStatus(),
            fromStringListJson(supplier.getCategoryCoverageJson()),
            supplier.getCreatedAt());
    }

    private RfqQuoteResponse toQuoteResponse(
        RfqQuoteJpaEntity quote,
        List<RfqQuoteAttachmentJpaEntity> attachments
    ) {
        return new RfqQuoteResponse(
            quote.getQuoteId(),
            quote.getRfqId(),
            quote.getSupplierId(),
            quote.getQuoteAmount(),
            quote.getTaxRate(),
            quote.getTaxAmount(),
            quote.getTotalAmount(),
            quote.getDeliveryDate(),
            quote.getSupplierScore(),
            quote.getRiskNote(),
            attachments.stream().map(this::toAttachmentResponse).toList(),
            quote.getCreatedAt(),
            quote.getUpdatedAt());
    }

    private RfqQuoteAttachmentResponse toAttachmentResponse(RfqQuoteAttachmentJpaEntity attachment) {
        return new RfqQuoteAttachmentResponse(
            attachment.getAttachmentId(),
            attachment.getFileName(),
            attachment.getDescription(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            attachment.getStorageObjectKey(),
            attachment.getCreatedAt());
    }

    private Map<String, Object> requestSnapshot(
        PurchaseRequestJpaEntity request,
        ApprovalInstanceJpaEntity approval,
        List<PurchaseRequestLineJpaEntity> lines
    ) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("snapshotVersion", "rfq-source-request-v1");
        snapshot.put("requestId", request.getRequestId());
        snapshot.put("approvalId", approval.getApprovalId());
        snapshot.put("approvalStatus", approval.getStatus());
        snapshot.put("companyId", request.getCompanyId());
        snapshot.put("requesterId", request.getRequesterId());
        snapshot.put("departmentId", request.getDepartmentId());
        snapshot.put("categoryId", request.getCategoryId());
        snapshot.put("budgetAccountId", request.getBudgetAccountId());
        snapshot.put("supplierId", request.getSupplierId());
        snapshot.put("title", request.getTitle());
        snapshot.put("description", request.getDescription());
        snapshot.put("totalAmount", request.getTotalAmount());
        snapshot.put("currency", request.getCurrency());
        snapshot.put("expectedDeliveryDate", request.getExpectedDeliveryDate().toString());
        snapshot.put("lineItems", lines.stream().map(this::lineSnapshot).toList());
        return snapshot;
    }

    private Map<String, Object> lineSnapshot(PurchaseRequestLineJpaEntity line) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("lineNo", line.getLineNo());
        snapshot.put("itemName", line.getItemName());
        snapshot.put("specification", line.getSpecification());
        snapshot.put("quantity", line.getQuantity());
        snapshot.put("unit", line.getUnit());
        snapshot.put("estimatedUnitPrice", line.getEstimatedUnitPrice());
        snapshot.put("estimatedAmount", line.getEstimatedAmount());
        snapshot.put("categoryId", line.getCategoryId());
        return snapshot;
    }

    private Map<String, List<RfqQuoteAttachmentJpaEntity>> attachmentsByQuote(List<RfqQuoteJpaEntity> quotes) {
        if (quotes.isEmpty()) {
            return Map.of();
        }
        return attachmentRepository.findByQuoteIdIn(quotes.stream()
                .map(RfqQuoteJpaEntity::getQuoteId)
                .toList())
            .stream()
            .collect(Collectors.groupingBy(RfqQuoteAttachmentJpaEntity::getQuoteId));
    }

    private Map<String, BigDecimal> recommendationScores(
        List<RfqQuoteJpaEntity> quotes,
        Map<String, RfqSupplierJpaEntity> suppliers
    ) {
        if (quotes.isEmpty()) {
            return Map.of();
        }
        BigDecimal minAmount = quotes.stream()
            .map(RfqQuoteJpaEntity::getTotalAmount)
            .min(Comparator.naturalOrder())
            .orElse(BigDecimal.ZERO);
        BigDecimal maxAmount = quotes.stream()
            .map(RfqQuoteJpaEntity::getTotalAmount)
            .max(Comparator.naturalOrder())
            .orElse(BigDecimal.ZERO);
        LocalDate minDelivery = quotes.stream()
            .map(RfqQuoteJpaEntity::getDeliveryDate)
            .min(Comparator.naturalOrder())
            .orElse(LocalDate.now());
        LocalDate maxDelivery = quotes.stream()
            .map(RfqQuoteJpaEntity::getDeliveryDate)
            .max(Comparator.naturalOrder())
            .orElse(LocalDate.now());

        return quotes.stream().collect(Collectors.toMap(
            RfqQuoteJpaEntity::getQuoteId,
            quote -> recommendationScore(quote, suppliers.get(quote.getSupplierId()), minAmount, maxAmount, minDelivery, maxDelivery)));
    }

    private BigDecimal recommendationScore(
        RfqQuoteJpaEntity quote,
        RfqSupplierJpaEntity supplier,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        LocalDate minDelivery,
        LocalDate maxDelivery
    ) {
        double priceScore = spreadScore(maxAmount.subtract(quote.getTotalAmount()), maxAmount.subtract(minAmount), 50.0);
        long maxDays = Math.max(0, ChronoUnit.DAYS.between(minDelivery, maxDelivery));
        long quoteDays = Math.max(0, ChronoUnit.DAYS.between(minDelivery, quote.getDeliveryDate()));
        double deliveryScore = maxDays == 0 ? 20.0 : ((double) (maxDays - quoteDays) / maxDays) * 20.0;
        double supplierScore = quote.getSupplierScore().doubleValue() / 100.0 * 20.0;
        double riskScore = switch (supplier.getRiskLevel()) {
            case "low" -> 10.0;
            case "medium" -> 5.0;
            default -> 0.0;
        };
        return BigDecimal.valueOf(priceScore + deliveryScore + supplierScore + riskScore)
            .setScale(2, RoundingMode.HALF_UP);
    }

    private double spreadScore(BigDecimal numerator, BigDecimal denominator, double maxScore) {
        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            return maxScore;
        }
        return numerator.divide(denominator, 6, RoundingMode.HALF_UP).doubleValue() * maxScore;
    }

    private RfqJpaEntity requireRfq(String rfqId) {
        return rfqRepository.findByRfqId(rfqId)
            .orElseThrow(() -> notFound("Unknown rfqId: " + rfqId));
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private void requireCompanyOwnership(RfqJpaEntity rfq, String companyId) {
        if (!rfq.getCompanyId().equals(companyId)) {
            throw badRequest("rfqId does not belong to companyId: " + companyId);
        }
    }

    private void requireOptionalCompanyOwnership(RfqJpaEntity rfq, String companyId) {
        if (companyId == null || companyId.isBlank()) {
            return;
        }
        requireCompany(companyId);
        requireCompanyOwnership(rfq, companyId);
    }

    private void requireUserInCompany(String companyId, String userId) {
        DemoUserJpaEntity user = userRepository.findByUserId(userId)
            .orElseThrow(() -> badRequest("Unknown procurementUserId: " + userId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw badRequest("procurementUserId does not belong to companyId: " + userId);
        }
    }

    private String nextRfqId() {
        String prefix = "RFQ-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = rfqRepository.findFirstByRfqIdStartingWithOrderByRfqIdDesc(prefix)
            .map(RfqJpaEntity::getRfqId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String nextQuoteId(String rfqId) {
        int nextSequence = quoteRepository.findByRfqIdOrderByCreatedAtAsc(rfqId).size() + 1;
        return rfqId + "-Q" + "%02d".formatted(nextSequence);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize RFQ data", exception);
        }
    }

    private Map<String, Object> fromSnapshotJson(String value) {
        try {
            return objectMapper.readValue(value, SNAPSHOT_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to deserialize RFQ request snapshot", exception);
        }
    }

    private List<String> fromStringListJson(String value) {
        try {
            return objectMapper.readValue(value, STRING_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to deserialize RFQ supplier categories", exception);
        }
    }

    private static BigDecimal normalizeMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeRate(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeScore(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String defaultRfqTitle(String purchaseRequestTitle) {
        String normalizedTitle = purchaseRequestTitle.trim();
        if (normalizedTitle.endsWith("询价")) {
            return normalizedTitle;
        }
        return normalizedTitle + "询价";
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
