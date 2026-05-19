## 1. Define Dashboard Scope and Demo Data

- [x] 1.1 Confirm the dashboard scope contract for `GROUP` and `COMPANY`, including required company validation and response metadata
- [x] 1.2 Review existing purchase request, approval, RFQ, PO, receipt, invoice, and three-way matching seed data for both demo companies
- [x] 1.3 Add or adjust backend seed data only if needed so the dashboard can show non-empty spend, status, supplier, and exception sections for both companies
- [x] 1.4 Ensure demo data still reflects company-isolated transaction records and group-shared supplier master data

## 2. Serve Management Dashboard Metrics

- [x] 2.1 Add dashboard DTOs for summary metrics, spend trend points, document funnel counts, status distributions, supplier distributions, and exception highlights
- [x] 2.2 Implement a read-only dashboard service that aggregates issued PO amount, pending approvals, active RFQs, issued POs, receipt/invoice follow-up, and matching exceptions by selected scope
- [x] 2.3 Implement trend, funnel, status distribution, supplier distribution, and matching exception highlight aggregation from MySQL-backed business data
- [x] 2.4 Reject missing or unknown company scope requests with client-visible 4xx errors instead of falling back to the active demo company
- [x] 2.5 Add `GET /api/procurement-dashboard` with Swagger/OpenAPI documentation and local demo security allowance

## 3. Build the Procurement Dashboard Experience

- [x] 3.1 Add frontend dashboard API types and TanStack Query integration for group and company dashboard scopes
- [x] 3.2 Rename the root navigation/header experience from “采购工作台” to “采购看板” while keeping the application root as the default dashboard entry
- [x] 3.3 Replace static KPI and chart content on the root page with backend-driven KPI cards, spend trend, document funnel, status distributions, supplier distribution, and exception highlights
- [x] 3.4 Add a clear scope switcher for group summary, 星河数字科技有限公司, and 星河智能制造有限公司, refreshing all dashboard sections on selection
- [x] 3.5 Provide loading, error, and true empty states for dashboard sections without filling gaps with hard-coded demo metrics
- [x] 3.6 Add a navigation path from matching exception highlights to the 三单匹配 page for detailed handling

## 4. Verify Company Boundaries and Read-Only Behavior

- [x] 4.1 Add backend tests for group aggregation across both demo companies and company aggregation for only `company-digital`
- [x] 4.2 Add backend tests that unknown company requests fail and cross-company records are not included in company scoped metrics
- [x] 4.3 Add backend tests for issued PO spend, pending approvals, active RFQs, matching exception counts, trend data, funnel counts, supplier distribution, and exception highlight ordering
- [x] 4.4 Add backend tests or assertions that dashboard queries do not mutate purchase requests, approvals, RFQs, POs, receipts, invoices, matching results, or handling records
- [x] 4.5 Assert Swagger/OpenAPI contains the dashboard endpoint and that the runtime still does not require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, DeepSeek, or another AI service

## 5. Final Validation and Demo Check

- [x] 5.1 Run backend tests for dashboard and affected procurement modules
- [x] 5.2 Run the frontend build and fix any TypeScript, lint, or bundle errors introduced by the dashboard
- [x] 5.3 Start local infrastructure, backend, and frontend after clearing old `8080` and `5173` processes
- [x] 5.4 Verify in the browser that the procurement dashboard shows group totals, each company’s isolated metrics, supplier distribution, and matching exception highlights from backend data
- [x] 5.5 Record verification commands, dashboard URL, selected demo company IDs, and any environment caveats before archive
