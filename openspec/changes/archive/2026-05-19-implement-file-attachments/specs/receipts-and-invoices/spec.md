## ADDED Requirements

### Requirement: Receipts and invoices preserve matching, payment, and AI boundaries while using real attachments
The system SHALL keep receipt and invoice registration focused on factual receipt/invoice data and uploaded file attachments while allowing the three-way matching capability to synchronously refresh matching results after successful receipt or invoice creation; the workflow SHALL NOT create payment, asynchronous messaging, or AI-generated decisions.

#### Scenario: Receipt creation refreshes matching records after matching is available
- **WHEN** a receipt is created for an issued purchase order after the three-way matching capability is available
- **THEN** the system MUST synchronously recalculate the current three-way matching result for the same `companyId` and `poId`
- **AND** the receipt and its uploaded attachments MUST remain available as source input for the matching detail
- **AND** the system MUST NOT create payment records, RabbitMQ events, or AI recommendations

#### Scenario: Invoice creation refreshes matching records after matching is available
- **WHEN** a supplier invoice is created for an issued purchase order after the three-way matching capability is available
- **THEN** the system MUST synchronously recalculate the current three-way matching result for the same `companyId` and `poId`
- **AND** the invoice and its uploaded attachments MUST remain available as source input for the matching detail
- **AND** the system MUST NOT create payment records, RabbitMQ events, or AI recommendations

#### Scenario: Receipt and invoice creation rolls back if matching refresh fails
- **WHEN** receipt or invoice creation succeeds in validation but the synchronous matching refresh fails for the same purchase order
- **THEN** the system MUST roll back the receipt or invoice creation transaction
- **AND** the system MUST NOT leave source receipt/invoice data or business attachment associations without a refreshed matching result

#### Scenario: Receipt and invoice workflow uses only required storage infrastructure
- **WHEN** a developer runs the receipt, invoice, and matching refresh workflow with real attachments in the MVP local environment
- **THEN** the workflow MUST use MySQL, synchronous service calls, and MinIO object storage
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek

## MODIFIED Requirements

### Requirement: Receipts are registered from issued purchase orders
The system SHALL allow warehouse or procurement users to create company-scoped receipt records from purchase orders whose status is `ISSUED`, including references to uploaded receiving proof attachments.

#### Scenario: Create partial receipt for an issued digital company PO
- **WHEN** a user from `company-digital` creates a receipt for an `ISSUED` `company-digital` purchase order with one or more valid PO line quantities, received date, receiver, note, and uploaded receipt attachment IDs
- **THEN** the system MUST persist a receipt header with a stable `receiptId`
- **AND** the system MUST persist receipt lines referencing the source `poId`, `poLineId`, line number, item snapshot, received quantity, and unit
- **AND** the receipt MUST persist `company-digital`, source supplier, receiver, attachment associations, and timestamps
- **AND** each associated uploaded attachment MUST be returned with downloadable metadata

#### Scenario: Reject receipt for draft or cancelled purchase order
- **WHEN** a user tries to create a receipt for a `DRAFT` or `CANCELLED` purchase order
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist a receipt, receipt line, receipt attachment, invoice, or matching record

#### Scenario: Reject receipt that exceeds PO line quantity
- **WHEN** a user submits a receipt whose line quantity would make cumulative received quantity greater than the source PO line quantity
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the existing receipts for that PO MUST remain unchanged

#### Scenario: Reject cross-company receipt creation
- **WHEN** a user from `company-digital` tries to create a receipt for a `company-manufacturing` purchase order
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

#### Scenario: Reject receipt with invalid uploaded attachment
- **WHEN** a user creates a receipt with an unknown attachment ID, metadata-only attachment, cross-company attachment, or attachment uploaded for a different PO context
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the existing receipt, invoice, matching, and attachment associations MUST remain unchanged

### Requirement: Supplier invoices are registered from issued purchase orders
The system SHALL allow finance or procurement users to create company-scoped supplier invoice records from purchase orders whose status is `ISSUED`, including references to uploaded invoice file attachments.

#### Scenario: Create supplier invoice for an issued digital company PO
- **WHEN** a user from `company-digital` creates a supplier invoice for an `ISSUED` `company-digital` purchase order with invoice number, invoice date, registered user, line quantities, line amounts, tax data, note, and uploaded invoice attachment IDs
- **THEN** the system MUST persist an invoice header with a stable `invoiceId`
- **AND** the system MUST persist invoice lines referencing the source `poId`, `poLineId`, line number, item snapshot, invoiced quantity, untaxed amount, tax rate, tax amount, total amount, and currency
- **AND** the invoice MUST persist `company-digital`, PO supplier, invoice number, registered user, attachment associations, and timestamps
- **AND** each associated uploaded attachment MUST be returned with downloadable metadata

#### Scenario: Reject invoice for draft or cancelled purchase order
- **WHEN** a user tries to create an invoice for a `DRAFT` or `CANCELLED` purchase order
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist an invoice, invoice line, invoice attachment, receipt, or matching record

#### Scenario: Reject invoice line outside the selected PO
- **WHEN** a user submits an invoice line whose `poLineId` does not belong to the selected `poId`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist a partial invoice

#### Scenario: Reject invoice quantity above PO line quantity
- **WHEN** a user submits an invoice whose line quantity would make cumulative invoiced quantity greater than the source PO line quantity
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the existing invoices for that PO MUST remain unchanged

#### Scenario: Preserve invoice amount variance for later matching
- **WHEN** a user creates an invoice whose total amount differs from the source PO total amount
- **THEN** the system MUST persist the invoice amounts as entered
- **AND** the PO fulfillment summary MUST expose the invoice amount variance
- **AND** the system MUST NOT create a three-way matching result or matching exception in this change

#### Scenario: Reject duplicate invoice number for same company supplier
- **WHEN** a user submits an invoice number that already exists for the same `companyId` and PO supplier
- **THEN** the system MUST reject the request with a conflict-style 4xx error
- **AND** the existing invoice MUST remain unchanged

#### Scenario: Reject invoice with invalid uploaded attachment
- **WHEN** a user creates an invoice with an unknown attachment ID, metadata-only attachment, cross-company attachment, or attachment uploaded for a different PO or supplier context
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the existing receipt, invoice, matching, and attachment associations MUST remain unchanged

### Requirement: Receipt and invoice APIs expose company-scoped lists, details, creation, and PO fulfillment summaries
The system SHALL expose receipt and invoice REST APIs that return company-scoped data, uploaded and metadata-only attachment data, support the current demo security model, and keep service-layer ownership validation explicit.

#### Scenario: List receipts for one company
- **WHEN** a caller requests `GET /api/receipts?companyId=company-digital`
- **THEN** the system MUST return only receipts owned by `company-digital`
- **AND** the response MUST NOT include receipts owned by `company-manufacturing`

#### Scenario: List invoices for one company
- **WHEN** a caller requests `GET /api/invoices?companyId=company-digital`
- **THEN** the system MUST return only invoices owned by `company-digital`
- **AND** the response MUST NOT include invoices owned by `company-manufacturing`

#### Scenario: Query receipt detail
- **WHEN** a caller requests `GET /api/receipts/{receiptId}?companyId=company-digital` for an existing receipt
- **THEN** the system MUST return the receipt header, source PO summary, supplier snapshot, receipt lines, uploaded and metadata-only attachment metadata, note, receiver, status, and timestamps

#### Scenario: Query invoice detail
- **WHEN** a caller requests `GET /api/invoices/{invoiceId}?companyId=company-digital` for an existing invoice
- **THEN** the system MUST return the invoice header, source PO summary, supplier snapshot, invoice lines, uploaded and metadata-only attachment metadata, note, registered user, amount totals, status, and timestamps

#### Scenario: Query issued PO fulfillment summaries
- **WHEN** a caller requests `GET /api/receipts-invoices/purchase-orders?companyId=company-digital`
- **THEN** the system MUST return only `ISSUED` purchase orders owned by `company-digital`
- **AND** each row MUST include PO amount, supplier, ordered line quantities, cumulative received quantity, cumulative invoiced quantity, cumulative invoice total amount, receipt status summary, invoice status summary, invoice amount variance, and attachment counts

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests receipt, invoice, or fulfillment summary data with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents receipt and invoice endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include receipt list, receipt detail, receipt create, invoice list, invoice detail, invoice create, PO fulfillment summary, and attachment reference shapes

#### Scenario: Demo frontend can call receipt and invoice APIs
- **WHEN** the frontend calls receipt and invoice GET and POST endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, actor, receiver, registered user, purchase order, supplier, line, and attachment ownership or scope

### Requirement: Frontend provides a receipts and invoices workspace
The frontend SHALL provide a real receipts and invoices page in the procurement workspace for reviewing issued PO fulfillment, uploading receipt and invoice attachments, creating receipts, creating invoices, and viewing receipt and invoice details.

#### Scenario: Open receipts and invoices page
- **WHEN** a user selects “收货发票” in the workspace navigation
- **THEN** the system MUST open a `/receipts-invoices` page
- **AND** the page MUST load issued PO fulfillment summaries, receipts, invoices, and attachment data from backend APIs rather than static mock data

#### Scenario: Create receipt from the frontend
- **WHEN** a warehouse or procurement user selects an issued PO, enters received quantities for valid PO lines, uploads receiving proof attachments, fills receiver and receipt metadata, and submits the receipt form
- **THEN** the frontend MUST call the attachment upload API as needed, then call the receipt create API with uploaded attachment IDs
- **AND** the receipt list and PO fulfillment summary MUST refresh to show the backend `receiptId`, updated received quantities, and attachment state

#### Scenario: Create invoice from the frontend
- **WHEN** a finance or procurement user selects an issued PO, enters invoice number, invoice date, line quantities, line amounts, tax data, registered user, uploads invoice attachments, and submits the invoice form
- **THEN** the frontend MUST call the attachment upload API as needed, then call the invoice create API with uploaded attachment IDs
- **AND** the invoice list and PO fulfillment summary MUST refresh to show the backend `invoiceId`, invoice totals, invoice amount variance when present, and attachment state

#### Scenario: Review PO fulfillment detail
- **WHEN** a user selects an issued PO from the receipts and invoices workspace
- **THEN** the frontend MUST show PO supplier, PO amount, ordered lines, cumulative received quantities, cumulative invoiced quantities, invoice amount variance, related receipts, related invoices, attachment metadata, and download availability

#### Scenario: Guard unavailable actions in the frontend
- **WHEN** no issued PO is available for the selected company, a PO is already fully received or fully invoiced, an attachment is metadata-only, or a file upload is still pending
- **THEN** the frontend MUST disable invalid create or download actions with a client-visible reason
- **AND** it MUST still rely on backend validation for final enforcement

## REMOVED Requirements

### Requirement: Receipt and invoice attachment metadata is stored without object upload
**Reason**: The roadmap's real attachment upload slice replaces placeholder-only receipt and invoice attachment behavior with MinIO-backed files and MySQL metadata.
**Migration**: Existing metadata-only receipt and invoice attachments remain visible as non-downloadable historical metadata; new receipt and invoice attachments must be uploaded through the file attachment API before business submission.

### Requirement: Receipts and invoices do not implement matching, payment, upload, or AI workflows
**Reason**: This change intentionally adds upload for receipt and invoice attachments while preserving the payment, asynchronous messaging, and AI non-goals.
**Migration**: Matching refresh behavior moves to the new requirement "Receipts and invoices preserve matching, payment, and AI boundaries while using real attachments".
