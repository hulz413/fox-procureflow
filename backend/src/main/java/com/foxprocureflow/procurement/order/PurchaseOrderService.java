package com.foxprocureflow.procurement.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.procurement.approval.ApprovalInstanceJpaEntity;
import com.foxprocureflow.procurement.approval.ApprovalInstanceRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.CancelPurchaseOrderRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.CreatePurchaseOrderRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderActionRequest;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderDeliveryScheduleResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderDetailResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderLineResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderListItemResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderDtos.PurchaseOrderStatusRecordResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestJpaEntity;
import com.foxprocureflow.procurement.request.PurchaseRequestLineJpaEntity;
import com.foxprocureflow.procurement.request.PurchaseRequestLineRepository;
import com.foxprocureflow.procurement.request.PurchaseRequestRepository;
import com.foxprocureflow.procurement.rfq.RfqJpaEntity;
import com.foxprocureflow.procurement.rfq.RfqQuoteJpaEntity;
import com.foxprocureflow.procurement.rfq.RfqQuoteRepository;
import com.foxprocureflow.procurement.rfq.RfqRepository;
import com.foxprocureflow.procurement.rfq.RfqStatus;
import com.foxprocureflow.procurement.rfq.RfqSupplierJpaEntity;
import com.foxprocureflow.procurement.rfq.RfqSupplierRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
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
public class PurchaseOrderService {

    private static final TypeReference<Map<String, Object>> SNAPSHOT_TYPE = new TypeReference<>() {
    };

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderLineRepository lineRepository;
    private final PurchaseOrderDeliveryScheduleRepository scheduleRepository;
    private final PurchaseOrderStatusRecordRepository statusRecordRepository;
    private final RfqRepository rfqRepository;
    private final RfqQuoteRepository quoteRepository;
    private final RfqSupplierRepository supplierRepository;
    private final PurchaseRequestRepository requestRepository;
    private final PurchaseRequestLineRepository requestLineRepository;
    private final ApprovalInstanceRepository approvalRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final ObjectMapper objectMapper;

    public PurchaseOrderService(
        PurchaseOrderRepository purchaseOrderRepository,
        PurchaseOrderLineRepository lineRepository,
        PurchaseOrderDeliveryScheduleRepository scheduleRepository,
        PurchaseOrderStatusRecordRepository statusRecordRepository,
        RfqRepository rfqRepository,
        RfqQuoteRepository quoteRepository,
        RfqSupplierRepository supplierRepository,
        PurchaseRequestRepository requestRepository,
        PurchaseRequestLineRepository requestLineRepository,
        ApprovalInstanceRepository approvalRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        ObjectMapper objectMapper
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.lineRepository = lineRepository;
        this.scheduleRepository = scheduleRepository;
        this.statusRecordRepository = statusRecordRepository;
        this.rfqRepository = rfqRepository;
        this.quoteRepository = quoteRepository;
        this.supplierRepository = supplierRepository;
        this.requestRepository = requestRepository;
        this.requestLineRepository = requestLineRepository;
        this.approvalRepository = approvalRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PurchaseOrderDetailResponse create(CreatePurchaseOrderRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.procurementUserId(), "procurementUserId");
        validateDeliverySchedule(request.plannedDeliveryDate());

        RfqJpaEntity rfq = requireRfq(request.rfqId());
        requireCompanyOwnership(rfq, request.companyId());
        if (rfq.getStatus() != RfqStatus.COMPARISON_READY) {
            throw badRequest("RFQ is not COMPARISON_READY: " + request.rfqId());
        }
        if (purchaseOrderRepository.existsByRfqId(request.rfqId())) {
            throw conflict("Purchase order already exists for rfqId: " + request.rfqId());
        }

        RfqQuoteJpaEntity quote = quoteRepository.findByQuoteId(request.quoteId())
            .orElseThrow(() -> notFound("Unknown quoteId: " + request.quoteId()));
        if (!request.rfqId().equals(quote.getRfqId())) {
            throw badRequest("quoteId does not belong to rfqId: " + request.rfqId());
        }
        RfqSupplierJpaEntity supplier = supplierRepository.findByRfqIdAndSupplierId(request.rfqId(), quote.getSupplierId())
            .orElseThrow(() -> badRequest("quote supplier was not invited to rfqId: " + quote.getSupplierId()));

        PurchaseRequestJpaEntity purchaseRequest = requestRepository.findByRequestId(rfq.getRequestId())
            .orElseThrow(() -> notFound("Unknown requestId: " + rfq.getRequestId()));
        ApprovalInstanceJpaEntity approval = approvalRepository.findByRequestId(rfq.getRequestId())
            .orElseThrow(() -> badRequest("Purchase request has no approval instance: " + rfq.getRequestId()));
        List<PurchaseRequestLineJpaEntity> requestLines = requestLineRepository.findByRequestIdOrderByLineNoAsc(rfq.getRequestId());
        if (requestLines.isEmpty()) {
            throw badRequest("Purchase request has no line items: " + rfq.getRequestId());
        }

        String poId = nextPoId();
        PurchaseOrderJpaEntity purchaseOrder = purchaseOrderRepository.saveAndFlush(new PurchaseOrderJpaEntity(
            poId,
            request.companyId(),
            rfq.getRfqId(),
            quote.getQuoteId(),
            rfq.getRequestId(),
            rfq.getApprovalId(),
            rfq.getRequesterId(),
            request.procurementUserId(),
            supplier.getSupplierId(),
            supplier.getSupplierName(),
            supplier.getServiceScope(),
            supplier.getRiskLevel(),
            rfq.getCategoryId(),
            rfq.getBudgetAccountId(),
            "PO - " + rfq.getTitle(),
            normalizeMoney(quote.getQuoteAmount()),
            normalizeRate(quote.getTaxRate()),
            normalizeMoney(quote.getTaxAmount()),
            normalizeMoney(quote.getTotalAmount()),
            rfq.getCurrency(),
            rfq.getExpectedDeliveryDate(),
            quote.getDeliveryDate(),
            quote.getUpdatedAt(),
            toJson(upstreamSnapshot(rfq, quote, supplier, purchaseRequest, approval, requestLines))));

        List<PurchaseOrderLineJpaEntity> lines = lineRepository.saveAll(requestLines.stream()
            .sorted(Comparator.comparing(PurchaseRequestLineJpaEntity::getLineNo))
            .map(line -> toPurchaseOrderLine(poId, line))
            .toList());
        PurchaseOrderDeliveryScheduleJpaEntity schedule = scheduleRepository.save(new PurchaseOrderDeliveryScheduleJpaEntity(
            poId + "-D01",
            poId,
            request.plannedDeliveryDate(),
            request.deliveryLocation().trim(),
            request.contactPerson().trim(),
            request.contactPhone().trim(),
            blankToNull(request.deliveryNote())));
        PurchaseOrderStatusRecordJpaEntity record = statusRecordRepository.save(new PurchaseOrderStatusRecordJpaEntity(
            nextRecordId(poId),
            poId,
            request.companyId(),
            request.procurementUserId(),
            PurchaseOrderAction.CREATED,
            null,
            PurchaseOrderStatus.DRAFT,
            "Created from RFQ " + rfq.getRfqId() + " quote " + quote.getQuoteId()));

        return toDetailResponse(purchaseOrder, lines, schedule, List.of(record));
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderListItemResponse> list(String companyId, PurchaseOrderStatus status) {
        requireCompany(companyId);
        List<PurchaseOrderJpaEntity> purchaseOrders = status == null
            ? purchaseOrderRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            : purchaseOrderRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status);
        if (purchaseOrders.isEmpty()) {
            return List.of();
        }

        Map<String, PurchaseOrderDeliveryScheduleJpaEntity> schedules = scheduleRepository.findByPoIdIn(purchaseOrders.stream()
                .map(PurchaseOrderJpaEntity::getPoId)
                .toList())
            .stream()
            .collect(Collectors.toMap(PurchaseOrderDeliveryScheduleJpaEntity::getPoId, Function.identity()));

        return purchaseOrders.stream()
            .map(purchaseOrder -> toListItemResponse(purchaseOrder, schedules.get(purchaseOrder.getPoId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDetailResponse detail(String poId, String companyId) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
        requireOptionalCompanyOwnership(purchaseOrder, companyId);
        return toDetailResponse(
            purchaseOrder,
            lineRepository.findByPoIdOrderByLineNoAsc(poId),
            requireSchedule(poId),
            statusRecordRepository.findByPoIdOrderByCreatedAtAsc(poId));
    }

    @Transactional
    public PurchaseOrderDetailResponse publish(String poId, PurchaseOrderActionRequest request) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
        requireCompany(request.companyId());
        requireCompanyOwnership(purchaseOrder, request.companyId());
        requireUserInCompany(purchaseOrder.getCompanyId(), request.actorId(), "actorId");
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw conflict("Only DRAFT purchase orders can be published: " + poId);
        }
        PurchaseOrderStatus fromStatus = purchaseOrder.getStatus();
        purchaseOrder.publish();
        purchaseOrderRepository.saveAndFlush(purchaseOrder);
        statusRecordRepository.save(new PurchaseOrderStatusRecordJpaEntity(
            nextRecordId(poId),
            poId,
            purchaseOrder.getCompanyId(),
            request.actorId(),
            PurchaseOrderAction.PUBLISHED,
            fromStatus,
            PurchaseOrderStatus.ISSUED,
            blankToNull(request.comment())));

        return detail(poId, purchaseOrder.getCompanyId());
    }

    @Transactional
    public PurchaseOrderDetailResponse cancel(String poId, CancelPurchaseOrderRequest request) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
        requireCompany(request.companyId());
        requireCompanyOwnership(purchaseOrder, request.companyId());
        requireUserInCompany(purchaseOrder.getCompanyId(), request.actorId(), "actorId");
        if (purchaseOrder.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw conflict("Purchase order is already CANCELLED: " + poId);
        }
        PurchaseOrderStatus fromStatus = purchaseOrder.getStatus();
        purchaseOrder.cancel();
        purchaseOrderRepository.saveAndFlush(purchaseOrder);
        statusRecordRepository.save(new PurchaseOrderStatusRecordJpaEntity(
            nextRecordId(poId),
            poId,
            purchaseOrder.getCompanyId(),
            request.actorId(),
            PurchaseOrderAction.CANCELLED,
            fromStatus,
            PurchaseOrderStatus.CANCELLED,
            request.reason().trim()));

        return detail(poId, purchaseOrder.getCompanyId());
    }

    private PurchaseOrderLineJpaEntity toPurchaseOrderLine(String poId, PurchaseRequestLineJpaEntity line) {
        BigDecimal estimatedUnitPrice = normalizeMoney(line.getEstimatedUnitPrice());
        BigDecimal estimatedAmount = normalizeMoney(line.getEstimatedAmount());
        return new PurchaseOrderLineJpaEntity(
            poId + "-L" + "%02d".formatted(line.getLineNo()),
            poId,
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            normalizeQuantity(line.getQuantity()),
            line.getUnit(),
            line.getCategoryId(),
            estimatedUnitPrice,
            estimatedAmount,
            estimatedUnitPrice,
            estimatedAmount);
    }

    private PurchaseOrderListItemResponse toListItemResponse(
        PurchaseOrderJpaEntity purchaseOrder,
        PurchaseOrderDeliveryScheduleJpaEntity schedule
    ) {
        return new PurchaseOrderListItemResponse(
            purchaseOrder.getPoId(),
            purchaseOrder.getCompanyId(),
            purchaseOrder.getRfqId(),
            purchaseOrder.getQuoteId(),
            purchaseOrder.getRequestId(),
            purchaseOrder.getApprovalId(),
            purchaseOrder.getTitle(),
            purchaseOrder.getStatus(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getProcurementUserId(),
            purchaseOrder.getCategoryId(),
            purchaseOrder.getQuoteAmount(),
            purchaseOrder.getTaxAmount(),
            purchaseOrder.getTotalAmount(),
            purchaseOrder.getCurrency(),
            purchaseOrder.getExpectedDeliveryDate(),
            schedule == null ? null : schedule.getPlannedDeliveryDate(),
            purchaseOrder.getCreatedAt(),
            purchaseOrder.getUpdatedAt(),
            purchaseOrder.getIssuedAt(),
            purchaseOrder.getCancelledAt());
    }

    private PurchaseOrderDetailResponse toDetailResponse(
        PurchaseOrderJpaEntity purchaseOrder,
        List<PurchaseOrderLineJpaEntity> lines,
        PurchaseOrderDeliveryScheduleJpaEntity schedule,
        List<PurchaseOrderStatusRecordJpaEntity> records
    ) {
        return new PurchaseOrderDetailResponse(
            purchaseOrder.getPoId(),
            purchaseOrder.getCompanyId(),
            purchaseOrder.getRfqId(),
            purchaseOrder.getQuoteId(),
            purchaseOrder.getRequestId(),
            purchaseOrder.getApprovalId(),
            purchaseOrder.getRequesterId(),
            purchaseOrder.getProcurementUserId(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getSupplierServiceScope(),
            purchaseOrder.getSupplierRiskLevel(),
            purchaseOrder.getCategoryId(),
            purchaseOrder.getBudgetAccountId(),
            purchaseOrder.getTitle(),
            purchaseOrder.getStatus(),
            purchaseOrder.getQuoteAmount(),
            purchaseOrder.getTaxRate(),
            purchaseOrder.getTaxAmount(),
            purchaseOrder.getTotalAmount(),
            purchaseOrder.getCurrency(),
            purchaseOrder.getExpectedDeliveryDate(),
            purchaseOrder.getQuoteDeliveryDate(),
            purchaseOrder.getQuoteUpdatedAt(),
            fromSnapshotJson(purchaseOrder.getUpstreamSnapshotJson()),
            lines.stream().map(this::toLineResponse).toList(),
            toScheduleResponse(schedule),
            records.stream().map(this::toStatusRecordResponse).toList(),
            purchaseOrder.getCreatedAt(),
            purchaseOrder.getUpdatedAt(),
            purchaseOrder.getIssuedAt(),
            purchaseOrder.getCancelledAt());
    }

    private PurchaseOrderLineResponse toLineResponse(PurchaseOrderLineJpaEntity line) {
        return new PurchaseOrderLineResponse(
            line.getLineId(),
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            line.getQuantity(),
            line.getUnit(),
            line.getCategoryId(),
            line.getEstimatedUnitPrice(),
            line.getEstimatedAmount(),
            line.getConfirmedUnitPrice(),
            line.getConfirmedAmount());
    }

    private PurchaseOrderDeliveryScheduleResponse toScheduleResponse(PurchaseOrderDeliveryScheduleJpaEntity schedule) {
        return new PurchaseOrderDeliveryScheduleResponse(
            schedule.getScheduleId(),
            schedule.getPlannedDeliveryDate(),
            schedule.getDeliveryLocation(),
            schedule.getContactPerson(),
            schedule.getContactPhone(),
            schedule.getDeliveryNote(),
            schedule.getCreatedAt(),
            schedule.getUpdatedAt());
    }

    private PurchaseOrderStatusRecordResponse toStatusRecordResponse(PurchaseOrderStatusRecordJpaEntity record) {
        return new PurchaseOrderStatusRecordResponse(
            record.getRecordId(),
            record.getActorId(),
            record.getAction(),
            record.getFromStatus(),
            record.getToStatus(),
            record.getComment(),
            record.getCreatedAt());
    }

    private Map<String, Object> upstreamSnapshot(
        RfqJpaEntity rfq,
        RfqQuoteJpaEntity quote,
        RfqSupplierJpaEntity supplier,
        PurchaseRequestJpaEntity request,
        ApprovalInstanceJpaEntity approval,
        List<PurchaseRequestLineJpaEntity> lines
    ) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("snapshotVersion", "purchase-order-source-v1");
        snapshot.put("rfq", Map.of(
            "rfqId", rfq.getRfqId(),
            "status", rfq.getStatus(),
            "title", rfq.getTitle(),
            "requestSnapshot", fromSnapshotJson(rfq.getRequestSnapshotJson())));
        snapshot.put("quote", Map.of(
            "quoteId", quote.getQuoteId(),
            "supplierId", quote.getSupplierId(),
            "quoteAmount", quote.getQuoteAmount(),
            "taxRate", quote.getTaxRate(),
            "taxAmount", quote.getTaxAmount(),
            "totalAmount", quote.getTotalAmount(),
            "deliveryDate", quote.getDeliveryDate().toString(),
            "updatedAt", quote.getUpdatedAt().toString()));
        snapshot.put("supplier", Map.of(
            "supplierId", supplier.getSupplierId(),
            "supplierName", supplier.getSupplierName(),
            "serviceScope", supplier.getServiceScope(),
            "riskLevel", supplier.getRiskLevel()));
        Map<String, Object> requestSnapshot = new LinkedHashMap<>();
        requestSnapshot.put("requestId", request.getRequestId());
        requestSnapshot.put("companyId", request.getCompanyId());
        requestSnapshot.put("requesterId", request.getRequesterId());
        requestSnapshot.put("departmentId", request.getDepartmentId());
        requestSnapshot.put("categoryId", request.getCategoryId());
        requestSnapshot.put("budgetAccountId", request.getBudgetAccountId());
        requestSnapshot.put("title", request.getTitle());
        requestSnapshot.put("totalAmount", request.getTotalAmount());
        requestSnapshot.put("currency", request.getCurrency());
        requestSnapshot.put("expectedDeliveryDate", request.getExpectedDeliveryDate().toString());
        requestSnapshot.put("lineItems", lines.stream().map(this::lineSnapshot).toList());
        snapshot.put("request", requestSnapshot);
        snapshot.put("approval", Map.of(
            "approvalId", approval.getApprovalId(),
            "status", approval.getStatus()));
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

    private RfqJpaEntity requireRfq(String rfqId) {
        return rfqRepository.findByRfqId(rfqId)
            .orElseThrow(() -> notFound("Unknown rfqId: " + rfqId));
    }

    private PurchaseOrderJpaEntity requirePurchaseOrder(String poId) {
        return purchaseOrderRepository.findByPoId(poId)
            .orElseThrow(() -> notFound("Unknown poId: " + poId));
    }

    private PurchaseOrderDeliveryScheduleJpaEntity requireSchedule(String poId) {
        return scheduleRepository.findByPoId(poId)
            .orElseThrow(() -> notFound("Unknown delivery schedule for poId: " + poId));
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

    private void requireCompanyOwnership(PurchaseOrderJpaEntity purchaseOrder, String companyId) {
        if (!purchaseOrder.getCompanyId().equals(companyId)) {
            throw badRequest("poId does not belong to companyId: " + companyId);
        }
    }

    private void requireOptionalCompanyOwnership(PurchaseOrderJpaEntity purchaseOrder, String companyId) {
        if (companyId == null || companyId.isBlank()) {
            return;
        }
        requireCompany(companyId);
        requireCompanyOwnership(purchaseOrder, companyId);
    }

    private void requireUserInCompany(String companyId, String userId, String fieldName) {
        DemoUserJpaEntity user = userRepository.findByUserId(userId)
            .orElseThrow(() -> badRequest("Unknown " + fieldName + ": " + userId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw badRequest(fieldName + " does not belong to companyId: " + userId);
        }
    }

    private void validateDeliverySchedule(LocalDate plannedDeliveryDate) {
        if (plannedDeliveryDate.isBefore(LocalDate.now())) {
            throw badRequest("plannedDeliveryDate must not be in the past");
        }
    }

    private String nextPoId() {
        String prefix = "PO-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = purchaseOrderRepository.findFirstByPoIdStartingWithOrderByPoIdDesc(prefix)
            .map(PurchaseOrderJpaEntity::getPoId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String nextRecordId(String poId) {
        int nextSequence = statusRecordRepository.findByPoIdOrderByCreatedAtAsc(poId).size() + 1;
        return poId + "-R" + "%02d".formatted(nextSequence);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize purchase order data", exception);
        }
    }

    private Map<String, Object> fromSnapshotJson(String value) {
        try {
            return objectMapper.readValue(value, SNAPSHOT_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to deserialize purchase order snapshot", exception);
        }
    }

    private static BigDecimal normalizeMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeQuantity(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeRate(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP);
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

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private static ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
