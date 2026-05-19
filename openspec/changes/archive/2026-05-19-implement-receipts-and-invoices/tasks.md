## 1. Prepare PO Fulfillment Data Foundation

- [x] 1.1 Add Flyway migration for receipt headers, receipt lines, receipt attachment metadata, invoice headers, invoice lines, and invoice attachment metadata with company, PO, supplier, line, and invoice-number constraints
- [x] 1.2 Add receipt and invoice status/value enums, JPA entities, repositories, DTOs, and mapping helpers that preserve PO, supplier, line, quantity, amount, tax, attachment metadata, and company ownership snapshots
- [x] 1.3 Seed demo receipt and invoice data for existing issued POs, covering no receipt, partial receipt, full receipt, no invoice, partial invoice, full invoice, and invoice amount variance scenarios
- [x] 1.4 Add fulfillment aggregation helpers that calculate ordered quantity, received quantity, invoiced quantity, invoice total amount, receipt summary, invoice summary, and invoice amount variance per issued PO

## 2. Register Receipts from Issued POs

- [x] 2.1 Implement receipt creation validation for known company, `ISSUED` PO status, PO/company ownership, active receiver in company, PO supplier snapshot, and PO line membership
- [x] 2.2 Implement receipt creation transaction that persists receipt header, receipt lines, attachment metadata, and stable `receiptId` without creating invoice or matching records
- [x] 2.3 Reject receipt creation for `DRAFT` or `CANCELLED` POs, cross-company POs, unknown PO lines, non-positive quantities, and cumulative received quantity greater than ordered quantity with client-visible 4xx errors
- [x] 2.4 Return receipt detail responses with source PO summary, supplier snapshot, line item snapshots, receiver, received date, note, attachment metadata, status, and timestamps

## 3. Register Supplier Invoices from Issued POs

- [x] 3.1 Implement invoice creation validation for known company, `ISSUED` PO status, PO/company ownership, active registered user in company, PO supplier snapshot, PO line membership, and duplicate invoice number within company plus supplier
- [x] 3.2 Implement invoice creation transaction that persists invoice header, invoice lines, attachment metadata, totals, tax data, currency, and stable `invoiceId` without creating receipt or matching records
- [x] 3.3 Reject invoice creation for `DRAFT` or `CANCELLED` POs, cross-company POs, unknown PO lines, non-positive quantities, invalid amounts, duplicate invoice numbers, and cumulative invoiced quantity greater than ordered quantity with client-visible 4xx errors
- [x] 3.4 Preserve invoice amount differences from the PO total and expose the variance in fulfillment summaries without creating three-way matching exceptions

## 4. Expose Company-Scoped Receipt, Invoice, and Fulfillment APIs

- [x] 4.1 Add `GET /api/receipts?companyId=...&poId=...` and `GET /api/receipts/{receiptId}?companyId=...` for company-scoped receipt list and detail queries
- [x] 4.2 Add `POST /api/receipts` for creating a receipt from an issued PO and returning the persisted receipt detail
- [x] 4.3 Add `GET /api/invoices?companyId=...&poId=...` and `GET /api/invoices/{invoiceId}?companyId=...` for company-scoped invoice list and detail queries
- [x] 4.4 Add `POST /api/invoices` for creating a supplier invoice from an issued PO and returning the persisted invoice detail
- [x] 4.5 Add `GET /api/receipts-invoices/purchase-orders?companyId=...` for issued PO fulfillment summaries used by the frontend workspace
- [x] 4.6 Temporarily allow local demo GET/POST calls to receipt and invoice API paths in `SecurityConfig` while preserving service-layer ownership validation
- [x] 4.7 Ensure Swagger/OpenAPI documents receipt list, receipt detail, receipt create, invoice list, invoice detail, invoice create, and PO fulfillment summary endpoints

## 5. Build the Receipts and Invoices Workspace

- [x] 5.1 Add frontend receipt, invoice, and fulfillment summary API types, query functions, mutation functions, and cache invalidation for create/list/detail flows
- [x] 5.2 Wire the sidebar “收货发票” navigation entry to a real `/receipts-invoices` route using the existing procurement workspace shell and active company context
- [x] 5.3 Build the issued PO fulfillment list with supplier, PO total, ordered quantity, received quantity, invoiced quantity, receipt summary, invoice summary, and invoice amount variance
- [x] 5.4 Build a PO fulfillment detail drawer that shows PO line snapshots, related receipts, related invoices, attachment metadata, cumulative quantities, and variance information from backend data
- [x] 5.5 Build a receipt creation drawer that lets the user select an issued PO, enter received quantities for valid PO lines, receiver, receipt date, note, and attachment metadata, then calls the receipt API
- [x] 5.6 Build an invoice creation drawer that lets the user select an issued PO, enter invoice number, invoice date, line quantities, line amounts, tax data, registered user, note, and attachment metadata, then calls the invoice API
- [x] 5.7 Add client-side disabled states and copy for no issued PO, fully received PO, fully invoiced PO, pending mutations, and unsaved drawer input while relying on backend validation for final enforcement

## 6. Verify Business Behavior and MVP Boundaries

- [x] 6.1 Add backend integration tests for migration, demo seed data, receipt creation, receipt detail, receipt list, partial/full receipt summaries, and receipt cumulative quantity rejection
- [x] 6.2 Add backend integration tests for invoice creation, invoice detail, invoice list, duplicate invoice rejection, cumulative invoice quantity rejection, and invoice amount variance summaries
- [x] 6.3 Add backend integration tests for cross-company receipt/invoice rejection, draft/cancelled PO rejection, unknown company rejection, unknown PO line rejection, and demo security plus service-layer validation
- [x] 6.4 Assert Swagger/OpenAPI contains the new receipt, invoice, and fulfillment summary endpoints and does not expose matching endpoints from this change
- [x] 6.5 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 6.6 Start local infrastructure, backend, and frontend, then verify from the browser that a 星河数字科技 issued PO can record partial receipt, record supplier invoice, refresh fulfillment summaries, and show invoice amount variance
- [x] 6.7 Confirm receipt and invoice creation does not create three-way matching results, matching difference items, payment records, RabbitMQ events, MinIO object uploads, or AI recommendations
- [x] 6.8 Record verification commands, demo PO IDs, receipt IDs, invoice IDs, browser URL, and environment caveats in verification notes before archive
