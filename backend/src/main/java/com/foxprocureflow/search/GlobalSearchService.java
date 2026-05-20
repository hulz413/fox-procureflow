package com.foxprocureflow.search;

import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import com.foxprocureflow.identity.DemoOrganizationService;
import com.foxprocureflow.search.GlobalSearchDtos.GlobalSearchGroupResponse;
import com.foxprocureflow.search.GlobalSearchDtos.GlobalSearchResponse;
import com.foxprocureflow.search.GlobalSearchDtos.GlobalSearchResultResponse;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
public class GlobalSearchService {

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int GROUP_LIMIT = 5;

    private final DemoOrganizationService organizationService;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public GlobalSearchService(
        DemoOrganizationService organizationService,
        NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.organizationService = organizationService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String companyId, String query) {
        DemoCompanyContext company = resolveCompany(companyId);
        String normalizedQuery = normalize(query);
        LocalDateTime generatedAt = LocalDateTime.now();

        if (normalizedQuery.length() < MIN_QUERY_LENGTH) {
            return new GlobalSearchResponse(
                normalizedQuery,
                company.companyId(),
                company.companyName(),
                generatedAt,
                List.of());
        }

        SearchTerms terms = SearchTerms.of(company.companyId(), normalizedQuery);
        List<GlobalSearchGroupResponse> groups = new ArrayList<>();
        addGroup(groups, GlobalSearchResultType.PURCHASE_REQUEST, purchaseRequests(terms));
        addGroup(groups, GlobalSearchResultType.APPROVAL, approvals(terms));
        addGroup(groups, GlobalSearchResultType.RFQ, rfqs(terms));
        addGroup(groups, GlobalSearchResultType.PURCHASE_ORDER, purchaseOrders(terms));
        addGroup(groups, GlobalSearchResultType.RECEIPT, receipts(terms));
        addGroup(groups, GlobalSearchResultType.INVOICE, invoices(terms));
        addGroup(groups, GlobalSearchResultType.THREE_WAY_MATCH, threeWayMatches(terms));
        addGroup(groups, GlobalSearchResultType.SUPPLIER, suppliers(terms));
        addGroup(groups, GlobalSearchResultType.MASTER_DATA, masterData(terms));

        return new GlobalSearchResponse(
            normalizedQuery,
            company.companyId(),
            company.companyName(),
            generatedAt,
            groups);
    }

    private DemoCompanyContext resolveCompany(String companyId) {
        if (!StringUtils.hasText(companyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyId is required for global search");
        }

        DemoOrganizationContext context = organizationService.getDemoContext();
        return context.companies()
            .stream()
            .filter(company -> company.companyId().equals(companyId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown companyId: " + companyId));
    }

    private void addGroup(
        List<GlobalSearchGroupResponse> groups,
        GlobalSearchResultType type,
        List<GlobalSearchResultResponse> results
    ) {
        if (!results.isEmpty()) {
            groups.add(new GlobalSearchGroupResponse(type, labelOf(type), results));
        }
    }

    private List<GlobalSearchResultResponse> purchaseRequests(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT pr.request_id AS id,
                   pr.title AS title,
                   CONCAT(COALESCE(requester.display_name, pr.requester_id), ' · ', COALESCE(category.category_name, pr.category_id)) AS subtitle,
                   pr.status AS status,
                   pr.company_id AS company_id,
                   company.company_name AS company_name,
                   supplier.supplier_name AS supplier_name,
                   pr.total_amount AS amount,
                   pr.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   pr.updated_at AS occurred_at,
                   pr.request_id AS target_id,
                   pr.request_id AS field_identifier,
                   pr.title AS field_title,
                   COALESCE(requester.display_name, '') AS field_actor,
                   COALESCE(category.category_name, '') AS field_category,
                   COALESCE(supplier.supplier_name, '') AS field_supplier,
                   pr.status AS field_status
            FROM purchase_requests pr
            JOIN demo_companies company ON company.company_id = pr.company_id
            LEFT JOIN demo_users requester ON requester.user_id = pr.requester_id
            LEFT JOIN demo_procurement_categories category ON category.category_id = pr.category_id
            LEFT JOIN demo_suppliers supplier ON supplier.supplier_id = pr.supplier_id
            WHERE pr.company_id = :companyId
              AND (LOWER(pr.request_id) LIKE :like
                OR LOWER(pr.title) LIKE :like
                OR LOWER(pr.status) LIKE :like
                OR LOWER(COALESCE(requester.display_name, '')) LIKE :like
                OR LOWER(COALESCE(category.category_name, '')) LIKE :like
                OR LOWER(COALESCE(supplier.supplier_name, '')) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(pr.request_id) = :exact THEN 0
                    WHEN LOWER(pr.request_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                pr.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.PURCHASE_REQUEST, "/purchase-requests", "requestId"));
    }

    private List<GlobalSearchResultResponse> approvals(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT approval.approval_id AS id,
                   request.title AS title,
                   CONCAT(approval.request_id, ' · ', COALESCE(active_node.node_name, approval.status)) AS subtitle,
                   approval.status AS status,
                   approval.company_id AS company_id,
                   company.company_name AS company_name,
                   supplier.supplier_name AS supplier_name,
                   request.total_amount AS amount,
                   request.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   approval.updated_at AS occurred_at,
                   approval.approval_id AS target_id,
                   approval.approval_id AS field_identifier,
                   request.title AS field_title,
                   COALESCE(active_node.node_name, '') AS field_actor,
                   COALESCE(approver.display_name, '') AS field_category,
                   COALESCE(supplier.supplier_name, '') AS field_supplier,
                   approval.status AS field_status
            FROM approval_instances approval
            JOIN purchase_requests request ON request.request_id = approval.request_id
            JOIN demo_companies company ON company.company_id = approval.company_id
            LEFT JOIN approval_nodes active_node
                ON active_node.approval_id = approval.approval_id
               AND active_node.status = 'ACTIVE'
            LEFT JOIN demo_users approver ON approver.user_id = active_node.approver_id
            LEFT JOIN demo_suppliers supplier ON supplier.supplier_id = request.supplier_id
            WHERE approval.company_id = :companyId
              AND (LOWER(approval.approval_id) LIKE :like
                OR LOWER(approval.request_id) LIKE :like
                OR LOWER(request.title) LIKE :like
                OR LOWER(approval.status) LIKE :like
                OR LOWER(COALESCE(active_node.node_name, '')) LIKE :like
                OR LOWER(COALESCE(approver.display_name, '')) LIKE :like
                OR LOWER(COALESCE(supplier.supplier_name, '')) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(approval.approval_id) = :exact OR LOWER(approval.request_id) = :exact THEN 0
                    WHEN LOWER(approval.approval_id) LIKE :prefix OR LOWER(approval.request_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                CASE approval.status WHEN 'IN_PROGRESS' THEN 0 ELSE 1 END,
                approval.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.APPROVAL, "/approvals", "approvalId"));
    }

    private List<GlobalSearchResultResponse> rfqs(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT rfq.rfq_id AS id,
                   rfq.title AS title,
                   CONCAT(rfq.request_id, ' · ', COALESCE(rfq_supplier.supplier_names, '')) AS subtitle,
                   rfq.status AS status,
                   rfq.company_id AS company_id,
                   company.company_name AS company_name,
                   rfq_supplier.supplier_names AS supplier_name,
                   rfq.request_total_amount AS amount,
                   rfq.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   rfq.updated_at AS occurred_at,
                   rfq.rfq_id AS target_id,
                   rfq.rfq_id AS field_identifier,
                   rfq.title AS field_title,
                   rfq.request_id AS field_actor,
                   COALESCE(category.category_name, '') AS field_category,
                   COALESCE(rfq_supplier.supplier_names, '') AS field_supplier,
                   rfq.status AS field_status
            FROM rfqs rfq
            JOIN demo_companies company ON company.company_id = rfq.company_id
            LEFT JOIN demo_procurement_categories category ON category.category_id = rfq.category_id
            LEFT JOIN (
                SELECT rfq_id, GROUP_CONCAT(supplier_name ORDER BY supplier_name SEPARATOR ' / ') AS supplier_names
                FROM rfq_suppliers
                GROUP BY rfq_id
            ) rfq_supplier ON rfq_supplier.rfq_id = rfq.rfq_id
            WHERE rfq.company_id = :companyId
              AND (LOWER(rfq.rfq_id) LIKE :like
                OR LOWER(rfq.request_id) LIKE :like
                OR LOWER(rfq.approval_id) LIKE :like
                OR LOWER(rfq.title) LIKE :like
                OR LOWER(rfq.status) LIKE :like
                OR LOWER(COALESCE(category.category_name, '')) LIKE :like
                OR LOWER(COALESCE(rfq_supplier.supplier_names, '')) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(rfq.rfq_id) = :exact THEN 0
                    WHEN LOWER(rfq.rfq_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                rfq.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.RFQ, "/rfqs", "rfqId"));
    }

    private List<GlobalSearchResultResponse> purchaseOrders(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT po.po_id AS id,
                   po.title AS title,
                   CONCAT(po.rfq_id, ' · ', po.supplier_name) AS subtitle,
                   po.status AS status,
                   po.company_id AS company_id,
                   company.company_name AS company_name,
                   po.supplier_name AS supplier_name,
                   po.total_amount AS amount,
                   po.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   po.updated_at AS occurred_at,
                   po.po_id AS target_id,
                   po.po_id AS field_identifier,
                   po.title AS field_title,
                   po.rfq_id AS field_actor,
                   po.request_id AS field_category,
                   po.supplier_name AS field_supplier,
                   po.status AS field_status
            FROM purchase_orders po
            JOIN demo_companies company ON company.company_id = po.company_id
            WHERE po.company_id = :companyId
              AND (LOWER(po.po_id) LIKE :like
                OR LOWER(po.rfq_id) LIKE :like
                OR LOWER(po.request_id) LIKE :like
                OR LOWER(po.title) LIKE :like
                OR LOWER(po.status) LIKE :like
                OR LOWER(po.supplier_name) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(po.po_id) = :exact THEN 0
                    WHEN LOWER(po.po_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                CASE po.status WHEN 'ISSUED' THEN 0 ELSE 1 END,
                po.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.PURCHASE_ORDER, "/purchase-orders", "poId"));
    }

    private List<GlobalSearchResultResponse> receipts(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT receipt.receipt_id AS id,
                   CONCAT('收货 ', receipt.receipt_id) AS title,
                   CONCAT(receipt.po_id, ' · ', receipt.supplier_name) AS subtitle,
                   receipt.status AS status,
                   receipt.company_id AS company_id,
                   company.company_name AS company_name,
                   receipt.supplier_name AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'COMPANY' AS ownership_scope,
                   receipt.updated_at AS occurred_at,
                   receipt.receipt_id AS target_id,
                   receipt.receipt_id AS field_identifier,
                   receipt.po_id AS field_title,
                   COALESCE(receiver.display_name, '') AS field_actor,
                   COALESCE(receipt.note, '') AS field_category,
                   receipt.supplier_name AS field_supplier,
                   receipt.status AS field_status
            FROM purchase_receipts receipt
            JOIN demo_companies company ON company.company_id = receipt.company_id
            LEFT JOIN demo_users receiver ON receiver.user_id = receipt.received_by
            WHERE receipt.company_id = :companyId
              AND (LOWER(receipt.receipt_id) LIKE :like
                OR LOWER(receipt.po_id) LIKE :like
                OR LOWER(receipt.status) LIKE :like
                OR LOWER(receipt.supplier_name) LIKE :like
                OR LOWER(COALESCE(receiver.display_name, '')) LIKE :like
                OR LOWER(COALESCE(receipt.note, '')) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(receipt.receipt_id) = :exact OR LOWER(receipt.po_id) = :exact THEN 0
                    WHEN LOWER(receipt.receipt_id) LIKE :prefix OR LOWER(receipt.po_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                receipt.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResultWithExtraParams(
                rs,
                GlobalSearchResultType.RECEIPT,
                "/receipts-invoices",
                "receiptId",
                Map.of("poId", rs.getString("field_title"))));
    }

    private List<GlobalSearchResultResponse> invoices(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT invoice.invoice_id AS id,
                   CONCAT('发票 ', invoice.invoice_number) AS title,
                   CONCAT(invoice.po_id, ' · ', invoice.supplier_name) AS subtitle,
                   invoice.status AS status,
                   invoice.company_id AS company_id,
                   company.company_name AS company_name,
                   invoice.supplier_name AS supplier_name,
                   invoice.total_amount AS amount,
                   invoice.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   invoice.updated_at AS occurred_at,
                   invoice.invoice_id AS target_id,
                   invoice.invoice_id AS field_identifier,
                   invoice.invoice_number AS field_title,
                   COALESCE(registrant.display_name, '') AS field_actor,
                   invoice.po_id AS field_category,
                   invoice.supplier_name AS field_supplier,
                   invoice.status AS field_status
            FROM supplier_invoices invoice
            JOIN demo_companies company ON company.company_id = invoice.company_id
            LEFT JOIN demo_users registrant ON registrant.user_id = invoice.registered_by
            WHERE invoice.company_id = :companyId
              AND (LOWER(invoice.invoice_id) LIKE :like
                OR LOWER(invoice.invoice_number) LIKE :like
                OR LOWER(invoice.po_id) LIKE :like
                OR LOWER(invoice.status) LIKE :like
                OR LOWER(invoice.supplier_name) LIKE :like
                OR LOWER(COALESCE(registrant.display_name, '')) LIKE :like
                OR LOWER(COALESCE(invoice.note, '')) LIKE :like)
            ORDER BY CASE
                    WHEN LOWER(invoice.invoice_id) = :exact OR LOWER(invoice.invoice_number) = :exact THEN 0
                    WHEN LOWER(invoice.invoice_id) LIKE :prefix OR LOWER(invoice.invoice_number) LIKE :prefix THEN 1
                    ELSE 2
                END,
                invoice.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResultWithExtraParams(
                rs,
                GlobalSearchResultType.INVOICE,
                "/receipts-invoices",
                "invoiceId",
                Map.of("poId", rs.getString("field_category"))));
    }

    private List<GlobalSearchResultResponse> threeWayMatches(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT matching.match_id AS id,
                   matching.po_title AS title,
                   CONCAT(matching.po_id, ' · ', matching.supplier_name) AS subtitle,
                   matching.status AS status,
                   matching.company_id AS company_id,
                   company.company_name AS company_name,
                   matching.supplier_name AS supplier_name,
                   matching.invoice_variance_amount AS amount,
                   matching.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   matching.updated_at AS occurred_at,
                   matching.match_id AS target_id,
                   matching.match_id AS field_identifier,
                   matching.po_title AS field_title,
                   matching.po_id AS field_actor,
                   COALESCE(matching.highest_severity, '') AS field_category,
                   matching.supplier_name AS field_supplier,
                   matching.status AS field_status
            FROM three_way_match_results matching
            JOIN demo_companies company ON company.company_id = matching.company_id
            WHERE matching.company_id = :companyId
              AND (LOWER(matching.match_id) LIKE :like
                OR LOWER(matching.po_id) LIKE :like
                OR LOWER(matching.po_title) LIKE :like
                OR LOWER(matching.status) LIKE :like
                OR LOWER(COALESCE(matching.highest_severity, '')) LIKE :like
                OR LOWER(matching.supplier_name) LIKE :like
                OR EXISTS (
                    SELECT 1
                    FROM three_way_match_differences difference_item
                    WHERE difference_item.match_id = matching.match_id
                      AND (LOWER(difference_item.difference_type) LIKE :like
                        OR LOWER(difference_item.description) LIKE :like)
                ))
            ORDER BY CASE
                    WHEN LOWER(matching.match_id) = :exact OR LOWER(matching.po_id) = :exact THEN 0
                    WHEN LOWER(matching.match_id) LIKE :prefix OR LOWER(matching.po_id) LIKE :prefix THEN 1
                    ELSE 2
                END,
                CASE matching.status WHEN 'EXCEPTION' THEN 0 WHEN 'PENDING_INPUT' THEN 1 ELSE 2 END,
                matching.updated_at DESC
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.THREE_WAY_MATCH, "/three-way-matching", "matchId"));
    }

    private List<GlobalSearchResultResponse> suppliers(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT supplier.supplier_id AS id,
                   supplier.supplier_name AS title,
                   CONCAT(supplier.service_scope, ' · ', supplier.location) AS subtitle,
                   supplier.status AS status,
                   NULL AS company_id,
                   NULL AS company_name,
                   supplier.supplier_name AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'GROUP_SHARED' AS ownership_scope,
                   NULL AS occurred_at,
                   supplier.supplier_id AS target_id,
                   supplier.supplier_id AS field_identifier,
                   supplier.supplier_name AS field_title,
                   supplier.service_scope AS field_actor,
                   COALESCE(category_names.category_names, '') AS field_category,
                   supplier.location AS field_supplier,
                   CONCAT(supplier.status, ' ', supplier.risk_level) AS field_status
            FROM demo_suppliers supplier
            LEFT JOIN (
                SELECT supplier_category.supplier_id,
                       GROUP_CONCAT(category.category_name ORDER BY category.sort_order SEPARATOR ' / ') AS category_names
                FROM demo_supplier_categories supplier_category
                JOIN demo_procurement_categories category ON category.category_id = supplier_category.category_id
                GROUP BY supplier_category.supplier_id
            ) category_names ON category_names.supplier_id = supplier.supplier_id
            WHERE LOWER(supplier.supplier_id) LIKE :like
               OR LOWER(supplier.supplier_name) LIKE :like
               OR LOWER(supplier.service_scope) LIKE :like
               OR LOWER(supplier.location) LIKE :like
               OR LOWER(supplier.status) LIKE :like
               OR LOWER(supplier.risk_level) LIKE :like
               OR LOWER(COALESCE(category_names.category_names, '')) LIKE :like
            ORDER BY CASE
                    WHEN LOWER(supplier.supplier_id) = :exact OR LOWER(supplier.supplier_name) = :exact THEN 0
                    WHEN LOWER(supplier.supplier_id) LIKE :prefix OR LOWER(supplier.supplier_name) LIKE :prefix THEN 1
                    ELSE 2
                END,
                supplier.supplier_name
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.SUPPLIER, "/suppliers", "supplierId"));
    }

    private List<GlobalSearchResultResponse> masterData(SearchTerms terms) {
        List<GlobalSearchResultResponse> results = new ArrayList<>();
        results.addAll(companyMasterData(terms));
        results.addAll(departmentMasterData(terms));
        results.addAll(userMasterData(terms));
        results.addAll(budgetMasterData(terms));
        results.addAll(categoryMasterData(terms));
        return results.stream()
            .limit(GROUP_LIMIT)
            .toList();
    }

    private List<GlobalSearchResultResponse> companyMasterData(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT company.company_id AS id,
                   company.company_name AS title,
                   company.business_scope AS subtitle,
                   CASE WHEN company.active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
                   company.company_id AS company_id,
                   company.company_name AS company_name,
                   NULL AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'COMPANY' AS ownership_scope,
                   company.updated_at AS occurred_at,
                   company.company_id AS target_id,
                   company.company_id AS field_identifier,
                   company.company_name AS field_title,
                   company.business_scope AS field_actor,
                   '' AS field_category,
                   '' AS field_supplier,
                   CASE WHEN company.active THEN 'active' ELSE 'inactive' END AS field_status
            FROM demo_companies company
            WHERE company.company_id = :companyId
              AND (LOWER(company.company_id) LIKE :like
                OR LOWER(company.company_name) LIKE :like
                OR LOWER(company.business_scope) LIKE :like)
            LIMIT 2
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.MASTER_DATA, "/master-data", "masterDataId"));
    }

    private List<GlobalSearchResultResponse> departmentMasterData(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT department.department_id AS id,
                   department.department_name AS title,
                   department.function_scope AS subtitle,
                   'ACTIVE' AS status,
                   department.company_id AS company_id,
                   company.company_name AS company_name,
                   NULL AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'COMPANY' AS ownership_scope,
                   NULL AS occurred_at,
                   department.department_id AS target_id,
                   department.department_id AS field_identifier,
                   department.department_name AS field_title,
                   department.function_scope AS field_actor,
                   '' AS field_category,
                   '' AS field_supplier,
                   'department' AS field_status
            FROM demo_departments department
            JOIN demo_companies company ON company.company_id = department.company_id
            WHERE department.company_id = :companyId
              AND (LOWER(department.department_id) LIKE :like
                OR LOWER(department.department_name) LIKE :like
                OR LOWER(department.function_scope) LIKE :like)
            ORDER BY department.sort_order
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.MASTER_DATA, "/master-data", "masterDataId"));
    }

    private List<GlobalSearchResultResponse> userMasterData(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT demo_user.user_id AS id,
                   demo_user.display_name AS title,
                   CONCAT(demo_user.position_title, ' · ', demo_user.email) AS subtitle,
                   CASE WHEN demo_user.active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
                   demo_user.company_id AS company_id,
                   company.company_name AS company_name,
                   NULL AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'COMPANY' AS ownership_scope,
                   NULL AS occurred_at,
                   demo_user.user_id AS target_id,
                   demo_user.user_id AS field_identifier,
                   demo_user.display_name AS field_title,
                   demo_user.position_title AS field_actor,
                   demo_user.email AS field_category,
                   '' AS field_supplier,
                   CASE WHEN demo_user.active THEN 'active' ELSE 'inactive' END AS field_status
            FROM demo_users demo_user
            JOIN demo_companies company ON company.company_id = demo_user.company_id
            WHERE demo_user.company_id = :companyId
              AND (LOWER(demo_user.user_id) LIKE :like
                OR LOWER(demo_user.display_name) LIKE :like
                OR LOWER(demo_user.email) LIKE :like
                OR LOWER(demo_user.position_title) LIKE :like)
            ORDER BY demo_user.display_name
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.MASTER_DATA, "/master-data", "masterDataId"));
    }

    private List<GlobalSearchResultResponse> budgetMasterData(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT budget.budget_account_id AS id,
                   budget.account_name AS title,
                   CONCAT(category.category_name, ' · 可用 ', budget.available_amount, ' ', budget.currency) AS subtitle,
                   CASE WHEN budget.active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
                   budget.company_id AS company_id,
                   company.company_name AS company_name,
                   NULL AS supplier_name,
                   budget.available_amount AS amount,
                   budget.currency AS currency,
                   'COMPANY' AS ownership_scope,
                   NULL AS occurred_at,
                   budget.budget_account_id AS target_id,
                   budget.budget_account_id AS field_identifier,
                   budget.account_name AS field_title,
                   category.category_name AS field_actor,
                   budget.currency AS field_category,
                   '' AS field_supplier,
                   CASE WHEN budget.active THEN 'active' ELSE 'inactive' END AS field_status
            FROM demo_budget_accounts budget
            JOIN demo_companies company ON company.company_id = budget.company_id
            JOIN demo_procurement_categories category ON category.category_id = budget.category_id
            WHERE budget.company_id = :companyId
              AND (LOWER(budget.budget_account_id) LIKE :like
                OR LOWER(budget.account_name) LIKE :like
                OR LOWER(category.category_name) LIKE :like)
            ORDER BY budget.sort_order
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.MASTER_DATA, "/master-data", "masterDataId"));
    }

    private List<GlobalSearchResultResponse> categoryMasterData(SearchTerms terms) {
        return jdbcTemplate.query("""
            SELECT category.category_id AS id,
                   category.category_name AS title,
                   category.business_scope AS subtitle,
                   CASE WHEN category.group_level THEN 'GROUP_SHARED' ELSE 'COMPANY' END AS status,
                   NULL AS company_id,
                   NULL AS company_name,
                   NULL AS supplier_name,
                   NULL AS amount,
                   NULL AS currency,
                   'GROUP_SHARED' AS ownership_scope,
                   NULL AS occurred_at,
                   category.category_id AS target_id,
                   category.category_id AS field_identifier,
                   category.category_name AS field_title,
                   category.business_scope AS field_actor,
                   '' AS field_category,
                   '' AS field_supplier,
                   'category' AS field_status
            FROM demo_procurement_categories category
            WHERE LOWER(category.category_id) LIKE :like
               OR LOWER(category.category_name) LIKE :like
               OR LOWER(category.business_scope) LIKE :like
            ORDER BY category.sort_order
            LIMIT 5
            """,
            terms.params(),
            (rs, rowNum) -> mapResult(rs, GlobalSearchResultType.MASTER_DATA, "/master-data", "masterDataId"));
    }

    private GlobalSearchResultResponse mapResult(
        ResultSet rs,
        GlobalSearchResultType type,
        String targetPath,
        String targetParam
    ) throws SQLException {
        return mapResultWithExtraParams(rs, type, targetPath, targetParam, Map.of());
    }

    private GlobalSearchResultResponse mapResultWithExtraParams(
        ResultSet rs,
        GlobalSearchResultType type,
        String targetPath,
        String targetParam,
        Map<String, String> extraTargetParams
    ) throws SQLException {
        Map<String, String> targetParams = new LinkedHashMap<>();
        targetParams.put(targetParam, rs.getString("target_id"));
        targetParams.putAll(extraTargetParams);

        return new GlobalSearchResultResponse(
            type,
            rs.getString("id"),
            rs.getString("title"),
            rs.getString("subtitle"),
            rs.getString("status"),
            rs.getString("company_id"),
            rs.getString("company_name"),
            rs.getString("supplier_name"),
            rs.getBigDecimal("amount"),
            rs.getString("currency"),
            rs.getString("ownership_scope"),
            matchedFields(rs),
            targetPath,
            targetParams,
            toLocalDateTime(rs.getTimestamp("occurred_at")));
    }

    private List<String> matchedFields(ResultSet rs) throws SQLException {
        List<String> fields = new ArrayList<>();
        addMatchedField(fields, "编号", rs.getString("field_identifier"));
        addMatchedField(fields, "标题", rs.getString("field_title"));
        addMatchedField(fields, "人员/来源", rs.getString("field_actor"));
        addMatchedField(fields, "品类/上下文", rs.getString("field_category"));
        addMatchedField(fields, "供应商/范围", rs.getString("field_supplier"));
        addMatchedField(fields, "状态", rs.getString("field_status"));
        return fields;
    }

    private void addMatchedField(List<String> fields, String label, String value) {
        if (StringUtils.hasText(value)) {
            fields.add(label + ": " + value);
        }
    }

    private String normalize(String query) {
        return query == null ? "" : query.trim();
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private String labelOf(GlobalSearchResultType type) {
        return switch (type) {
            case PURCHASE_REQUEST -> "采购申请";
            case APPROVAL -> "审批";
            case RFQ -> "询报价";
            case PURCHASE_ORDER -> "采购订单";
            case RECEIPT -> "收货";
            case INVOICE -> "发票";
            case THREE_WAY_MATCH -> "三单匹配";
            case SUPPLIER -> "供应商池";
            case MASTER_DATA -> "主数据";
        };
    }

    private record SearchTerms(String companyId, String query, String like, String prefix, String exact) {

        static SearchTerms of(String companyId, String query) {
            String lower = query.toLowerCase();
            return new SearchTerms(companyId, query, "%" + lower + "%", lower + "%", lower);
        }

        MapSqlParameterSource params() {
            return new MapSqlParameterSource()
                .addValue("companyId", companyId)
                .addValue("query", query)
                .addValue("like", like)
                .addValue("prefix", prefix)
                .addValue("exact", exact);
        }
    }
}
