## 1. Persist the First Purchase Request Record

- [x] 1.1 Add `V3__create_purchase_request_intake.sql` with `purchase_requests` and `purchase_request_lines` tables, company/status indexes, unique `request_id`, monetary columns, timestamps, and `field_snapshot_json`
- [x] 1.2 Add JPA entities and repositories for purchase request headers and line items without modifying existing `demo_*` master data tables
- [x] 1.3 Add request/response DTOs for draft creation, submission, list items, detail views, line items, status values, and validation errors

## 2. Create and Submit Purchase Requests

- [x] 2.1 Implement service logic to create a `DRAFT` purchase request from explicit `companyId`, `requesterId`, `departmentId`, `categoryId`, `budgetAccountId`, required request fields, and at least one line item
- [x] 2.2 Validate company, requester, department, category, budget account, and optional supplier references against seeded master data, including company ownership and category-budget consistency
- [x] 2.3 Generate stable business `requestId` values and persist line totals, request total, currency, expected delivery date, and fixed-form field snapshot data
- [x] 2.4 Implement submit logic that only moves `DRAFT` requests to `SUBMITTED`, sets `submittedAt`, and rejects duplicate submit or unknown request IDs
- [x] 2.5 Add `POST /api/purchase-requests/drafts` and `POST /api/purchase-requests/{requestId}/submit` controller endpoints using `ApiEnvelope` and generated Swagger/OpenAPI documentation
- [x] 2.6 Temporarily allow local demo GET/POST calls to `/api/purchase-requests/**` in `SecurityConfig` while preserving service-layer company ownership validation

## 3. Query Company-Scoped Request Data

- [x] 3.1 Add `GET /api/purchase-requests?companyId=...&status=...` to return only requests owned by the requested company and optionally filter by status
- [x] 3.2 Add `GET /api/purchase-requests/{requestId}` to return request header, master data identifiers, status, amounts, field snapshot, and line items
- [x] 3.3 Return client-visible errors for unknown companies, unknown requests, mismatched company data, invalid budget accounts, and invalid status transitions without falling back to the active demo company

## 4. Make the Frontend Purchase Request Page Real

- [x] 4.1 Add frontend API functions and typed query/mutation hooks for purchase request create draft, submit, list, and detail endpoints
- [x] 4.2 Route the sidebar “采购申请” item to `/purchase-requests` and keep navigation badges free of roadmap placeholders or P0 labels
- [x] 4.3 Build the purchase request page with active company context, real list, detail drawer, and create drawer using backend master data options
- [x] 4.4 Scope requester and budget account options to the active company while keeping suppliers and categories as group-level reference data
- [x] 4.5 Support saving the “20 台笔记本采购” draft from the UI and refreshing the list/detail with the returned backend `requestId`
- [x] 4.6 Support submitting a saved draft from the UI and rendering the `SUBMITTED` status with Chinese UI copy consistent with the rest of the workspace
- [x] 4.7 Replace static recent purchase request mock data in the procurement workspace with backend-backed request data or hide the widget until real data is available

## 5. Verify Isolation, Documentation, and Demo Flow

- [x] 5.1 Add backend integration tests with Testcontainers MySQL for migration, draft creation, submit, list, detail, company isolation, budget-category mismatch, requester-company mismatch, duplicate submit, and OpenAPI paths
- [x] 5.2 Add frontend validation through `npm run build` and, where practical, focused component or hook tests for required fields and company-scoped option refresh
- [x] 5.3 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 5.4 Start local infrastructure, backend, and frontend, then verify from the browser that a 星河数字科技 “20 台笔记本采购” request can be saved, submitted, listed, and opened in detail
- [x] 5.5 Record verification commands, URLs, and any environment caveats in the change notes before archive

## 6. Keep Downstream Workflow Boundaries Clean

- [x] 6.1 Confirm this change does not create approval instances, approver tasks, RFQs, POs, receipts, invoices, matching records, AI recommendations, or attachment upload flows
- [x] 6.2 Confirm submitted requests expose enough stable data for the later approval-flow change without implementing approval behavior in this slice
