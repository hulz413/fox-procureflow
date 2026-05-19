package com.foxprocureflow.matching;

import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.HandleMatchActionRequest;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchActionResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchDetailResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchDifferenceResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchInvoiceSummary;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchLineResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchListItemResponse;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchPurchaseOrderSummary;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.MatchReceiptSummary;
import com.foxprocureflow.matching.ThreeWayMatchingDtos.RecalculateMatchRequest;
import com.foxprocureflow.procurement.execution.PurchaseReceiptJpaEntity;
import com.foxprocureflow.procurement.execution.PurchaseReceiptLineJpaEntity;
import com.foxprocureflow.procurement.execution.PurchaseReceiptLineRepository;
import com.foxprocureflow.procurement.execution.PurchaseReceiptRepository;
import com.foxprocureflow.procurement.execution.SupplierInvoiceJpaEntity;
import com.foxprocureflow.procurement.execution.SupplierInvoiceLineJpaEntity;
import com.foxprocureflow.procurement.execution.SupplierInvoiceLineRepository;
import com.foxprocureflow.procurement.execution.SupplierInvoiceRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderJpaEntity;
import com.foxprocureflow.procurement.order.PurchaseOrderLineJpaEntity;
import com.foxprocureflow.procurement.order.PurchaseOrderLineRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ThreeWayMatchingService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final ThreeWayMatchResultRepository resultRepository;
    private final ThreeWayMatchDifferenceRepository differenceRepository;
    private final ThreeWayMatchActionRepository actionRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderLineRepository purchaseOrderLineRepository;
    private final PurchaseReceiptRepository receiptRepository;
    private final PurchaseReceiptLineRepository receiptLineRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final SupplierInvoiceLineRepository invoiceLineRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;

    public ThreeWayMatchingService(
        ThreeWayMatchResultRepository resultRepository,
        ThreeWayMatchDifferenceRepository differenceRepository,
        ThreeWayMatchActionRepository actionRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        PurchaseOrderLineRepository purchaseOrderLineRepository,
        PurchaseReceiptRepository receiptRepository,
        PurchaseReceiptLineRepository receiptLineRepository,
        SupplierInvoiceRepository invoiceRepository,
        SupplierInvoiceLineRepository invoiceLineRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository
    ) {
        this.resultRepository = resultRepository;
        this.differenceRepository = differenceRepository;
        this.actionRepository = actionRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderLineRepository = purchaseOrderLineRepository;
        this.receiptRepository = receiptRepository;
        this.receiptLineRepository = receiptLineRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineRepository = invoiceLineRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MatchListItemResponse> list(String companyId, ThreeWayMatchStatus status) {
        requireCompany(companyId);
        List<ThreeWayMatchResultJpaEntity> results = status == null
            ? resultRepository.findByCompanyIdOrderByUpdatedAtDesc(companyId)
            : resultRepository.findByCompanyIdAndStatusOrderByUpdatedAtDesc(companyId, status);
        return results.stream().map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public List<MatchListItemResponse> exceptions(String companyId) {
        requireCompany(companyId);
        return resultRepository.findByCompanyIdAndStatusOrderByUpdatedAtDesc(companyId, ThreeWayMatchStatus.EXCEPTION).stream()
            .sorted(Comparator
                .comparing((ThreeWayMatchResultJpaEntity result) -> severityRank(result.getHighestSeverity())).reversed()
                .thenComparing(ThreeWayMatchResultJpaEntity::getUpdatedAt, Comparator.reverseOrder()))
            .map(this::toListItem)
            .toList();
    }

    @Transactional(readOnly = true)
    public MatchDetailResponse detail(String matchId, String companyId) {
        ThreeWayMatchResultJpaEntity result = requireMatch(matchId);
        requireOptionalCompanyOwnership(result.getCompanyId(), companyId, "matchId");
        return toDetail(result);
    }

    @Transactional
    public MatchDetailResponse recalculate(RecalculateMatchRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.actorId(), "actorId");
        return recalculateForPo(request.companyId(), request.poId());
    }

    @Transactional
    public MatchDetailResponse recalculateForPo(String companyId, String poId) {
        requireCompany(companyId);
        PurchaseOrderJpaEntity purchaseOrder = requireIssuedPurchaseOrder(poId, companyId);
        List<PurchaseOrderLineJpaEntity> poLines = purchaseOrderLineRepository.findByPoIdOrderByLineNoAsc(poId);
        List<PurchaseReceiptJpaEntity> receipts = receiptRepository.findByPoIdOrderByCreatedAtAsc(poId);
        List<PurchaseReceiptLineJpaEntity> receiptLines = receiptLineRepository.findByPoIdOrderByLineNoAsc(poId);
        List<SupplierInvoiceJpaEntity> invoices = invoiceRepository.findByPoIdOrderByCreatedAtAsc(poId);
        List<SupplierInvoiceLineJpaEntity> invoiceLines = invoiceLineRepository.findByPoIdOrderByLineNoAsc(poId);

        Map<String, BigDecimal> receivedByLine = sumReceiptQuantities(receiptLines);
        Map<String, BigDecimal> invoicedByLine = sumInvoiceQuantities(invoiceLines);
        BigDecimal orderedTotalQuantity = sumQuantity(poLines.stream().map(PurchaseOrderLineJpaEntity::getQuantity).toList());
        BigDecimal receivedTotalQuantity = sumQuantity(receiptLines.stream().map(PurchaseReceiptLineJpaEntity::getReceivedQuantity).toList());
        BigDecimal invoicedTotalQuantity = sumQuantity(invoiceLines.stream().map(SupplierInvoiceLineJpaEntity::getInvoicedQuantity).toList());
        BigDecimal invoiceTotalAmount = sumMoney(invoices.stream().map(SupplierInvoiceJpaEntity::getTotalAmount).toList());
        BigDecimal poTotalAmount = normalizeMoney(purchaseOrder.getTotalAmount());
        BigDecimal invoiceVarianceAmount = normalizeMoney(invoiceTotalAmount.subtract(poTotalAmount));

        ThreeWayMatchResultJpaEntity result = resultRepository.findByPoId(poId)
            .orElseGet(() -> new ThreeWayMatchResultJpaEntity(nextMatchId(), companyId, poId));
        String matchId = result.getMatchId();

        List<DifferenceDraft> differenceDrafts = buildDifferenceDrafts(
            matchId,
            purchaseOrder,
            poLines,
            receivedByLine,
            invoicedByLine,
            invoiceTotalAmount,
            invoiceVarianceAmount);
        ThreeWayMatchStatus status = statusFor(receipts, invoices, differenceDrafts);
        ThreeWayMatchSeverity highestSeverity = highestSeverity(differenceDrafts);

        result.updateCalculated(
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getTitle(),
            status,
            poTotalAmount,
            orderedTotalQuantity,
            receivedTotalQuantity,
            invoicedTotalQuantity,
            invoiceTotalAmount,
            invoiceVarianceAmount,
            purchaseOrder.getCurrency(),
            differenceDrafts.size(),
            highestSeverity);
        ThreeWayMatchResultJpaEntity saved = resultRepository.saveAndFlush(result);

        differenceRepository.deleteByMatchId(saved.getMatchId());
        differenceRepository.flush();
        List<ThreeWayMatchDifferenceJpaEntity> differences = new ArrayList<>();
        for (int index = 0; index < differenceDrafts.size(); index++) {
            differences.add(differenceDrafts.get(index).toEntity(saved.getMatchId() + "-D" + "%02d".formatted(index + 1)));
        }
        differenceRepository.saveAll(differences);
        return toDetail(saved);
    }

    @Transactional
    public MatchDetailResponse handleAction(String matchId, HandleMatchActionRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.actorId(), "actorId");
        ThreeWayMatchResultJpaEntity result = requireMatch(matchId);
        requireCompanyOwnership(result.getCompanyId(), request.companyId(), "matchId");
        String note = normalizeNote(request.note());

        switch (request.actionType()) {
            case ACKNOWLEDGE, MARK_IN_PROGRESS -> {
                if (result.getStatus() != ThreeWayMatchStatus.EXCEPTION) {
                    throw conflict("Only EXCEPTION matching results can be handled: " + matchId);
                }
            }
            case RESOLVE -> {
                if (result.getStatus() != ThreeWayMatchStatus.EXCEPTION) {
                    throw conflict("Only EXCEPTION matching results can be resolved: " + matchId);
                }
                result.updateStatus(ThreeWayMatchStatus.RESOLVED);
                resultRepository.save(result);
            }
            case REOPEN -> {
                if (result.getStatus() != ThreeWayMatchStatus.RESOLVED) {
                    throw conflict("Only RESOLVED matching results can be reopened: " + matchId);
                }
                if (result.getDifferenceCount() == 0) {
                    throw conflict("Cannot reopen a matching result without current differences: " + matchId);
                }
                result.updateStatus(ThreeWayMatchStatus.EXCEPTION);
                resultRepository.save(result);
            }
            default -> throw badRequest("Unsupported matching action: " + request.actionType());
        }

        actionRepository.save(new ThreeWayMatchActionJpaEntity(
            nextActionId(),
            matchId,
            request.companyId(),
            request.actionType(),
            request.actorId(),
            note));
        return toDetail(resultRepository.findByMatchId(matchId).orElse(result));
    }

    private List<DifferenceDraft> buildDifferenceDrafts(
        String matchId,
        PurchaseOrderJpaEntity purchaseOrder,
        List<PurchaseOrderLineJpaEntity> poLines,
        Map<String, BigDecimal> receivedByLine,
        Map<String, BigDecimal> invoicedByLine,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceVarianceAmount
    ) {
        List<DifferenceDraft> differences = new ArrayList<>();
        for (PurchaseOrderLineJpaEntity line : poLines) {
            BigDecimal ordered = normalizeQuantity(line.getQuantity());
            BigDecimal received = normalizeQuantity(receivedByLine.getOrDefault(line.getLineId(), ZERO));
            BigDecimal invoiced = normalizeQuantity(invoicedByLine.getOrDefault(line.getLineId(), ZERO));
            if (invoiced.compareTo(ZERO) > 0 && received.compareTo(ZERO) == 0) {
                differences.add(DifferenceDraft.line(
                    matchId,
                    purchaseOrder,
                    line,
                    ThreeWayMatchDifferenceType.MISSING_RECEIPT,
                    ThreeWayMatchSeverity.HIGH,
                    ordered,
                    received,
                    invoiced,
                    "已开票但未登记对应收货"));
            } else if (invoiced.compareTo(received) > 0) {
                differences.add(DifferenceDraft.line(
                    matchId,
                    purchaseOrder,
                    line,
                    ThreeWayMatchDifferenceType.INVOICE_QUANTITY_OVER_RECEIPT,
                    ThreeWayMatchSeverity.HIGH,
                    ordered,
                    received,
                    invoiced,
                    "发票数量大于累计收货数量"));
            }
        }

        if (invoiceTotalAmount.compareTo(ZERO) > 0 && invoiceVarianceAmount.compareTo(ZERO) != 0) {
            differences.add(DifferenceDraft.amount(
                matchId,
                purchaseOrder,
                ThreeWayMatchDifferenceType.INVOICE_AMOUNT_MISMATCH,
                ThreeWayMatchSeverity.MEDIUM,
                normalizeMoney(purchaseOrder.getTotalAmount()),
                invoiceTotalAmount,
                invoiceVarianceAmount,
                "发票含税金额与 PO 含税金额不一致"));
        }
        return differences;
    }

    private MatchDetailResponse toDetail(ThreeWayMatchResultJpaEntity result) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(result.getPoId());
        List<PurchaseOrderLineJpaEntity> poLines = purchaseOrderLineRepository.findByPoIdOrderByLineNoAsc(result.getPoId());
        List<PurchaseReceiptJpaEntity> receipts = receiptRepository.findByPoIdOrderByCreatedAtAsc(result.getPoId());
        List<PurchaseReceiptLineJpaEntity> receiptLines = receiptLineRepository.findByPoIdOrderByLineNoAsc(result.getPoId());
        List<SupplierInvoiceJpaEntity> invoices = invoiceRepository.findByPoIdOrderByCreatedAtAsc(result.getPoId());
        List<SupplierInvoiceLineJpaEntity> invoiceLines = invoiceLineRepository.findByPoIdOrderByLineNoAsc(result.getPoId());
        Map<String, BigDecimal> receivedByLine = sumReceiptQuantities(receiptLines);
        Map<String, BigDecimal> invoicedByLine = sumInvoiceQuantities(invoiceLines);
        List<ThreeWayMatchDifferenceJpaEntity> differences = differenceRepository.findByMatchIdOrderByCreatedAtAsc(result.getMatchId());
        List<ThreeWayMatchActionJpaEntity> actions = actionRepository.findByMatchIdOrderByCreatedAtAsc(result.getMatchId());

        return new MatchDetailResponse(
            result.getMatchId(),
            result.getCompanyId(),
            result.getStatus(),
            toPoSummary(purchaseOrder),
            new MatchReceiptSummary(
                receipts.size(),
                sumQuantity(receiptLines.stream().map(PurchaseReceiptLineJpaEntity::getReceivedQuantity).toList()),
                latestReceiptAt(receipts)),
            new MatchInvoiceSummary(
                invoices.size(),
                sumQuantity(invoiceLines.stream().map(SupplierInvoiceLineJpaEntity::getInvoicedQuantity).toList()),
                result.getInvoiceTotalAmount(),
                result.getInvoiceVarianceAmount(),
                latestInvoiceAt(invoices)),
            result.getOrderedTotalQuantity(),
            result.getReceivedTotalQuantity(),
            result.getInvoicedTotalQuantity(),
            result.getPoTotalAmount(),
            result.getInvoiceTotalAmount(),
            result.getInvoiceVarianceAmount(),
            result.getCurrency(),
            result.getDifferenceCount(),
            result.getHighestSeverity(),
            poLines.stream()
                .map(line -> toLineResponse(line, receivedByLine, invoicedByLine))
                .toList(),
            differences.stream().map(this::toDifferenceResponse).toList(),
            actions.stream().map(this::toActionResponse).toList(),
            result.getLastCalculatedAt(),
            result.getCreatedAt(),
            result.getUpdatedAt());
    }

    private MatchListItemResponse toListItem(ThreeWayMatchResultJpaEntity result) {
        return new MatchListItemResponse(
            result.getMatchId(),
            result.getCompanyId(),
            result.getPoId(),
            result.getPoTitle(),
            result.getSupplierId(),
            result.getSupplierName(),
            result.getStatus(),
            result.getPoTotalAmount(),
            result.getInvoiceTotalAmount(),
            result.getInvoiceVarianceAmount(),
            result.getCurrency(),
            result.getDifferenceCount(),
            result.getHighestSeverity(),
            result.getLastCalculatedAt(),
            result.getUpdatedAt());
    }

    private MatchPurchaseOrderSummary toPoSummary(PurchaseOrderJpaEntity purchaseOrder) {
        return new MatchPurchaseOrderSummary(
            purchaseOrder.getPoId(),
            purchaseOrder.getCompanyId(),
            purchaseOrder.getTitle(),
            purchaseOrder.getStatus(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getTotalAmount(),
            purchaseOrder.getCurrency(),
            purchaseOrder.getExpectedDeliveryDate(),
            purchaseOrder.getIssuedAt());
    }

    private MatchLineResponse toLineResponse(
        PurchaseOrderLineJpaEntity line,
        Map<String, BigDecimal> receivedByLine,
        Map<String, BigDecimal> invoicedByLine
    ) {
        return new MatchLineResponse(
            line.getLineId(),
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            normalizeQuantity(line.getQuantity()),
            normalizeQuantity(receivedByLine.getOrDefault(line.getLineId(), ZERO)),
            normalizeQuantity(invoicedByLine.getOrDefault(line.getLineId(), ZERO)),
            line.getUnit());
    }

    private MatchDifferenceResponse toDifferenceResponse(ThreeWayMatchDifferenceJpaEntity difference) {
        return new MatchDifferenceResponse(
            difference.getDifferenceId(),
            difference.getDifferenceType(),
            difference.getSeverity(),
            difference.getPoLineId(),
            difference.getLineNo(),
            difference.getItemName(),
            difference.getSpecification(),
            difference.getOrderedQuantity(),
            difference.getReceivedQuantity(),
            difference.getInvoicedQuantity(),
            difference.getUnit(),
            difference.getPoAmount(),
            difference.getInvoiceAmount(),
            difference.getDifferenceAmount(),
            difference.getCurrency(),
            difference.getDescription(),
            difference.getCreatedAt());
    }

    private MatchActionResponse toActionResponse(ThreeWayMatchActionJpaEntity action) {
        return new MatchActionResponse(
            action.getActionId(),
            action.getActionType(),
            action.getActorId(),
            action.getNote(),
            action.getCreatedAt());
    }

    private ThreeWayMatchStatus statusFor(
        List<PurchaseReceiptJpaEntity> receipts,
        List<SupplierInvoiceJpaEntity> invoices,
        List<DifferenceDraft> differences
    ) {
        if (!differences.isEmpty()) {
            return ThreeWayMatchStatus.EXCEPTION;
        }
        if (receipts.isEmpty() || invoices.isEmpty()) {
            return ThreeWayMatchStatus.PENDING_INPUT;
        }
        return ThreeWayMatchStatus.MATCHED;
    }

    private ThreeWayMatchSeverity highestSeverity(List<DifferenceDraft> differences) {
        return differences.stream()
            .map(DifferenceDraft::severity)
            .max(Comparator.comparingInt(this::severityRank))
            .orElse(null);
    }

    private int severityRank(ThreeWayMatchSeverity severity) {
        if (severity == null) {
            return 0;
        }
        return switch (severity) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }

    private Map<String, BigDecimal> sumReceiptQuantities(List<PurchaseReceiptLineJpaEntity> lines) {
        Map<String, BigDecimal> sums = new LinkedHashMap<>();
        for (PurchaseReceiptLineJpaEntity line : lines) {
            sums.merge(line.getPoLineId(), normalizeQuantity(line.getReceivedQuantity()), BigDecimal::add);
        }
        return sums;
    }

    private Map<String, BigDecimal> sumInvoiceQuantities(List<SupplierInvoiceLineJpaEntity> lines) {
        Map<String, BigDecimal> sums = new LinkedHashMap<>();
        for (SupplierInvoiceLineJpaEntity line : lines) {
            sums.merge(line.getPoLineId(), normalizeQuantity(line.getInvoicedQuantity()), BigDecimal::add);
        }
        return sums;
    }

    private LocalDateTime latestReceiptAt(List<PurchaseReceiptJpaEntity> receipts) {
        return receipts.stream()
            .map(PurchaseReceiptJpaEntity::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .orElse(null);
    }

    private LocalDateTime latestInvoiceAt(List<SupplierInvoiceJpaEntity> invoices) {
        return invoices.stream()
            .map(SupplierInvoiceJpaEntity::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .orElse(null);
    }

    private PurchaseOrderJpaEntity requireIssuedPurchaseOrder(String poId, String companyId) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
        requireCompanyOwnership(purchaseOrder.getCompanyId(), companyId, "poId");
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.ISSUED) {
            throw conflict("Only ISSUED purchase orders can be matched: " + poId);
        }
        return purchaseOrder;
    }

    private PurchaseOrderJpaEntity requirePurchaseOrder(String poId) {
        return purchaseOrderRepository.findByPoId(poId)
            .orElseThrow(() -> notFound("Unknown poId: " + poId));
    }

    private ThreeWayMatchResultJpaEntity requireMatch(String matchId) {
        return resultRepository.findByMatchId(matchId)
            .orElseThrow(() -> notFound("Unknown matchId: " + matchId));
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private void requireOptionalCompanyOwnership(String ownerCompanyId, String requestedCompanyId, String fieldName) {
        if (requestedCompanyId == null || requestedCompanyId.isBlank()) {
            return;
        }
        requireCompany(requestedCompanyId);
        requireCompanyOwnership(ownerCompanyId, requestedCompanyId, fieldName);
    }

    private void requireCompanyOwnership(String ownerCompanyId, String requestedCompanyId, String fieldName) {
        if (!ownerCompanyId.equals(requestedCompanyId)) {
            throw badRequest(fieldName + " does not belong to companyId: " + requestedCompanyId);
        }
    }

    private void requireUserInCompany(String companyId, String userId, String fieldName) {
        DemoUserJpaEntity user = userRepository.findByUserId(userId)
            .orElseThrow(() -> badRequest("Unknown " + fieldName + ": " + userId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw badRequest(fieldName + " does not belong to companyId: " + userId);
        }
    }

    private String nextMatchId() {
        String prefix = "TWM-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = resultRepository.findFirstByMatchIdStartingWithOrderByMatchIdDesc(prefix)
            .map(ThreeWayMatchResultJpaEntity::getMatchId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String nextActionId() {
        String prefix = "TWM-ACT-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = actionRepository.findFirstByActionIdStartingWithOrderByActionIdDesc(prefix)
            .map(ThreeWayMatchActionJpaEntity::getActionId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String normalizeNote(String note) {
        if (note == null || note.isBlank()) {
            throw badRequest("Handling note is required");
        }
        return note.trim();
    }

    private BigDecimal sumQuantity(List<BigDecimal> values) {
        return values.stream().reduce(ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal sumMoney(List<BigDecimal> values) {
        return values.stream().reduce(ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeQuantity(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
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

    private record DifferenceDraft(
        String matchId,
        String companyId,
        String poId,
        String poLineId,
        Integer lineNo,
        String itemName,
        String specification,
        ThreeWayMatchDifferenceType differenceType,
        ThreeWayMatchSeverity severity,
        BigDecimal orderedQuantity,
        BigDecimal receivedQuantity,
        BigDecimal invoicedQuantity,
        String unit,
        BigDecimal poAmount,
        BigDecimal invoiceAmount,
        BigDecimal differenceAmount,
        String currency,
        String description
    ) {

        static DifferenceDraft line(
            String matchId,
            PurchaseOrderJpaEntity purchaseOrder,
            PurchaseOrderLineJpaEntity line,
            ThreeWayMatchDifferenceType type,
            ThreeWayMatchSeverity severity,
            BigDecimal orderedQuantity,
            BigDecimal receivedQuantity,
            BigDecimal invoicedQuantity,
            String description
        ) {
            return new DifferenceDraft(
                matchId,
                purchaseOrder.getCompanyId(),
                purchaseOrder.getPoId(),
                line.getLineId(),
                line.getLineNo(),
                line.getItemName(),
                line.getSpecification(),
                type,
                severity,
                orderedQuantity,
                receivedQuantity,
                invoicedQuantity,
                line.getUnit(),
                null,
                null,
                null,
                purchaseOrder.getCurrency(),
                description);
        }

        static DifferenceDraft amount(
            String matchId,
            PurchaseOrderJpaEntity purchaseOrder,
            ThreeWayMatchDifferenceType type,
            ThreeWayMatchSeverity severity,
            BigDecimal poAmount,
            BigDecimal invoiceAmount,
            BigDecimal differenceAmount,
            String description
        ) {
            return new DifferenceDraft(
                matchId,
                purchaseOrder.getCompanyId(),
                purchaseOrder.getPoId(),
                null,
                null,
                null,
                null,
                type,
                severity,
                null,
                null,
                null,
                null,
                poAmount,
                invoiceAmount,
                differenceAmount,
                purchaseOrder.getCurrency(),
                description);
        }

        ThreeWayMatchDifferenceJpaEntity toEntity(String differenceId) {
            return new ThreeWayMatchDifferenceJpaEntity(
                differenceId,
                matchId,
                companyId,
                poId,
                poLineId,
                lineNo,
                itemName,
                specification,
                differenceType,
                severity,
                orderedQuantity,
                receivedQuantity,
                invoicedQuantity,
                unit,
                poAmount,
                invoiceAmount,
                differenceAmount,
                currency,
                description);
        }
    }
}
