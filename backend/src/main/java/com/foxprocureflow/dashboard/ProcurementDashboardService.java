package com.foxprocureflow.dashboard;

import com.foxprocureflow.dashboard.ProcurementDashboardDtos.DashboardMetric;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.DocumentFunnelStage;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.ExceptionHighlight;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.ProcurementDashboardResponse;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.SpendTrendPoint;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.StatusDistributionBucket;
import com.foxprocureflow.dashboard.ProcurementDashboardDtos.SupplierDistributionItem;
import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import com.foxprocureflow.identity.DemoOrganizationService;
import com.foxprocureflow.identity.persistence.DemoUserJpaEntity;
import com.foxprocureflow.identity.persistence.DemoUserRepository;
import com.foxprocureflow.identity.persistence.DemoUserRoleRepository;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProcurementDashboardService {

    private static final String DEFAULT_CURRENCY = "CNY";
    private static final String ADMIN_ROLE_ID = "role-admin";
    private static final List<String> DASHBOARD_VIEWER_ROLE_IDS = List.of(
        ADMIN_ROLE_ID,
        "role-procurement",
        "role-finance");

    private final DemoOrganizationService organizationService;
    private final DemoUserRepository userRepository;
    private final DemoUserRoleRepository userRoleRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ProcurementDashboardService(
        DemoOrganizationService organizationService,
        DemoUserRepository userRepository,
        DemoUserRoleRepository userRoleRepository,
        NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.organizationService = organizationService;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public ProcurementDashboardResponse dashboard(ProcurementDashboardScope scope, String companyId, String actorId) {
        DashboardActor actor = validateDashboardActor(actorId);
        DemoOrganizationContext context = organizationService.getDemoContext();
        ScopeSelection selection = resolveScope(context, scope, companyId, actor);
        LocalDateTime generatedAt = LocalDateTime.now();
        MapSqlParameterSource params = new MapSqlParameterSource("companyIds", selection.companyIds());

        return new ProcurementDashboardResponse(
            selection.scope(),
            context.groupId(),
            context.groupName(),
            selection.companyId(),
            selection.companyName(),
            selection.companyIds(),
            generatedAt,
            summaryMetrics(params, generatedAt),
            spendTrend(params),
            documentFunnel(params),
            statusDistributions(params),
            supplierDistribution(params),
            exceptionHighlights(params));
    }

    private DashboardActor validateDashboardActor(String actorId) {
        if (!StringUtils.hasText(actorId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "actorId is required for procurement dashboard access");
        }

        DemoUserJpaEntity actor = userRepository.findByUserId(actorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown actorId: " + actorId));
        if (!actor.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Inactive users cannot access procurement dashboard");
        }

        boolean hasDashboardRole = userRoleRepository.existsByUserIdAndRoleIdIn(actorId, DASHBOARD_VIEWER_ROLE_IDS);
        if (!hasDashboardRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current user is not allowed to access procurement dashboard");
        }

        boolean admin = userRoleRepository.existsByUserIdAndRoleIdIn(actorId, List.of(ADMIN_ROLE_ID));
        return new DashboardActor(actor.getCompanyId(), admin);
    }

    private ScopeSelection resolveScope(
        DemoOrganizationContext context,
        ProcurementDashboardScope scope,
        String companyId,
        DashboardActor actor
    ) {
        if (scope == ProcurementDashboardScope.GROUP) {
            if (!actor.admin()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can access group dashboard scope");
            }

            return new ScopeSelection(
                ProcurementDashboardScope.GROUP,
                null,
                null,
                context.companies().stream().map(DemoCompanyContext::companyId).toList());
        }

        if (!StringUtils.hasText(companyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyId is required for COMPANY dashboard scope");
        }

        if (!actor.admin() && !actor.companyId().equals(companyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current user can only access own company dashboard");
        }

        DemoCompanyContext company = context.companies()
            .stream()
            .filter(candidate -> candidate.companyId().equals(companyId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown companyId: " + companyId));

        return new ScopeSelection(
            ProcurementDashboardScope.COMPANY,
            company.companyId(),
            company.companyName(),
            List.of(company.companyId()));
    }

    private List<DashboardMetric> summaryMetrics(MapSqlParameterSource params, LocalDateTime generatedAt) {
        AmountSummary issuedAmount = issuedPurchaseOrderAmount(params);
        long pendingApprovals = count("""
            SELECT COUNT(*)
            FROM approval_instances
            WHERE company_id IN (:companyIds)
              AND status = 'IN_PROGRESS'
            """, params);
        long activeRfqs = count("""
            SELECT COUNT(*)
            FROM rfqs
            WHERE company_id IN (:companyIds)
              AND status IN ('ISSUED', 'QUOTING')
            """, params);
        long issuedPurchaseOrders = count("""
            SELECT COUNT(*)
            FROM purchase_orders
            WHERE company_id IN (:companyIds)
              AND status = 'ISSUED'
            """, params);
        long receiptInvoiceFollowUp = count("""
            SELECT COUNT(*)
            FROM three_way_match_results
            WHERE company_id IN (:companyIds)
              AND status = 'PENDING_INPUT'
            """, params);
        long matchingExceptions = count("""
            SELECT COUNT(*)
            FROM three_way_match_results
            WHERE company_id IN (:companyIds)
              AND status = 'EXCEPTION'
            """, params);

        return List.of(
            metric("issuedPoAmount", "已发布 PO 金额", issuedAmount.amount(), issuedAmount.currency(), generatedAt),
            metric("pendingApprovals", "待审批", pendingApprovals, null, generatedAt),
            metric("activeRfqs", "进行中 RFQ", activeRfqs, null, generatedAt),
            metric("issuedPurchaseOrders", "已发布 PO", issuedPurchaseOrders, null, generatedAt),
            metric("receiptInvoiceFollowUp", "收货/发票待补齐", receiptInvoiceFollowUp, null, generatedAt),
            metric("matchingExceptions", "三单匹配异常", matchingExceptions, null, generatedAt));
    }

    private AmountSummary issuedPurchaseOrderAmount(MapSqlParameterSource params) {
        return jdbcTemplate.queryForObject("""
            SELECT COALESCE(SUM(total_amount), 0) AS amount,
                   COALESCE(MAX(currency), :defaultCurrency) AS currency
            FROM purchase_orders
            WHERE company_id IN (:companyIds)
              AND status = 'ISSUED'
            """,
            withDefaultCurrency(params),
            (rs, rowNum) -> new AmountSummary(rs.getBigDecimal("amount"), rs.getString("currency")));
    }

    private List<SpendTrendPoint> spendTrend(MapSqlParameterSource params) {
        return jdbcTemplate.query("""
            WITH RECURSIVE trend_bounds AS (
                SELECT MIN(DATE(COALESCE(issued_at, updated_at, created_at))) AS start_date,
                       MAX(DATE(COALESCE(issued_at, updated_at, created_at))) AS end_date
                FROM purchase_orders
                WHERE company_id IN (:companyIds)
                  AND status = 'ISSUED'
            ),
            trend_dates AS (
                SELECT start_date AS period_date
                FROM trend_bounds
                WHERE start_date IS NOT NULL
                UNION ALL
                SELECT DATE_ADD(period_date, INTERVAL 1 DAY)
                FROM trend_dates
                JOIN trend_bounds ON trend_dates.period_date < trend_bounds.end_date
            ),
            trend_amounts AS (
                SELECT DATE(COALESCE(issued_at, updated_at, created_at)) AS period_date,
                       COALESCE(SUM(total_amount), 0) AS amount,
                       COALESCE(MAX(currency), :defaultCurrency) AS currency,
                       COUNT(*) AS document_count
                FROM purchase_orders
                WHERE company_id IN (:companyIds)
                  AND status = 'ISSUED'
                GROUP BY period_date
            )
            SELECT DATE_FORMAT(trend_dates.period_date, '%Y-%m-%d') AS period,
                   COALESCE(trend_amounts.amount, 0) AS amount,
                   COALESCE(trend_amounts.currency, :defaultCurrency) AS currency,
                   COALESCE(trend_amounts.document_count, 0) AS document_count
            FROM trend_dates
            LEFT JOIN trend_amounts ON trend_amounts.period_date = trend_dates.period_date
            ORDER BY trend_dates.period_date
            """,
            withDefaultCurrency(params),
            (rs, rowNum) -> new SpendTrendPoint(
                rs.getString("period"),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getLong("document_count")));
    }

    private List<DocumentFunnelStage> documentFunnel(MapSqlParameterSource params) {
        return List.of(
            new DocumentFunnelStage("purchaseRequests", "采购申请", count("SELECT COUNT(*) FROM purchase_requests WHERE company_id IN (:companyIds) AND deleted_at IS NULL", params)),
            new DocumentFunnelStage("approvedRequests", "审批通过", count("SELECT COUNT(*) FROM approval_instances WHERE company_id IN (:companyIds) AND status = 'APPROVED'", params)),
            new DocumentFunnelStage("comparableRfqs", "可比价 RFQ", count("SELECT COUNT(*) FROM rfqs WHERE company_id IN (:companyIds) AND status = 'COMPARISON_READY'", params)),
            new DocumentFunnelStage("issuedPurchaseOrders", "已发布 PO", count("SELECT COUNT(*) FROM purchase_orders WHERE company_id IN (:companyIds) AND status = 'ISSUED'", params)),
            new DocumentFunnelStage("receivedPurchaseOrders", "已收货 PO", count("SELECT COUNT(DISTINCT po_id) FROM purchase_receipts WHERE company_id IN (:companyIds)", params)),
            new DocumentFunnelStage("invoicedPurchaseOrders", "已开票 PO", count("SELECT COUNT(DISTINCT po_id) FROM supplier_invoices WHERE company_id IN (:companyIds)", params)),
            new DocumentFunnelStage("matchedPurchaseOrders", "匹配完成 PO", count("SELECT COUNT(*) FROM three_way_match_results WHERE company_id IN (:companyIds) AND status = 'MATCHED'", params)));
    }

    private List<StatusDistributionBucket> statusDistributions(MapSqlParameterSource params) {
        List<StatusDistributionBucket> buckets = new ArrayList<>();
        addStatusDistribution(buckets, params, "purchaseRequest", "采购申请", "purchase_requests");
        addStatusDistribution(buckets, params, "approval", "审批", "approval_instances");
        addStatusDistribution(buckets, params, "rfq", "RFQ", "rfqs");
        addStatusDistribution(buckets, params, "purchaseOrder", "采购订单", "purchase_orders");
        addStatusDistribution(buckets, params, "receipt", "收货", "purchase_receipts");
        addStatusDistribution(buckets, params, "invoice", "发票", "supplier_invoices");
        addStatusDistribution(buckets, params, "threeWayMatching", "三单匹配", "three_way_match_results");
        return buckets;
    }

    private void addStatusDistribution(
        List<StatusDistributionBucket> buckets,
        MapSqlParameterSource params,
        String documentType,
        String documentLabel,
        String tableName
    ) {
        String activeRecordCondition = "purchase_requests".equals(tableName) ? "AND deleted_at IS NULL" : "";
        List<StatusDistributionBucket> rows = jdbcTemplate.query("""
                SELECT status, COUNT(*) AS bucket_count
                FROM %s
                WHERE company_id IN (:companyIds)
                  %s
                GROUP BY status
                ORDER BY status
                """.formatted(tableName, activeRecordCondition),
            params,
            (rs, rowNum) -> new StatusDistributionBucket(
                documentType,
                documentLabel,
                rs.getString("status"),
                statusLabel(documentType, rs.getString("status")),
                rs.getLong("bucket_count")));
        buckets.addAll(rows);
    }

    private List<SupplierDistributionItem> supplierDistribution(MapSqlParameterSource params) {
        return jdbcTemplate.query("""
            SELECT supplier_id,
                   MAX(supplier_name) AS supplier_name,
                   COALESCE(SUM(issued_po_amount), 0) AS issued_po_amount,
                   COALESCE(MAX(currency), :defaultCurrency) AS currency,
                   COALESCE(SUM(issued_po_count), 0) AS issued_po_count,
                   COALESCE(SUM(quote_count), 0) AS quote_count
            FROM (
                SELECT supplier_id,
                       supplier_name,
                       SUM(CASE WHEN status = 'ISSUED' THEN total_amount ELSE 0 END) AS issued_po_amount,
                       MAX(currency) AS currency,
                       SUM(CASE WHEN status = 'ISSUED' THEN 1 ELSE 0 END) AS issued_po_count,
                       0 AS quote_count
                FROM purchase_orders
                WHERE company_id IN (:companyIds)
                GROUP BY supplier_id, supplier_name
                UNION ALL
                SELECT quote.supplier_id,
                       COALESCE(MAX(rfq_supplier.supplier_name), quote.supplier_id) AS supplier_name,
                       0 AS issued_po_amount,
                       :defaultCurrency AS currency,
                       0 AS issued_po_count,
                       COUNT(*) AS quote_count
                FROM rfq_quotes quote
                JOIN rfqs rfq ON rfq.rfq_id = quote.rfq_id
                LEFT JOIN rfq_suppliers rfq_supplier
                    ON rfq_supplier.rfq_id = quote.rfq_id
                   AND rfq_supplier.supplier_id = quote.supplier_id
                WHERE rfq.company_id IN (:companyIds)
                GROUP BY quote.supplier_id
            ) supplier_data
            GROUP BY supplier_id
            HAVING issued_po_count > 0 OR quote_count > 0
            ORDER BY issued_po_amount DESC, quote_count DESC, supplier_name ASC
            LIMIT 8
            """,
            withDefaultCurrency(params),
            (rs, rowNum) -> new SupplierDistributionItem(
                rs.getString("supplier_id"),
                rs.getString("supplier_name"),
                rs.getBigDecimal("issued_po_amount"),
                rs.getString("currency"),
                rs.getLong("issued_po_count"),
                rs.getLong("quote_count")));
    }

    private List<ExceptionHighlight> exceptionHighlights(MapSqlParameterSource params) {
        return jdbcTemplate.query("""
            SELECT matching.match_id,
                   matching.company_id,
                   company.company_name,
                   matching.po_id,
                   matching.po_title,
                   matching.supplier_id,
                   matching.supplier_name,
                   matching.highest_severity,
                   matching.difference_count,
                   primary_difference.difference_type AS primary_difference_type,
                   primary_difference.description AS primary_difference_description,
                   matching.invoice_variance_amount,
                   matching.currency,
                   matching.last_calculated_at
            FROM three_way_match_results matching
            JOIN demo_companies company ON company.company_id = matching.company_id
            LEFT JOIN (
                SELECT ranked.match_id,
                       ranked.difference_type,
                       ranked.description
                FROM (
                    SELECT difference_item.match_id,
                           difference_item.difference_type,
                           difference_item.description,
                           ROW_NUMBER() OVER (
                               PARTITION BY difference_item.match_id
                               ORDER BY CASE difference_item.severity
                                       WHEN 'HIGH' THEN 3
                                       WHEN 'MEDIUM' THEN 2
                                       WHEN 'LOW' THEN 1
                                       ELSE 0
                                   END DESC,
                                   difference_item.created_at ASC,
                                   difference_item.id ASC
                           ) AS difference_rank
                    FROM three_way_match_differences difference_item
                ) ranked
                WHERE ranked.difference_rank = 1
            ) primary_difference ON primary_difference.match_id = matching.match_id
            WHERE matching.company_id IN (:companyIds)
              AND matching.status = 'EXCEPTION'
            ORDER BY CASE matching.highest_severity
                    WHEN 'HIGH' THEN 3
                    WHEN 'MEDIUM' THEN 2
                    WHEN 'LOW' THEN 1
                    ELSE 0
                END DESC,
                matching.last_calculated_at DESC
            LIMIT 6
            """,
            params,
            (rs, rowNum) -> new ExceptionHighlight(
                rs.getString("match_id"),
                rs.getString("company_id"),
                rs.getString("company_name"),
                rs.getString("po_id"),
                rs.getString("po_title"),
                rs.getString("supplier_id"),
                rs.getString("supplier_name"),
                rs.getString("highest_severity"),
                rs.getInt("difference_count"),
                rs.getString("primary_difference_type"),
                rs.getString("primary_difference_description"),
                rs.getBigDecimal("invoice_variance_amount"),
                rs.getString("currency"),
                toLocalDateTime(rs.getTimestamp("last_calculated_at"))));
    }

    private long count(String sql, MapSqlParameterSource params) {
        Long value = jdbcTemplate.queryForObject(sql, params, Long.class);
        return value == null ? 0L : value;
    }

    private DashboardMetric metric(String key, String label, long value, String currency, LocalDateTime generatedAt) {
        return metric(key, label, BigDecimal.valueOf(value), currency, generatedAt);
    }

    private DashboardMetric metric(
        String key,
        String label,
        BigDecimal value,
        String currency,
        LocalDateTime generatedAt
    ) {
        return new DashboardMetric(key, label, value == null ? BigDecimal.ZERO : value, currency, generatedAt);
    }

    private MapSqlParameterSource withDefaultCurrency(MapSqlParameterSource source) {
        return new MapSqlParameterSource()
            .addValue("companyIds", source.getValue("companyIds"))
            .addValue("defaultCurrency", DEFAULT_CURRENCY);
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private static String statusLabel(String documentType, String status) {
        Map<String, String> labels = STATUS_LABELS.getOrDefault(documentType, Map.of());
        return labels.getOrDefault(status, status);
    }

    private static final Map<String, Map<String, String>> STATUS_LABELS = Map.of(
        "purchaseRequest", orderedMap(
            "DRAFT", "草稿",
            "SUBMITTED", "已提交"),
        "approval", orderedMap(
            "IN_PROGRESS", "审批中",
            "APPROVED", "已通过",
            "REJECTED", "已驳回",
            "WITHDRAWN", "已撤回"),
        "rfq", orderedMap(
            "ISSUED", "已发出",
            "QUOTING", "报价中",
            "COMPARISON_READY", "可比价"),
        "purchaseOrder", orderedMap(
            "DRAFT", "草稿",
            "ISSUED", "已发布",
            "CANCELLED", "已取消"),
        "receipt", orderedMap(
            "RECORDED", "已登记"),
        "invoice", orderedMap(
            "RECORDED", "已登记"),
        "threeWayMatching", orderedMap(
            "PENDING_INPUT", "待补齐",
            "MATCHED", "已匹配",
            "EXCEPTION", "异常",
            "RESOLVED", "已处理")
    );

    private static Map<String, String> orderedMap(String... values) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            map.put(values[index], values[index + 1]);
        }
        return map;
    }

    private record ScopeSelection(
        ProcurementDashboardScope scope,
        String companyId,
        String companyName,
        List<String> companyIds
    ) {
        ScopeSelection {
            companyIds = companyIds.stream()
                .sorted(Comparator.naturalOrder())
                .toList();
        }
    }

    private record DashboardActor(String companyId, boolean admin) {
    }

    private record AmountSummary(BigDecimal amount, String currency) {
    }
}
