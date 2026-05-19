package com.foxprocureflow.procurement.execution;

import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.matching.ThreeWayMatchingService;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.AttachmentMetadataRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.AttachmentMetadataResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateInvoiceLineRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateInvoiceRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateReceiptLineRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.CreateReceiptRequest;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.FulfillmentLineResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.FulfillmentPurchaseOrderResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.InvoiceDetailResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.InvoiceLineResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.InvoiceListItemResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.ReceiptDetailResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.ReceiptLineResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.ReceiptListItemResponse;
import com.foxprocureflow.procurement.execution.ReceiptInvoiceDtos.SourcePurchaseOrderResponse;
import com.foxprocureflow.procurement.order.PurchaseOrderJpaEntity;
import com.foxprocureflow.procurement.order.PurchaseOrderLineJpaEntity;
import com.foxprocureflow.procurement.order.PurchaseOrderLineRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderRepository;
import com.foxprocureflow.procurement.order.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReceiptInvoiceService {

    private static final BigDecimal ZERO_MONEY = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal ZERO_RATE = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

    private final PurchaseReceiptRepository receiptRepository;
    private final PurchaseReceiptLineRepository receiptLineRepository;
    private final PurchaseReceiptAttachmentRepository receiptAttachmentRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final SupplierInvoiceLineRepository invoiceLineRepository;
    private final SupplierInvoiceAttachmentRepository invoiceAttachmentRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderLineRepository purchaseOrderLineRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final ThreeWayMatchingService matchingService;

    public ReceiptInvoiceService(
        PurchaseReceiptRepository receiptRepository,
        PurchaseReceiptLineRepository receiptLineRepository,
        PurchaseReceiptAttachmentRepository receiptAttachmentRepository,
        SupplierInvoiceRepository invoiceRepository,
        SupplierInvoiceLineRepository invoiceLineRepository,
        SupplierInvoiceAttachmentRepository invoiceAttachmentRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        PurchaseOrderLineRepository purchaseOrderLineRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        ThreeWayMatchingService matchingService
    ) {
        this.receiptRepository = receiptRepository;
        this.receiptLineRepository = receiptLineRepository;
        this.receiptAttachmentRepository = receiptAttachmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineRepository = invoiceLineRepository;
        this.invoiceAttachmentRepository = invoiceAttachmentRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderLineRepository = purchaseOrderLineRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.matchingService = matchingService;
    }

    @Transactional(readOnly = true)
    public List<ReceiptListItemResponse> listReceipts(String companyId, String poId) {
        requireCompany(companyId);
        if (poId != null && !poId.isBlank()) {
            PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
            requireCompanyOwnership(purchaseOrder, companyId);
        }
        List<PurchaseReceiptJpaEntity> receipts = poId == null || poId.isBlank()
            ? receiptRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            : receiptRepository.findByCompanyIdAndPoIdOrderByCreatedAtDesc(companyId, poId);
        Map<String, List<PurchaseReceiptLineJpaEntity>> linesByReceipt = receiptLinesByReceipt(receipts);
        Map<String, List<PurchaseReceiptAttachmentJpaEntity>> attachmentsByReceipt = receiptAttachmentsByReceipt(receipts);
        return receipts.stream()
            .map(receipt -> toListItem(receipt, linesByReceipt.getOrDefault(receipt.getReceiptId(), List.of()), attachmentsByReceipt.getOrDefault(receipt.getReceiptId(), List.of())))
            .toList();
    }

    @Transactional(readOnly = true)
    public ReceiptDetailResponse receiptDetail(String receiptId, String companyId) {
        PurchaseReceiptJpaEntity receipt = requireReceipt(receiptId);
        requireOptionalCompanyOwnership(receipt.getCompanyId(), companyId, "receiptId");
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(receipt.getPoId());
        return toDetailResponse(
            receipt,
            purchaseOrder,
            receiptLineRepository.findByReceiptIdOrderByLineNoAsc(receiptId),
            receiptAttachmentRepository.findByReceiptIdOrderByCreatedAtAsc(receiptId));
    }

    @Transactional
    public ReceiptDetailResponse createReceipt(CreateReceiptRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.receivedBy(), "receivedBy");
        PurchaseOrderJpaEntity purchaseOrder = requireIssuedPurchaseOrder(request.poId(), request.companyId());
        List<PurchaseOrderLineJpaEntity> purchaseOrderLines = purchaseOrderLineRepository.findByPoIdOrderByLineNoAsc(purchaseOrder.getPoId());
        Map<String, PurchaseOrderLineJpaEntity> lineById = purchaseOrderLines.stream()
            .collect(Collectors.toMap(PurchaseOrderLineJpaEntity::getLineId, Function.identity()));
        Map<String, BigDecimal> requestedByLine = receiptQuantities(request.lines(), lineById);
        Map<String, BigDecimal> existingByLine = sumReceiptQuantities(receiptLineRepository.findByPoIdOrderByLineNoAsc(purchaseOrder.getPoId()));
        ensureQuantityWithinOrder(requestedByLine, existingByLine, lineById, "received quantity");

        String receiptId = nextReceiptId();
        PurchaseReceiptJpaEntity receipt = receiptRepository.saveAndFlush(new PurchaseReceiptJpaEntity(
            receiptId,
            request.companyId(),
            purchaseOrder.getPoId(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            request.receivedBy(),
            request.receivedDate(),
            blankToNull(request.note())));
        List<PurchaseReceiptLineJpaEntity> receiptLines = receiptLineRepository.saveAll(request.lines().stream()
            .map(line -> toReceiptLine(receiptId, purchaseOrder.getPoId(), line, lineById.get(line.poLineId())))
            .toList());
        List<PurchaseReceiptAttachmentJpaEntity> attachments = receiptAttachmentRepository.saveAll(toReceiptAttachments(receiptId, request.attachments()));
        matchingService.recalculateForPo(request.companyId(), purchaseOrder.getPoId());
        return toDetailResponse(receipt, purchaseOrder, receiptLines, attachments);
    }

    @Transactional(readOnly = true)
    public List<InvoiceListItemResponse> listInvoices(String companyId, String poId) {
        requireCompany(companyId);
        if (poId != null && !poId.isBlank()) {
            PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
            requireCompanyOwnership(purchaseOrder, companyId);
        }
        List<SupplierInvoiceJpaEntity> invoices = poId == null || poId.isBlank()
            ? invoiceRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            : invoiceRepository.findByCompanyIdAndPoIdOrderByCreatedAtDesc(companyId, poId);
        Map<String, List<SupplierInvoiceLineJpaEntity>> linesByInvoice = invoiceLinesByInvoice(invoices);
        Map<String, List<SupplierInvoiceAttachmentJpaEntity>> attachmentsByInvoice = invoiceAttachmentsByInvoice(invoices);
        return invoices.stream()
            .map(invoice -> toListItem(invoice, linesByInvoice.getOrDefault(invoice.getInvoiceId(), List.of()), attachmentsByInvoice.getOrDefault(invoice.getInvoiceId(), List.of())))
            .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDetailResponse invoiceDetail(String invoiceId, String companyId) {
        SupplierInvoiceJpaEntity invoice = requireInvoice(invoiceId);
        requireOptionalCompanyOwnership(invoice.getCompanyId(), companyId, "invoiceId");
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(invoice.getPoId());
        return toDetailResponse(
            invoice,
            purchaseOrder,
            invoiceLineRepository.findByInvoiceIdOrderByLineNoAsc(invoiceId),
            invoiceAttachmentRepository.findByInvoiceIdOrderByCreatedAtAsc(invoiceId));
    }

    @Transactional
    public InvoiceDetailResponse createInvoice(CreateInvoiceRequest request) {
        requireCompany(request.companyId());
        requireUserInCompany(request.companyId(), request.registeredBy(), "registeredBy");
        PurchaseOrderJpaEntity purchaseOrder = requireIssuedPurchaseOrder(request.poId(), request.companyId());
        String invoiceNumber = request.invoiceNumber().trim();
        if (invoiceRepository.existsByCompanyIdAndSupplierIdAndInvoiceNumber(request.companyId(), purchaseOrder.getSupplierId(), invoiceNumber)) {
            throw conflict("Invoice number already exists for supplierId: " + invoiceNumber);
        }

        List<PurchaseOrderLineJpaEntity> purchaseOrderLines = purchaseOrderLineRepository.findByPoIdOrderByLineNoAsc(purchaseOrder.getPoId());
        Map<String, PurchaseOrderLineJpaEntity> lineById = purchaseOrderLines.stream()
            .collect(Collectors.toMap(PurchaseOrderLineJpaEntity::getLineId, Function.identity()));
        Map<String, BigDecimal> requestedByLine = invoiceQuantities(request.lines(), lineById);
        Map<String, BigDecimal> existingByLine = sumInvoiceQuantities(invoiceLineRepository.findByPoIdOrderByLineNoAsc(purchaseOrder.getPoId()));
        ensureQuantityWithinOrder(requestedByLine, existingByLine, lineById, "invoiced quantity");

        List<CreateInvoiceLineRequest> normalizedLines = request.lines().stream()
            .map(this::normalizeInvoiceLine)
            .toList();
        BigDecimal untaxedAmount = sumMoney(normalizedLines.stream().map(CreateInvoiceLineRequest::untaxedAmount).toList());
        BigDecimal taxAmount = sumMoney(normalizedLines.stream().map(CreateInvoiceLineRequest::taxAmount).toList());
        BigDecimal totalAmount = sumMoney(normalizedLines.stream().map(CreateInvoiceLineRequest::totalAmount).toList());

        String invoiceId = nextInvoiceId();
        SupplierInvoiceJpaEntity invoice = invoiceRepository.saveAndFlush(new SupplierInvoiceJpaEntity(
            invoiceId,
            request.companyId(),
            purchaseOrder.getPoId(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            invoiceNumber,
            request.invoiceDate(),
            request.registeredBy(),
            untaxedAmount,
            taxAmount,
            totalAmount,
            purchaseOrder.getCurrency(),
            blankToNull(request.note())));
        List<SupplierInvoiceLineJpaEntity> invoiceLines = invoiceLineRepository.saveAll(normalizedLines.stream()
            .map(line -> toInvoiceLine(invoiceId, purchaseOrder, line, lineById.get(line.poLineId())))
            .toList());
        List<SupplierInvoiceAttachmentJpaEntity> attachments = invoiceAttachmentRepository.saveAll(toInvoiceAttachments(invoiceId, request.attachments()));
        matchingService.recalculateForPo(request.companyId(), purchaseOrder.getPoId());
        return toDetailResponse(invoice, purchaseOrder, invoiceLines, attachments);
    }

    @Transactional(readOnly = true)
    public List<FulfillmentPurchaseOrderResponse> fulfillmentPurchaseOrders(String companyId) {
        requireCompany(companyId);
        List<PurchaseOrderJpaEntity> purchaseOrders = purchaseOrderRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(
            companyId,
            PurchaseOrderStatus.ISSUED);
        if (purchaseOrders.isEmpty()) {
            return List.of();
        }
        List<String> poIds = purchaseOrders.stream().map(PurchaseOrderJpaEntity::getPoId).toList();
        Map<String, List<PurchaseOrderLineJpaEntity>> poLinesByPo = purchaseOrderLineRepository.findByPoIdIn(poIds).stream()
            .collect(Collectors.groupingBy(PurchaseOrderLineJpaEntity::getPoId));
        Map<String, BigDecimal> receiptQuantityByLine = sumReceiptQuantities(receiptLineRepository.findByPoIdIn(poIds));
        Map<String, BigDecimal> invoiceQuantityByLine = sumInvoiceQuantities(invoiceLineRepository.findByPoIdIn(poIds));
        Map<String, BigDecimal> invoiceTotalByPo = invoiceRepository.findByPoIdIn(poIds).stream()
            .collect(Collectors.groupingBy(
                SupplierInvoiceJpaEntity::getPoId,
                Collectors.reducing(ZERO_MONEY, SupplierInvoiceJpaEntity::getTotalAmount, BigDecimal::add)));

        return purchaseOrders.stream()
            .map(purchaseOrder -> toFulfillmentResponse(
                purchaseOrder,
                poLinesByPo.getOrDefault(purchaseOrder.getPoId(), List.of()),
                receiptQuantityByLine,
                invoiceQuantityByLine,
                invoiceTotalByPo.getOrDefault(purchaseOrder.getPoId(), ZERO_MONEY)))
            .toList();
    }

    private Map<String, BigDecimal> receiptQuantities(List<CreateReceiptLineRequest> lines, Map<String, PurchaseOrderLineJpaEntity> lineById) {
        Map<String, BigDecimal> requested = new LinkedHashMap<>();
        Set<String> seen = new LinkedHashSet<>();
        for (CreateReceiptLineRequest line : lines) {
            PurchaseOrderLineJpaEntity poLine = lineById.get(line.poLineId());
            if (poLine == null) {
                throw badRequest("poLineId does not belong to poId: " + line.poLineId());
            }
            if (!seen.add(line.poLineId())) {
                throw badRequest("poLineId must be unique in receipt payload: " + line.poLineId());
            }
            requested.put(line.poLineId(), normalizeQuantity(line.receivedQuantity()));
        }
        return requested;
    }

    private Map<String, BigDecimal> invoiceQuantities(List<CreateInvoiceLineRequest> lines, Map<String, PurchaseOrderLineJpaEntity> lineById) {
        Map<String, BigDecimal> requested = new LinkedHashMap<>();
        Set<String> seen = new LinkedHashSet<>();
        for (CreateInvoiceLineRequest line : lines) {
            PurchaseOrderLineJpaEntity poLine = lineById.get(line.poLineId());
            if (poLine == null) {
                throw badRequest("poLineId does not belong to poId: " + line.poLineId());
            }
            if (!seen.add(line.poLineId())) {
                throw badRequest("poLineId must be unique in invoice payload: " + line.poLineId());
            }
            requested.put(line.poLineId(), normalizeQuantity(line.invoicedQuantity()));
        }
        return requested;
    }

    private void ensureQuantityWithinOrder(
        Map<String, BigDecimal> requestedByLine,
        Map<String, BigDecimal> existingByLine,
        Map<String, PurchaseOrderLineJpaEntity> lineById,
        String label
    ) {
        for (Map.Entry<String, BigDecimal> entry : requestedByLine.entrySet()) {
            BigDecimal total = existingByLine.getOrDefault(entry.getKey(), ZERO_MONEY).add(entry.getValue());
            BigDecimal ordered = normalizeQuantity(lineById.get(entry.getKey()).getQuantity());
            if (total.compareTo(ordered) > 0) {
                throw badRequest(label + " exceeds ordered quantity for poLineId: " + entry.getKey());
            }
        }
    }

    private PurchaseReceiptLineJpaEntity toReceiptLine(
        String receiptId,
        String poId,
        CreateReceiptLineRequest line,
        PurchaseOrderLineJpaEntity poLine
    ) {
        return new PurchaseReceiptLineJpaEntity(
            receiptId + "-L" + "%02d".formatted(poLine.getLineNo()),
            receiptId,
            poId,
            poLine.getLineId(),
            poLine.getLineNo(),
            poLine.getItemName(),
            poLine.getSpecification(),
            normalizeQuantity(line.receivedQuantity()),
            poLine.getUnit(),
            blankToNull(line.note()));
    }

    private List<PurchaseReceiptAttachmentJpaEntity> toReceiptAttachments(String receiptId, List<AttachmentMetadataRequest> requestAttachments) {
        List<AttachmentMetadataRequest> attachments = attachments(requestAttachments);
        List<PurchaseReceiptAttachmentJpaEntity> entities = new java.util.ArrayList<>();
        for (int index = 0; index < attachments.size(); index++) {
            AttachmentMetadataRequest attachment = attachments.get(index);
            entities.add(new PurchaseReceiptAttachmentJpaEntity(
                receiptId + "-A" + "%02d".formatted(index + 1),
                receiptId,
                attachment.fileName().trim(),
                blankToNull(attachment.description()),
                attachment.contentType().trim(),
                attachment.sizeBytes()));
        }
        return entities;
    }

    private CreateInvoiceLineRequest normalizeInvoiceLine(CreateInvoiceLineRequest line) {
        BigDecimal untaxedAmount = normalizeMoney(line.untaxedAmount());
        BigDecimal taxAmount = normalizeMoney(line.taxAmount());
        BigDecimal totalAmount = normalizeMoney(line.totalAmount());
        if (untaxedAmount.add(taxAmount).compareTo(totalAmount) != 0) {
            throw badRequest("Invoice line untaxedAmount plus taxAmount must equal totalAmount for poLineId: " + line.poLineId());
        }
        return new CreateInvoiceLineRequest(
            line.poLineId(),
            normalizeQuantity(line.invoicedQuantity()),
            untaxedAmount,
            normalizeRate(line.taxRate()),
            taxAmount,
            totalAmount);
    }

    private SupplierInvoiceLineJpaEntity toInvoiceLine(
        String invoiceId,
        PurchaseOrderJpaEntity purchaseOrder,
        CreateInvoiceLineRequest line,
        PurchaseOrderLineJpaEntity poLine
    ) {
        return new SupplierInvoiceLineJpaEntity(
            invoiceId + "-L" + "%02d".formatted(poLine.getLineNo()),
            invoiceId,
            purchaseOrder.getPoId(),
            poLine.getLineId(),
            poLine.getLineNo(),
            poLine.getItemName(),
            poLine.getSpecification(),
            line.invoicedQuantity(),
            poLine.getUnit(),
            line.untaxedAmount(),
            line.taxRate(),
            line.taxAmount(),
            line.totalAmount(),
            purchaseOrder.getCurrency());
    }

    private List<SupplierInvoiceAttachmentJpaEntity> toInvoiceAttachments(String invoiceId, List<AttachmentMetadataRequest> requestAttachments) {
        List<AttachmentMetadataRequest> attachments = attachments(requestAttachments);
        List<SupplierInvoiceAttachmentJpaEntity> entities = new java.util.ArrayList<>();
        for (int index = 0; index < attachments.size(); index++) {
            AttachmentMetadataRequest attachment = attachments.get(index);
            entities.add(new SupplierInvoiceAttachmentJpaEntity(
                invoiceId + "-A" + "%02d".formatted(index + 1),
                invoiceId,
                attachment.fileName().trim(),
                blankToNull(attachment.description()),
                attachment.contentType().trim(),
                attachment.sizeBytes()));
        }
        return entities;
    }

    private ReceiptListItemResponse toListItem(
        PurchaseReceiptJpaEntity receipt,
        List<PurchaseReceiptLineJpaEntity> lines,
        List<PurchaseReceiptAttachmentJpaEntity> attachments
    ) {
        return new ReceiptListItemResponse(
            receipt.getReceiptId(),
            receipt.getCompanyId(),
            receipt.getPoId(),
            receipt.getSupplierId(),
            receipt.getSupplierName(),
            receipt.getReceivedBy(),
            receipt.getReceivedDate(),
            receipt.getStatus(),
            sumQuantity(lines.stream().map(PurchaseReceiptLineJpaEntity::getReceivedQuantity).toList()),
            lines.size(),
            attachments.size(),
            attachments.stream().map(this::toAttachmentResponse).toList(),
            receipt.getCreatedAt(),
            receipt.getUpdatedAt());
    }

    private ReceiptDetailResponse toDetailResponse(
        PurchaseReceiptJpaEntity receipt,
        PurchaseOrderJpaEntity purchaseOrder,
        List<PurchaseReceiptLineJpaEntity> lines,
        List<PurchaseReceiptAttachmentJpaEntity> attachments
    ) {
        return new ReceiptDetailResponse(
            receipt.getReceiptId(),
            receipt.getCompanyId(),
            toSourcePo(purchaseOrder),
            receipt.getSupplierId(),
            receipt.getSupplierName(),
            receipt.getReceivedBy(),
            receipt.getReceivedDate(),
            receipt.getStatus(),
            receipt.getNote(),
            lines.stream().map(this::toLineResponse).toList(),
            attachments.stream().map(this::toAttachmentResponse).toList(),
            receipt.getCreatedAt(),
            receipt.getUpdatedAt());
    }

    private ReceiptLineResponse toLineResponse(PurchaseReceiptLineJpaEntity line) {
        return new ReceiptLineResponse(
            line.getReceiptLineId(),
            line.getPoLineId(),
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            line.getReceivedQuantity(),
            line.getUnit(),
            line.getNote(),
            line.getCreatedAt());
    }

    private InvoiceListItemResponse toListItem(
        SupplierInvoiceJpaEntity invoice,
        List<SupplierInvoiceLineJpaEntity> lines,
        List<SupplierInvoiceAttachmentJpaEntity> attachments
    ) {
        return new InvoiceListItemResponse(
            invoice.getInvoiceId(),
            invoice.getCompanyId(),
            invoice.getPoId(),
            invoice.getSupplierId(),
            invoice.getSupplierName(),
            invoice.getInvoiceNumber(),
            invoice.getInvoiceDate(),
            invoice.getRegisteredBy(),
            invoice.getStatus(),
            invoice.getUntaxedAmount(),
            invoice.getTaxAmount(),
            invoice.getTotalAmount(),
            invoice.getCurrency(),
            lines.size(),
            attachments.size(),
            attachments.stream().map(this::toAttachmentResponse).toList(),
            invoice.getCreatedAt(),
            invoice.getUpdatedAt());
    }

    private InvoiceDetailResponse toDetailResponse(
        SupplierInvoiceJpaEntity invoice,
        PurchaseOrderJpaEntity purchaseOrder,
        List<SupplierInvoiceLineJpaEntity> lines,
        List<SupplierInvoiceAttachmentJpaEntity> attachments
    ) {
        return new InvoiceDetailResponse(
            invoice.getInvoiceId(),
            invoice.getCompanyId(),
            toSourcePo(purchaseOrder),
            invoice.getSupplierId(),
            invoice.getSupplierName(),
            invoice.getInvoiceNumber(),
            invoice.getInvoiceDate(),
            invoice.getRegisteredBy(),
            invoice.getStatus(),
            invoice.getUntaxedAmount(),
            invoice.getTaxAmount(),
            invoice.getTotalAmount(),
            invoice.getCurrency(),
            invoice.getNote(),
            lines.stream().map(this::toLineResponse).toList(),
            attachments.stream().map(this::toAttachmentResponse).toList(),
            invoice.getCreatedAt(),
            invoice.getUpdatedAt());
    }

    private InvoiceLineResponse toLineResponse(SupplierInvoiceLineJpaEntity line) {
        return new InvoiceLineResponse(
            line.getInvoiceLineId(),
            line.getPoLineId(),
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            line.getInvoicedQuantity(),
            line.getUnit(),
            line.getUntaxedAmount(),
            line.getTaxRate(),
            line.getTaxAmount(),
            line.getTotalAmount(),
            line.getCurrency(),
            line.getCreatedAt());
    }

    private FulfillmentPurchaseOrderResponse toFulfillmentResponse(
        PurchaseOrderJpaEntity purchaseOrder,
        List<PurchaseOrderLineJpaEntity> lines,
        Map<String, BigDecimal> receiptQuantityByLine,
        Map<String, BigDecimal> invoiceQuantityByLine,
        BigDecimal invoiceTotalAmount
    ) {
        List<PurchaseOrderLineJpaEntity> sortedLines = lines.stream()
            .sorted(Comparator.comparing(PurchaseOrderLineJpaEntity::getLineNo))
            .toList();
        BigDecimal orderedQuantity = sumQuantity(sortedLines.stream().map(PurchaseOrderLineJpaEntity::getQuantity).toList());
        BigDecimal receivedQuantity = sumQuantity(sortedLines.stream()
            .map(line -> receiptQuantityByLine.getOrDefault(line.getLineId(), ZERO_MONEY))
            .toList());
        BigDecimal invoicedQuantity = sumQuantity(sortedLines.stream()
            .map(line -> invoiceQuantityByLine.getOrDefault(line.getLineId(), ZERO_MONEY))
            .toList());
        BigDecimal normalizedInvoiceTotal = normalizeMoney(invoiceTotalAmount);
        BigDecimal variance = normalizeMoney(normalizedInvoiceTotal.subtract(purchaseOrder.getTotalAmount()));

        return new FulfillmentPurchaseOrderResponse(
            purchaseOrder.getPoId(),
            purchaseOrder.getCompanyId(),
            purchaseOrder.getTitle(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getTotalAmount(),
            purchaseOrder.getCurrency(),
            purchaseOrder.getExpectedDeliveryDate(),
            orderedQuantity,
            receivedQuantity,
            invoicedQuantity,
            normalizedInvoiceTotal,
            variance,
            receiptProgress(orderedQuantity, receivedQuantity),
            invoiceProgress(orderedQuantity, invoicedQuantity),
            invoiceAmountStatus(normalizedInvoiceTotal, variance),
            sortedLines.stream()
                .map(line -> toFulfillmentLine(line, receiptQuantityByLine, invoiceQuantityByLine))
                .toList(),
            purchaseOrder.getIssuedAt(),
            purchaseOrder.getUpdatedAt());
    }

    private FulfillmentLineResponse toFulfillmentLine(
        PurchaseOrderLineJpaEntity line,
        Map<String, BigDecimal> receiptQuantityByLine,
        Map<String, BigDecimal> invoiceQuantityByLine
    ) {
        return new FulfillmentLineResponse(
            line.getLineId(),
            line.getLineNo(),
            line.getItemName(),
            line.getSpecification(),
            normalizeQuantity(line.getQuantity()),
            normalizeQuantity(receiptQuantityByLine.getOrDefault(line.getLineId(), ZERO_MONEY)),
            normalizeQuantity(invoiceQuantityByLine.getOrDefault(line.getLineId(), ZERO_MONEY)),
            line.getUnit(),
            line.getConfirmedAmount());
    }

    private AttachmentMetadataResponse toAttachmentResponse(PurchaseReceiptAttachmentJpaEntity attachment) {
        return new AttachmentMetadataResponse(
            attachment.getAttachmentId(),
            attachment.getFileName(),
            attachment.getDescription(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            attachment.getStorageObjectKey(),
            attachment.getCreatedAt());
    }

    private AttachmentMetadataResponse toAttachmentResponse(SupplierInvoiceAttachmentJpaEntity attachment) {
        return new AttachmentMetadataResponse(
            attachment.getAttachmentId(),
            attachment.getFileName(),
            attachment.getDescription(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            attachment.getStorageObjectKey(),
            attachment.getCreatedAt());
    }

    private SourcePurchaseOrderResponse toSourcePo(PurchaseOrderJpaEntity purchaseOrder) {
        return new SourcePurchaseOrderResponse(
            purchaseOrder.getPoId(),
            purchaseOrder.getCompanyId(),
            purchaseOrder.getTitle(),
            purchaseOrder.getStatus(),
            purchaseOrder.getSupplierId(),
            purchaseOrder.getSupplierName(),
            purchaseOrder.getTotalAmount(),
            purchaseOrder.getCurrency(),
            purchaseOrder.getExpectedDeliveryDate());
    }

    private Map<String, List<PurchaseReceiptLineJpaEntity>> receiptLinesByReceipt(List<PurchaseReceiptJpaEntity> receipts) {
        List<String> receiptIds = receipts.stream().map(PurchaseReceiptJpaEntity::getReceiptId).toList();
        if (receiptIds.isEmpty()) {
            return Map.of();
        }
        return receiptLineRepository.findByReceiptIdIn(receiptIds).stream()
            .collect(Collectors.groupingBy(PurchaseReceiptLineJpaEntity::getReceiptId));
    }

    private Map<String, List<PurchaseReceiptAttachmentJpaEntity>> receiptAttachmentsByReceipt(List<PurchaseReceiptJpaEntity> receipts) {
        List<String> receiptIds = receipts.stream().map(PurchaseReceiptJpaEntity::getReceiptId).toList();
        if (receiptIds.isEmpty()) {
            return Map.of();
        }
        return receiptAttachmentRepository.findByReceiptIdIn(receiptIds).stream()
            .collect(Collectors.groupingBy(PurchaseReceiptAttachmentJpaEntity::getReceiptId));
    }

    private Map<String, List<SupplierInvoiceLineJpaEntity>> invoiceLinesByInvoice(List<SupplierInvoiceJpaEntity> invoices) {
        List<String> invoiceIds = invoices.stream().map(SupplierInvoiceJpaEntity::getInvoiceId).toList();
        if (invoiceIds.isEmpty()) {
            return Map.of();
        }
        return invoiceLineRepository.findByInvoiceIdIn(invoiceIds).stream()
            .collect(Collectors.groupingBy(SupplierInvoiceLineJpaEntity::getInvoiceId));
    }

    private Map<String, List<SupplierInvoiceAttachmentJpaEntity>> invoiceAttachmentsByInvoice(List<SupplierInvoiceJpaEntity> invoices) {
        List<String> invoiceIds = invoices.stream().map(SupplierInvoiceJpaEntity::getInvoiceId).toList();
        if (invoiceIds.isEmpty()) {
            return Map.of();
        }
        return invoiceAttachmentRepository.findByInvoiceIdIn(invoiceIds).stream()
            .collect(Collectors.groupingBy(SupplierInvoiceAttachmentJpaEntity::getInvoiceId));
    }

    private Map<String, BigDecimal> sumReceiptQuantities(Collection<PurchaseReceiptLineJpaEntity> lines) {
        Map<String, BigDecimal> sums = new HashMap<>();
        for (PurchaseReceiptLineJpaEntity line : lines) {
            sums.merge(line.getPoLineId(), normalizeQuantity(line.getReceivedQuantity()), BigDecimal::add);
        }
        return sums;
    }

    private Map<String, BigDecimal> sumInvoiceQuantities(Collection<SupplierInvoiceLineJpaEntity> lines) {
        Map<String, BigDecimal> sums = new HashMap<>();
        for (SupplierInvoiceLineJpaEntity line : lines) {
            sums.merge(line.getPoLineId(), normalizeQuantity(line.getInvoicedQuantity()), BigDecimal::add);
        }
        return sums;
    }

    private ReceiptProgressStatus receiptProgress(BigDecimal orderedQuantity, BigDecimal receivedQuantity) {
        if (receivedQuantity.compareTo(ZERO_MONEY) == 0) {
            return ReceiptProgressStatus.NOT_RECEIVED;
        }
        if (receivedQuantity.compareTo(orderedQuantity) < 0) {
            return ReceiptProgressStatus.PARTIALLY_RECEIVED;
        }
        return ReceiptProgressStatus.FULLY_RECEIVED;
    }

    private InvoiceProgressStatus invoiceProgress(BigDecimal orderedQuantity, BigDecimal invoicedQuantity) {
        if (invoicedQuantity.compareTo(ZERO_MONEY) == 0) {
            return InvoiceProgressStatus.NOT_INVOICED;
        }
        if (invoicedQuantity.compareTo(orderedQuantity) < 0) {
            return InvoiceProgressStatus.PARTIALLY_INVOICED;
        }
        return InvoiceProgressStatus.FULLY_INVOICED;
    }

    private InvoiceAmountStatus invoiceAmountStatus(BigDecimal invoiceTotalAmount, BigDecimal variance) {
        if (invoiceTotalAmount.compareTo(ZERO_MONEY) == 0) {
            return InvoiceAmountStatus.NOT_INVOICED;
        }
        return variance.compareTo(ZERO_MONEY) == 0 ? InvoiceAmountStatus.MATCHED : InvoiceAmountStatus.VARIANCE;
    }

    private List<AttachmentMetadataRequest> attachments(List<AttachmentMetadataRequest> attachments) {
        return attachments == null ? List.of() : attachments;
    }

    private PurchaseOrderJpaEntity requireIssuedPurchaseOrder(String poId, String companyId) {
        PurchaseOrderJpaEntity purchaseOrder = requirePurchaseOrder(poId);
        requireCompanyOwnership(purchaseOrder, companyId);
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.ISSUED) {
            throw conflict("Only ISSUED purchase orders can create receipts or invoices: " + poId);
        }
        return purchaseOrder;
    }

    private PurchaseOrderJpaEntity requirePurchaseOrder(String poId) {
        return purchaseOrderRepository.findByPoId(poId)
            .orElseThrow(() -> notFound("Unknown poId: " + poId));
    }

    private PurchaseReceiptJpaEntity requireReceipt(String receiptId) {
        return receiptRepository.findByReceiptId(receiptId)
            .orElseThrow(() -> notFound("Unknown receiptId: " + receiptId));
    }

    private SupplierInvoiceJpaEntity requireInvoice(String invoiceId) {
        return invoiceRepository.findByInvoiceId(invoiceId)
            .orElseThrow(() -> notFound("Unknown invoiceId: " + invoiceId));
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private void requireCompanyOwnership(PurchaseOrderJpaEntity purchaseOrder, String companyId) {
        if (!purchaseOrder.getCompanyId().equals(companyId)) {
            throw badRequest("poId does not belong to companyId: " + companyId);
        }
    }

    private void requireOptionalCompanyOwnership(String ownerCompanyId, String requestedCompanyId, String fieldName) {
        if (requestedCompanyId == null || requestedCompanyId.isBlank()) {
            return;
        }
        requireCompany(requestedCompanyId);
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

    private String nextReceiptId() {
        String prefix = "RCPT-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = receiptRepository.findFirstByReceiptIdStartingWithOrderByReceiptIdDesc(prefix)
            .map(PurchaseReceiptJpaEntity::getReceiptId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String nextInvoiceId() {
        String prefix = "INV-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = invoiceRepository.findFirstByInvoiceIdStartingWithOrderByInvoiceIdDesc(prefix)
            .map(SupplierInvoiceJpaEntity::getInvoiceId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private BigDecimal sumQuantity(List<BigDecimal> values) {
        return values.stream().reduce(ZERO_MONEY, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal sumMoney(List<BigDecimal> values) {
        return values.stream().reduce(ZERO_MONEY, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
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
