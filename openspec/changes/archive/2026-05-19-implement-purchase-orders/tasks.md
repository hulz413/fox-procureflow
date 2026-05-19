## 1. Create Purchase Orders from Comparable RFQs

- [x] 1.1 Add Flyway migration `V10__create_purchase_orders.sql` for `purchase_orders`, `purchase_order_lines`, `purchase_order_delivery_schedules`, and `purchase_order_status_records` with company/RFQ/quote/status indexes and one-PO-per-RFQ uniqueness
- [x] 1.2 Add PO status/action enums, JPA entities, repositories, DTOs, and mapping helpers for PO headers, line snapshots, delivery schedules, status records, list items, details, create requests, publish requests, and cancel requests
- [x] 1.3 Implement RFQ eligibility lookup so PO creation can verify `COMPARISON_READY` status, quote membership, invited supplier scope, source request, approval, company ownership, and procurement user company before any PO data is written
- [x] 1.4 Implement PO create transaction that snapshots RFQ, quote, supplier, request, approval, amount, tax, line items, delivery schedule, and initial `CREATED` status record into a `DRAFT` PO
- [x] 1.5 Reject duplicate PO creation for the same `rfqId`, unknown companies, cross-company users, non-comparable RFQs, quote/RFQ mismatch, and invalid delivery schedule payloads with client-visible 4xx errors

## 2. Expose Company-Scoped Purchase Order APIs

- [x] 2.1 Add `POST /api/purchase-orders` to create a `DRAFT` PO from an eligible RFQ quote and return the persisted `poId`, source references, supplier, amounts, lines, delivery schedule, and status records
- [x] 2.2 Add `GET /api/purchase-orders?companyId=...&status=...` for company-scoped PO lists with source RFQ, supplier, amount, status, delivery date, and timestamps
- [x] 2.3 Add `GET /api/purchase-orders/{poId}` for PO detail with RFQ summary, request summary, quote snapshot, selected supplier, line items, delivery schedule, status records, and current status
- [x] 2.4 Add `POST /api/purchase-orders/{poId}/publish` that only allows `DRAFT` PO publication, moves status to `ISSUED`, and appends a publish status record
- [x] 2.5 Add `POST /api/purchase-orders/{poId}/cancel` that allows `DRAFT` or `ISSUED` PO cancellation with a reason, moves status to `CANCELLED`, and appends a cancel status record
- [x] 2.6 Temporarily allow local demo calls to `/api/purchase-orders/**` in `SecurityConfig` while preserving service-layer validation for company, actor, procurement user, RFQ, quote, supplier, and PO scope
- [x] 2.7 Ensure Swagger/OpenAPI documents purchase order create, list, detail, publish, and cancel endpoints with request/response shapes

## 3. Build the Purchase Order Workspace Experience

- [x] 3.1 Add frontend PO API types, query/mutation functions, and cache invalidation for list, detail, create, publish, and cancel calls
- [x] 3.2 Add the `/purchase-orders` route and sidebar “采购订单” navigation entry using the existing procurement workspace visual style
- [x] 3.3 Build the PO list and detail view with active company context, source RFQ, selected supplier, total amount, tax amount, status, delivery schedule, line snapshot, and status records
- [x] 3.4 Build a PO creation drawer that lets a procurement user select an eligible `COMPARISON_READY` RFQ quote, review quote comparison context, and enter delivery schedule fields
- [x] 3.5 Build publish and cancel actions in the PO detail view, including client-side disabled states for invalid statuses and a cancellation reason input
- [x] 3.6 Ensure the PO workspace loads data from backend APIs and does not create static mock POs, receipts, invoices, matching records, or AI recommendations

## 4. Verify Purchase Order Business Behavior

- [x] 4.1 Add backend integration tests for PO creation from a `COMPARISON_READY` RFQ quote, source snapshot persistence, line snapshot persistence, delivery schedule persistence, and stable `poId` response
- [x] 4.2 Add backend integration tests for duplicate PO rejection, non-comparable RFQ rejection, quote/RFQ mismatch rejection, cross-company RFQ rejection, cross-company actor rejection, and unknown company rejection
- [x] 4.3 Add backend integration tests for publish, repeated publish rejection, cancel from `DRAFT`, cancel from `ISSUED`, repeated cancel rejection, and status record timeline persistence
- [x] 4.4 Assert Swagger/OpenAPI documents the PO endpoints and that demo security allows PO calls while service-layer ownership checks still reject invalid scopes
- [x] 4.5 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 4.6 Start local infrastructure, backend, and frontend, then verify from the browser that a 星河数字科技 `COMPARISON_READY` RFQ quote can create a PO, show detail, publish, and display an auditable status record

## 5. Preserve MVP Boundaries and Handoff

- [x] 5.1 Confirm PO publication does not create receipts, invoices, three-way matching results, supplier portal tasks, RabbitMQ events, payment records, attachment uploads, or AI recommendations
- [x] 5.2 Confirm PO runtime uses MySQL and synchronous service calls without requiring Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
- [x] 5.3 Update roadmap or verification notes after implementation to mark PO progress and identify 收货与发票 as the next downstream P0 slice
- [x] 5.4 Record verification commands, demo PO IDs, source RFQ/quote IDs, browser URL, and environment caveats in the change notes before archive
