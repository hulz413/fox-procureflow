## 1. Establish RFQ Records from Approved Requests

- [x] 1.1 Add a Flyway migration for `rfqs`, `rfq_suppliers`, `rfq_quotes`, and `rfq_quote_attachments` with company/request/status indexes, one-RFQ-per-request uniqueness, and stable business IDs
- [x] 1.2 Add RFQ status enums, JPA entities, repositories, DTOs, and mapping helpers for RFQ headers, invited suppliers, quotes, attachment metadata, details, and comparison rows
- [x] 1.3 Implement approved-request eligibility lookup so RFQ creation can verify the source purchase request, line snapshot, and `APPROVED` approval instance before any RFQ data is written
- [x] 1.4 Implement RFQ create transaction that validates company ownership, procurement user company, duplicate RFQ prevention, supplier uniqueness, supplier category coverage, and source request snapshot persistence

## 2. Expose Company-Scoped RFQ APIs

- [x] 2.1 Add `POST /api/rfqs` to create an `ISSUED` RFQ from an approved request and selected suppliers, returning `rfqId` and the persisted supplier invitations
- [x] 2.2 Add `GET /api/rfqs?companyId=...&status=...` for company-scoped RFQ lists with source request summary, supplier count, quote count, and current status
- [x] 2.3 Add `GET /api/rfqs/{rfqId}` for RFQ detail with source request snapshot, approval summary, invited suppliers, quotes, attachment metadata, and timestamps
- [x] 2.4 Temporarily allow local demo calls to `/api/rfqs/**` in `SecurityConfig` while preserving service-layer validation for company, procurement user, request, approval, RFQ, and supplier scope
- [x] 2.5 Ensure Swagger/OpenAPI documents RFQ create, list, detail, quote upsert, and comparison endpoints with request/response shapes

## 3. Capture Supplier Quotes and Comparison Results

- [x] 3.1 Add `PUT /api/rfqs/{rfqId}/quotes/{supplierId}` to create or update the current effective quote for an invited supplier
- [x] 3.2 Persist quote amount, tax rate, tax amount, total amount, delivery date, supplier score, risk note, and attachment metadata without requiring file upload or MinIO object keys
- [x] 3.3 Reject quote writes for non-invited suppliers, cross-company actors, unknown RFQs, invalid amounts, invalid delivery dates, or suppliers outside RFQ scope
- [x] 3.4 Update RFQ status from `ISSUED` to `QUOTING`, and to `COMPARISON_READY` once enough valid quotes exist for comparison
- [x] 3.5 Add `GET /api/rfqs/{rfqId}/comparison` with deterministic recommendation ranking across price, delivery, supplier score, and risk fields

## 4. Build the RFQ Workspace Experience

- [x] 4.1 Add frontend RFQ API types, query/mutation functions, and cache invalidation for list, detail, create, quote upsert, and comparison calls
- [x] 4.2 Add the `/rfqs` route and sidebar “询报价” navigation entry using the existing procurement workspace visual style
- [x] 4.3 Build the RFQ list and detail view with active company context, source request summary, supplier invitations, quote progress, and status indicators
- [x] 4.4 Build an RFQ creation drawer that lets a procurement user select an approved purchase request and choose valid suppliers from the group shared supplier pool
- [x] 4.5 Build a quote entry drawer or panel for invited suppliers, including quote amount, tax rate, delivery date, supplier score, risk note, and attachment metadata fields
- [x] 4.6 Build the quote comparison table with price, tax, delivery, supplier score, risk level, risk note, attachment metadata, and clearly visible recommendation rank without exposing PO creation

## 5. Verify RFQ Business Behavior

- [x] 5.1 Add backend integration tests for approved-request RFQ creation, request snapshot persistence, duplicate RFQ rejection, unapproved request rejection, and cross-company request rejection
- [x] 5.2 Add backend integration tests for supplier invitation validation, duplicate supplier rejection, category coverage rejection, and group shared supplier usage across companies
- [x] 5.3 Add backend integration tests for quote create/update, non-invited supplier rejection, attachment metadata persistence, status transitions, and comparison ranking
- [x] 5.4 Assert Swagger/OpenAPI documents the RFQ endpoints and that demo security allows RFQ calls while service-layer ownership checks still reject invalid scopes
- [x] 5.5 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 5.6 Start local infrastructure, backend, and frontend, then verify from the browser that an approved 星河数字科技 IT hardware request can create an RFQ, invite three suppliers, record quotes, and show comparison ranking

## 6. Preserve MVP Boundaries and Handoff

- [x] 6.1 Confirm RFQ comparison does not create purchase orders, receipts, invoices, three-way matching records, supplier portal tasks, AI recommendations, or budget freezes
- [x] 6.2 Confirm RFQ runtime uses MySQL and synchronous service calls without requiring Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, or Keycloak
- [x] 6.3 Update roadmap or verification notes after implementation to mark RFQ progress and identify PO 采购订单 as the next downstream P0 slice
- [x] 6.4 Record verification commands, demo RFQ IDs, demo suppliers, browser URL, and environment caveats in the change notes before archive
