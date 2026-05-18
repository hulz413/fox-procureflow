package com.foxprocureflow.procurement.approval;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foxprocureflow.identity.persistence.DemoCompanyMasterRepository;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalActionRequest;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalDetailResponse;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalNodeResponse;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalRecordResponse;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalSummaryResponse;
import com.foxprocureflow.procurement.approval.ApprovalDtos.ApprovalTaskResponse;
import com.foxprocureflow.procurement.request.PurchaseRequestJpaEntity;
import com.foxprocureflow.procurement.request.PurchaseRequestLineJpaEntity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
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
public class ApprovalService {

    private static final TypeReference<Map<String, Object>> SNAPSHOT_TYPE = new TypeReference<>() {
    };

    private final ApprovalRuleRepository ruleRepository;
    private final ApprovalRuleStepRepository ruleStepRepository;
    private final ApprovalInstanceRepository instanceRepository;
    private final ApprovalNodeRepository nodeRepository;
    private final ApprovalRecordRepository recordRepository;
    private final DemoCompanyMasterRepository companyRepository;
    private final DemoUserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ApprovalService(
        ApprovalRuleRepository ruleRepository,
        ApprovalRuleStepRepository ruleStepRepository,
        ApprovalInstanceRepository instanceRepository,
        ApprovalNodeRepository nodeRepository,
        ApprovalRecordRepository recordRepository,
        DemoCompanyMasterRepository companyRepository,
        DemoUserRepository userRepository,
        ObjectMapper objectMapper
    ) {
        this.ruleRepository = ruleRepository;
        this.ruleStepRepository = ruleStepRepository;
        this.instanceRepository = instanceRepository;
        this.nodeRepository = nodeRepository;
        this.recordRepository = recordRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ApprovalSummaryResponse createForSubmittedRequest(
        PurchaseRequestJpaEntity request,
        List<PurchaseRequestLineJpaEntity> lines
    ) {
        if (instanceRepository.existsByRequestId(request.getRequestId())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Approval already exists for requestId: " + request.getRequestId());
        }

        ApprovalRuleJpaEntity rule = matchRule(request);
        List<ApprovalRuleStepJpaEntity> steps = ruleStepRepository.findByRuleIdOrderByStepOrderAsc(rule.getRuleId());
        if (steps.isEmpty()) {
            throw badRequest("Approval rule has no steps: " + rule.getRuleId());
        }
        steps.forEach(step -> requireUserInCompany(request.getCompanyId(), step.getApproverId()));

        String approvalId = nextApprovalId();
        String snapshotJson = toJson(contextSnapshot(request, lines.size()));
        ApprovalInstanceJpaEntity instance = instanceRepository.saveAndFlush(new ApprovalInstanceJpaEntity(
            approvalId,
            request.getRequestId(),
            request.getCompanyId(),
            request.getRequesterId(),
            rule.getRuleId(),
            steps.get(0).getStepOrder(),
            snapshotJson));

        List<ApprovalNodeJpaEntity> nodes = steps.stream()
            .map(step -> new ApprovalNodeJpaEntity(
                nodeId(approvalId, step.getStepOrder()),
                approvalId,
                request.getRequestId(),
                request.getCompanyId(),
                step.getStepOrder(),
                step.getNodeName(),
                step.getApproverId(),
                step.getStepOrder() == steps.get(0).getStepOrder()))
            .toList();
        nodeRepository.saveAll(nodes);
        recordRepository.save(new ApprovalRecordJpaEntity(
            nextRecordId(approvalId),
            approvalId,
            null,
            request.getCompanyId(),
            request.getRequesterId(),
            ApprovalAction.CREATED,
            "提交采购申请后自动进入审批流"));

        return toSummary(instance, nodes, recordRepository.findByApprovalIdOrderByCreatedAtAsc(approvalId));
    }

    @Transactional(readOnly = true)
    public Map<String, ApprovalSummaryResponse> summariesByRequestIds(Collection<String> requestIds) {
        if (requestIds.isEmpty()) {
            return Map.of();
        }
        List<ApprovalInstanceJpaEntity> instances = instanceRepository.findByRequestIdIn(requestIds);
        if (instances.isEmpty()) {
            return Map.of();
        }
        Map<String, List<ApprovalNodeJpaEntity>> nodesByApproval = nodeRepository.findByApprovalIdIn(instances.stream()
                .map(ApprovalInstanceJpaEntity::getApprovalId)
                .toList())
            .stream()
            .collect(Collectors.groupingBy(ApprovalNodeJpaEntity::getApprovalId));
        return instances.stream()
            .collect(Collectors.toMap(
                ApprovalInstanceJpaEntity::getRequestId,
                instance -> toSummary(
                    instance,
                    sortedNodes(nodesByApproval.getOrDefault(instance.getApprovalId(), List.of())),
                    recordRepository.findByApprovalIdOrderByCreatedAtAsc(instance.getApprovalId()))));
    }

    @Transactional(readOnly = true)
    public ApprovalSummaryResponse findSummaryByRequestId(String requestId) {
        return instanceRepository.findByRequestId(requestId)
            .map(instance -> toSummary(
                instance,
                nodeRepository.findByApprovalIdOrderByStepOrderAsc(instance.getApprovalId()),
                recordRepository.findByApprovalIdOrderByCreatedAtAsc(instance.getApprovalId())))
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ApprovalTaskResponse> tasks(String companyId, String approverId) {
        requireCompany(companyId);
        requireUserInCompany(companyId, approverId);
        List<ApprovalNodeJpaEntity> tasks = nodeRepository
            .findByCompanyIdAndApproverIdAndStatusOrderByActivatedAtAsc(companyId, approverId, ApprovalNodeStatus.ACTIVE);
        if (tasks.isEmpty()) {
            return List.of();
        }
        Map<String, ApprovalInstanceJpaEntity> instances = instanceRepository.findByApprovalIdIn(tasks.stream()
            .map(ApprovalNodeJpaEntity::getApprovalId)
            .distinct()
            .toList())
            .stream()
            .collect(Collectors.toMap(ApprovalInstanceJpaEntity::getApprovalId, Function.identity()));
        return tasks.stream()
            .map(task -> toTaskResponse(task, instances.get(task.getApprovalId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public ApprovalDetailResponse detail(String approvalId, String companyId) {
        ApprovalInstanceJpaEntity instance = instanceRepository.findByApprovalId(approvalId)
            .orElseThrow(() -> notFound("Unknown approvalId: " + approvalId));
        requireOptionalCompanyOwnership(instance, companyId);
        return toDetailResponse(instance);
    }

    @Transactional(readOnly = true)
    public ApprovalDetailResponse detailByRequestId(String requestId, String companyId) {
        ApprovalInstanceJpaEntity instance = instanceRepository.findByRequestId(requestId)
            .orElseThrow(() -> notFound("Unknown approval for requestId: " + requestId));
        requireOptionalCompanyOwnership(instance, companyId);
        return toDetailResponse(instance);
    }

    @Transactional
    public ApprovalDetailResponse approve(String approvalId, ApprovalActionRequest request) {
        ApprovalInstanceJpaEntity instance = requireInProgress(approvalId);
        ApprovalNodeJpaEntity activeNode = activeNode(instance.getApprovalId());
        requireCurrentApprover(instance, activeNode, request.actorId());

        LocalDateTime now = LocalDateTime.now();
        activeNode.approve(now);
        recordRepository.save(new ApprovalRecordJpaEntity(
            nextRecordId(approvalId),
            approvalId,
            activeNode.getNodeId(),
            instance.getCompanyId(),
            request.actorId(),
            ApprovalAction.APPROVED,
            blankToNull(request.comment())));

        List<ApprovalNodeJpaEntity> pendingNodes = nodeRepository
            .findByApprovalIdAndStatusOrderByStepOrderAsc(approvalId, ApprovalNodeStatus.PENDING);
        if (pendingNodes.isEmpty()) {
            instance.approve(now);
        } else {
            ApprovalNodeJpaEntity nextNode = pendingNodes.get(0);
            nextNode.activate(now);
            instance.setCurrentStepOrder(nextNode.getStepOrder());
            nodeRepository.save(nextNode);
        }
        nodeRepository.save(activeNode);
        instanceRepository.save(instance);

        return toDetailResponse(instance);
    }

    @Transactional
    public ApprovalDetailResponse reject(String approvalId, ApprovalActionRequest request) {
        ApprovalInstanceJpaEntity instance = requireInProgress(approvalId);
        ApprovalNodeJpaEntity activeNode = activeNode(instance.getApprovalId());
        requireCurrentApprover(instance, activeNode, request.actorId());

        LocalDateTime now = LocalDateTime.now();
        activeNode.reject(now);
        cancelPendingNodes(approvalId, now);
        instance.reject(now);
        recordRepository.save(new ApprovalRecordJpaEntity(
            nextRecordId(approvalId),
            approvalId,
            activeNode.getNodeId(),
            instance.getCompanyId(),
            request.actorId(),
            ApprovalAction.REJECTED,
            blankToNull(request.comment())));
        nodeRepository.save(activeNode);
        instanceRepository.save(instance);

        return toDetailResponse(instance);
    }

    @Transactional
    public ApprovalDetailResponse withdraw(String approvalId, ApprovalActionRequest request) {
        ApprovalInstanceJpaEntity instance = requireInProgress(approvalId);
        requireUserInCompany(instance.getCompanyId(), request.actorId());
        if (!instance.getRequesterId().equals(request.actorId())) {
            throw badRequest("Only the original requester can withdraw approval: " + request.actorId());
        }

        LocalDateTime now = LocalDateTime.now();
        nodeRepository.findByApprovalIdAndStatus(approvalId, ApprovalNodeStatus.ACTIVE)
            .ifPresent(node -> {
                node.cancel(now);
                nodeRepository.save(node);
            });
        cancelPendingNodes(approvalId, now);
        instance.withdraw(now);
        recordRepository.save(new ApprovalRecordJpaEntity(
            nextRecordId(approvalId),
            approvalId,
            null,
            instance.getCompanyId(),
            request.actorId(),
            ApprovalAction.WITHDRAWN,
            blankToNull(request.comment())));
        instanceRepository.save(instance);

        return toDetailResponse(instance);
    }

    private ApprovalRuleJpaEntity matchRule(PurchaseRequestJpaEntity request) {
        return ruleRepository.findByCompanyIdAndActiveTrueOrderByPriorityAsc(request.getCompanyId())
            .stream()
            .filter(rule -> rule.getCategoryId() == null || rule.getCategoryId().equals(request.getCategoryId()))
            .filter(rule -> rule.getMinAmount().compareTo(request.getTotalAmount()) <= 0)
            .filter(rule -> rule.getMaxAmount() == null || rule.getMaxAmount().compareTo(request.getTotalAmount()) >= 0)
            .min(Comparator.comparingInt(ApprovalRuleJpaEntity::getPriority))
            .orElseThrow(() -> badRequest("No active approval rule matched requestId: " + request.getRequestId()));
    }

    private ApprovalInstanceJpaEntity requireInProgress(String approvalId) {
        ApprovalInstanceJpaEntity instance = instanceRepository.findByApprovalId(approvalId)
            .orElseThrow(() -> notFound("Unknown approvalId: " + approvalId));
        if (instance.getStatus() != ApprovalInstanceStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approval is already terminal: " + approvalId);
        }
        return instance;
    }

    private ApprovalNodeJpaEntity activeNode(String approvalId) {
        return nodeRepository.findByApprovalIdAndStatus(approvalId, ApprovalNodeStatus.ACTIVE)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Approval has no active node: " + approvalId));
    }

    private void requireCurrentApprover(
        ApprovalInstanceJpaEntity instance,
        ApprovalNodeJpaEntity activeNode,
        String actorId
    ) {
        requireUserInCompany(instance.getCompanyId(), actorId);
        if (!activeNode.getApproverId().equals(actorId)) {
            throw badRequest("actorId is not the current approver: " + actorId);
        }
    }

    private void requireUserInCompany(String companyId, String actorId) {
        DemoUserJpaEntity user = userRepository.findByUserId(actorId)
            .orElseThrow(() -> badRequest("Unknown actorId: " + actorId));
        if (!user.isActive() || !companyId.equals(user.getCompanyId())) {
            throw badRequest("actorId does not belong to companyId: " + actorId);
        }
    }

    private void requireCompany(String companyId) {
        companyRepository.findByCompanyId(companyId)
            .orElseThrow(() -> notFound("Unknown companyId: " + companyId));
    }

    private void requireOptionalCompanyOwnership(ApprovalInstanceJpaEntity instance, String companyId) {
        if (companyId == null || companyId.isBlank()) {
            return;
        }
        requireCompany(companyId);
        if (!instance.getCompanyId().equals(companyId)) {
            throw badRequest("approvalId does not belong to companyId: " + companyId);
        }
    }

    private void cancelPendingNodes(String approvalId, LocalDateTime now) {
        List<ApprovalNodeJpaEntity> pendingNodes = nodeRepository
            .findByApprovalIdAndStatusOrderByStepOrderAsc(approvalId, ApprovalNodeStatus.PENDING);
        pendingNodes.forEach(node -> node.cancel(now));
        nodeRepository.saveAll(pendingNodes);
    }

    private ApprovalDetailResponse toDetailResponse(ApprovalInstanceJpaEntity instance) {
        List<ApprovalNodeJpaEntity> nodes = nodeRepository.findByApprovalIdOrderByStepOrderAsc(instance.getApprovalId());
        List<ApprovalRecordJpaEntity> records = recordRepository.findByApprovalIdOrderByCreatedAtAsc(instance.getApprovalId());
        return new ApprovalDetailResponse(
            instance.getApprovalId(),
            instance.getRequestId(),
            instance.getCompanyId(),
            instance.getRequesterId(),
            instance.getMatchedRuleId(),
            instance.getStatus(),
            instance.getCurrentStepOrder(),
            instance.getStartedAt(),
            instance.getCompletedAt(),
            fromJson(instance.getContextSnapshotJson()),
            nodes.stream().map(this::toNodeResponse).toList(),
            records.stream().map(this::toRecordResponse).toList());
    }

    private ApprovalSummaryResponse toSummary(
        ApprovalInstanceJpaEntity instance,
        List<ApprovalNodeJpaEntity> nodes,
        List<ApprovalRecordJpaEntity> records
    ) {
        ApprovalNodeJpaEntity currentNode = nodes.stream()
            .filter(node -> node.getStatus() == ApprovalNodeStatus.ACTIVE)
            .findFirst()
            .orElse(null);
        return new ApprovalSummaryResponse(
            instance.getApprovalId(),
            instance.getStatus(),
            currentNode == null ? null : currentNode.getNodeId(),
            currentNode == null ? null : currentNode.getStepOrder(),
            currentNode == null ? null : currentNode.getNodeName(),
            currentNode == null ? null : currentNode.getApproverId(),
            instance.getMatchedRuleId(),
            records.stream().map(this::toRecordResponse).toList());
    }

    private ApprovalTaskResponse toTaskResponse(ApprovalNodeJpaEntity task, ApprovalInstanceJpaEntity instance) {
        Map<String, Object> snapshot = fromJson(instance.getContextSnapshotJson());
        return new ApprovalTaskResponse(
            instance.getApprovalId(),
            task.getNodeId(),
            instance.getRequestId(),
            instance.getCompanyId(),
            instance.getRequesterId(),
            text(snapshot.get("title")),
            amount(snapshot.get("totalAmount")),
            text(snapshot.get("currency")),
            task.getNodeName(),
            task.getApproverId(),
            task.getActivatedAt());
    }

    private ApprovalNodeResponse toNodeResponse(ApprovalNodeJpaEntity node) {
        return new ApprovalNodeResponse(
            node.getNodeId(),
            node.getStepOrder(),
            node.getNodeName(),
            node.getApproverId(),
            node.getStatus(),
            node.getActivatedAt(),
            node.getCompletedAt());
    }

    private ApprovalRecordResponse toRecordResponse(ApprovalRecordJpaEntity record) {
        return new ApprovalRecordResponse(
            record.getRecordId(),
            record.getNodeId(),
            record.getActorId(),
            record.getAction(),
            record.getComment(),
            record.getCreatedAt());
    }

    private Map<String, Object> contextSnapshot(PurchaseRequestJpaEntity request, int lineCount) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("requestId", request.getRequestId());
        snapshot.put("companyId", request.getCompanyId());
        snapshot.put("requesterId", request.getRequesterId());
        snapshot.put("departmentId", request.getDepartmentId());
        snapshot.put("categoryId", request.getCategoryId());
        snapshot.put("budgetAccountId", request.getBudgetAccountId());
        snapshot.put("supplierId", request.getSupplierId());
        snapshot.put("title", request.getTitle());
        snapshot.put("totalAmount", request.getTotalAmount());
        snapshot.put("currency", request.getCurrency());
        snapshot.put("expectedDeliveryDate", request.getExpectedDeliveryDate().toString());
        snapshot.put("lineCount", lineCount);
        return snapshot;
    }

    private String nextApprovalId() {
        String prefix = "AP-" + LocalDate.now().toString().replace("-", "") + "-";
        int nextSequence = instanceRepository.findFirstByApprovalIdStartingWithOrderByApprovalIdDesc(prefix)
            .map(ApprovalInstanceJpaEntity::getApprovalId)
            .map(value -> value.substring(prefix.length()))
            .map(Integer::parseInt)
            .map(value -> value + 1)
            .orElse(1);
        return prefix + "%04d".formatted(nextSequence);
    }

    private String nextRecordId(String approvalId) {
        return approvalId + "-R" + "%02d".formatted(recordRepository.countByApprovalId(approvalId) + 1);
    }

    private String nodeId(String approvalId, int stepOrder) {
        return approvalId + "-N" + "%02d".formatted(stepOrder);
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize approval context snapshot", exception);
        }
    }

    private Map<String, Object> fromJson(String value) {
        try {
            return objectMapper.readValue(value, SNAPSHOT_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to deserialize approval context snapshot", exception);
        }
    }

    private List<ApprovalNodeJpaEntity> sortedNodes(List<ApprovalNodeJpaEntity> nodes) {
        return nodes.stream()
            .sorted(Comparator.comparingInt(ApprovalNodeJpaEntity::getStepOrder))
            .toList();
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static BigDecimal amount(Object value) {
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number) {
            return new BigDecimal(value.toString());
        }
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
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
