## 1. Establish Matching Data Foundation

- [x] 1.1 Add Flyway migration for three-way match results, current difference items, and handling records with company, PO, supplier, status, severity, and timestamp indexes
- [x] 1.2 Add matching status, difference type, severity, action type enums, JPA entities, repositories, DTOs, and mapping helpers that preserve company ownership and PO/source summaries
- [x] 1.3 Seed demo matching scenarios from existing issued POs, receipts, and invoices for both 星河数字科技有限公司 and 星河智能制造有限公司, covering matched, pending input, invoice amount mismatch, missing receipt, and invoice quantity over receipt
- [x] 1.4 Ensure matching seed/list data provides at least 3 backend records for procurement execution demo pages without relying on frontend static mock data

## 2. Calculate Matching Results from PO, Receipts, and Invoices

- [x] 2.1 Implement matching recalculation for one issued PO that aggregates ordered quantities, cumulative received quantities, cumulative invoiced quantities, PO amount, invoice amount, and currency in a transaction
- [x] 2.2 Persist exactly one current matching result per PO and replace current system-calculated difference items idempotently while preserving manual handling records
- [x] 2.3 Detect `PENDING_INPUT` for incomplete receipt/invoice input, `MATCHED` for quantity and amount agreement, and `EXCEPTION` for current differences
- [x] 2.4 Detect and persist `INVOICE_AMOUNT_MISMATCH`, `INVOICE_QUANTITY_OVER_RECEIPT`, and `MISSING_RECEIPT` difference items with source line or header context
- [x] 2.5 Reject matching recalculation for unknown company, cross-company PO, `DRAFT` PO, and `CANCELLED` PO with client-visible 4xx errors

## 3. Refresh Matching from Receipt and Invoice Workflows

- [x] 3.1 Update receipt creation so a successful receipt synchronously recalculates the matching result for the same `companyId` and `poId`
- [x] 3.2 Update supplier invoice creation so a successful invoice synchronously recalculates the matching result for the same `companyId` and `poId`
- [x] 3.3 Keep receipt/invoice creation and matching refresh in one consistency boundary so matching refresh failure rolls back the source receipt or invoice creation
- [x] 3.4 Update existing receipt/invoice boundary tests that previously asserted no matching records are created, while preserving no payment, upload, RabbitMQ, or AI side effects

## 4. Expose Company-Scoped Matching APIs

- [x] 4.1 Add `GET /api/three-way-matching?companyId=...&status=...` for company-scoped matching lists with PO, supplier, status, severity, difference count, invoice variance, and last calculated timestamp
- [x] 4.2 Add `GET /api/three-way-matching/exceptions?companyId=...` for finance exception queues scoped to one company
- [x] 4.3 Add `GET /api/three-way-matching/{matchId}?companyId=...` for matching detail with PO summary, receipt summary, invoice summary, difference items, and handling records
- [x] 4.4 Add `POST /api/three-way-matching/recalculate` for manual PO-level recalculation by a same-company actor
- [x] 4.5 Add `POST /api/three-way-matching/{matchId}/actions` for `ACKNOWLEDGE`, `MARK_IN_PROGRESS`, `RESOLVE`, and `REOPEN` handling records with actor/company validation
- [x] 4.6 Temporarily allow local demo calls to matching API paths in `SecurityConfig` while preserving service-layer ownership checks
- [x] 4.7 Ensure Swagger/OpenAPI documents matching list, exception list, detail, recalculate, and action endpoints with request/response shapes

## 5. Build the Three-Way Matching Workspace

- [x] 5.1 Add frontend matching API types, query functions, mutation functions, and cache invalidation for list, exception list, detail, recalculate, and action flows
- [x] 5.2 Add the `/three-way-matching` route and sidebar “三单匹配” navigation entry using the existing procurement workspace shell
- [x] 5.3 Build the matching overview and result list with active company context, matched/pending/exception/resolved totals, supplier, PO amount, invoice variance, highest severity, and last calculated timestamp
- [x] 5.4 Build the exception queue view so finance users can focus on `EXCEPTION` results without seeing another company’s records
- [x] 5.5 Build a matching detail drawer showing PO summary, ordered quantities, received quantities, invoiced quantities, PO amount, invoice amount, difference items, and chronological handling records
- [x] 5.6 Build handling actions for acknowledge, mark in progress, resolve, and reopen, including required notes, disabled-action tooltips, mutation loading states, and backend validation errors
- [x] 5.7 Add confirmation before discarding unsaved handling notes when closing the drawer, switching rows, or leaving the current handling object

## 6. Verify Business Behavior and MVP Boundaries

- [x] 6.1 Add backend integration tests for matched, pending input, invoice amount mismatch, missing receipt, invoice quantity over receipt, and idempotent recalculation scenarios
- [x] 6.2 Add backend integration tests for receipt-created and invoice-created matching refresh, including rollback behavior when matching refresh fails
- [x] 6.3 Add backend integration tests for company isolation, unknown company rejection, cross-company match access rejection, draft/cancelled PO rejection, and same-company actor validation for handling actions
- [x] 6.4 Add backend integration tests for acknowledge, mark in progress, resolve, reopen, handling record chronology, and source PO/receipt/invoice immutability
- [x] 6.5 Assert Swagger/OpenAPI contains the matching endpoints and that the runtime still does not require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
- [x] 6.6 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 6.7 Start local infrastructure, backend, and frontend, then verify from the browser that a 星河数字科技 PO with invoice amount higher than PO enters the exception queue and can be resolved with an auditable handling record
- [x] 6.8 Record verification commands, demo PO IDs, match IDs, exception scenarios, browser URL, and environment caveats before archive
