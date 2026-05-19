## Purpose

Define PO-based receipt and supplier invoice registration for Fox Procureflow, including company-scoped APIs, attachment metadata placeholders, frontend workspace behavior, and the boundary before three-way matching.

## Requirements

### Requirement: Receipts are registered from issued purchase orders
The system SHALL allow warehouse or procurement users to create company-scoped receipt records from purchase orders whose status is `ISSUED`.

#### Scenario: Create partial receipt for an issued digital company PO
- **WHEN** a user from `company-digital` creates a receipt for an `ISSUED` `company-digital` purchase order with one or more valid PO line quantities, received date, receiver, note, and attachment metadata
- **THEN** the system MUST persist a receipt header with a stable `receiptId`
- **AND** the system MUST persist receipt lines referencing the source `poId`, `poLineId`, line number, item snapshot, received quantity, and unit
- **AND** the receipt MUST persist `company-digital`, source supplier, receiver, attachment metadata, and timestamps

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

### Requirement: Supplier invoices are registered from issued purchase orders
The system SHALL allow finance or procurement users to create company-scoped supplier invoice records from purchase orders whose status is `ISSUED`.

#### Scenario: Create supplier invoice for an issued digital company PO
- **WHEN** a user from `company-digital` creates a supplier invoice for an `ISSUED` `company-digital` purchase order with invoice number, invoice date, registered user, line quantities, line amounts, tax data, note, and attachment metadata
- **THEN** the system MUST persist an invoice header with a stable `invoiceId`
- **AND** the system MUST persist invoice lines referencing the source `poId`, `poLineId`, line number, item snapshot, invoiced quantity, untaxed amount, tax rate, tax amount, total amount, and currency
- **AND** the invoice MUST persist `company-digital`, PO supplier, invoice number, registered user, attachment metadata, and timestamps

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

### Requirement: Receipt and invoice APIs expose company-scoped lists, details, creation, and PO fulfillment summaries
The system SHALL expose receipt and invoice REST APIs that return company-scoped data, support the current demo security model, and keep service-layer ownership validation explicit.

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
- **THEN** the system MUST return the receipt header, source PO summary, supplier snapshot, receipt lines, attachment metadata, note, receiver, status, and timestamps

#### Scenario: Query invoice detail
- **WHEN** a caller requests `GET /api/invoices/{invoiceId}?companyId=company-digital` for an existing invoice
- **THEN** the system MUST return the invoice header, source PO summary, supplier snapshot, invoice lines, attachment metadata, note, registered user, amount totals, status, and timestamps

#### Scenario: Query issued PO fulfillment summaries
- **WHEN** a caller requests `GET /api/receipts-invoices/purchase-orders?companyId=company-digital`
- **THEN** the system MUST return only `ISSUED` purchase orders owned by `company-digital`
- **AND** each row MUST include PO amount, supplier, ordered line quantities, cumulative received quantity, cumulative invoiced quantity, cumulative invoice total amount, receipt status summary, invoice status summary, and invoice amount variance

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests receipt, invoice, or fulfillment summary data with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents receipt and invoice endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include receipt list, receipt detail, receipt create, invoice list, invoice detail, invoice create, and PO fulfillment summary endpoints with request and response shapes

#### Scenario: Demo frontend can call receipt and invoice APIs
- **WHEN** the frontend calls receipt and invoice GET and POST endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, actor, receiver, registered user, purchase order, supplier, and line ownership or scope

### Requirement: Receipt and invoice attachment metadata is stored without object upload
The system SHALL store attachment metadata placeholders for receipts and invoices without requiring object storage or uploaded file bytes.

#### Scenario: Store receipt attachment metadata
- **WHEN** a user includes receipt attachment file name, description, content type, and size metadata while creating a receipt
- **THEN** the system MUST persist the metadata with the receipt
- **AND** the system MUST NOT require a MinIO object key or upload file bytes in this change

#### Scenario: Store invoice attachment metadata
- **WHEN** a user includes invoice attachment file name, description, content type, and size metadata while creating an invoice
- **THEN** the system MUST persist the metadata with the invoice
- **AND** the system MUST NOT require a MinIO object key or upload file bytes in this change

### Requirement: Frontend provides a receipts and invoices workspace
The frontend SHALL provide a real receipts and invoices page in the procurement workspace for reviewing issued PO fulfillment, creating receipts, creating invoices, and viewing receipt and invoice details.

#### Scenario: Open receipts and invoices page
- **WHEN** a user selects “收货发票” in the workspace navigation
- **THEN** the system MUST open a `/receipts-invoices` page
- **AND** the page MUST load issued PO fulfillment summaries, receipts, and invoices from backend APIs rather than static mock data

#### Scenario: Create receipt from the frontend
- **WHEN** a warehouse or procurement user selects an issued PO, enters received quantities for valid PO lines, fills receiver and receipt metadata, and submits the receipt form
- **THEN** the frontend MUST call the receipt create API
- **AND** the receipt list and PO fulfillment summary MUST refresh to show the backend `receiptId` and updated received quantities

#### Scenario: Create invoice from the frontend
- **WHEN** a finance or procurement user selects an issued PO, enters invoice number, invoice date, line quantities, line amounts, tax data, registered user, and attachment metadata, and submits the invoice form
- **THEN** the frontend MUST call the invoice create API
- **AND** the invoice list and PO fulfillment summary MUST refresh to show the backend `invoiceId`, invoice totals, and invoice amount variance when present

#### Scenario: Review PO fulfillment detail
- **WHEN** a user selects an issued PO from the receipts and invoices workspace
- **THEN** the frontend MUST show PO supplier, PO amount, ordered lines, cumulative received quantities, cumulative invoiced quantities, invoice amount variance, related receipts, related invoices, and attachment metadata

#### Scenario: Guard unavailable actions in the frontend
- **WHEN** no issued PO is available for the selected company or a PO is already fully received or fully invoiced
- **THEN** the frontend MUST disable invalid create actions with a client-visible reason
- **AND** it MUST still rely on backend validation for final enforcement

### Requirement: Receipts and invoices do not implement matching, payment, upload, or AI workflows
The system SHALL keep this change focused on receipt and invoice registration and SHALL NOT create downstream matching, payment, object storage, or AI-generated decisions.

#### Scenario: Receipt creation does not create matching records
- **WHEN** a receipt is created for a purchase order
- **THEN** the system MUST NOT create three-way matching results, matching difference items, matching exceptions, payment records, RabbitMQ events, or AI recommendations
- **AND** the receipt MUST remain available as input for a later three-way matching slice

#### Scenario: Invoice creation does not create matching records
- **WHEN** an invoice is created for a purchase order
- **THEN** the system MUST NOT create three-way matching results, matching difference items, matching exceptions, payment records, RabbitMQ events, or AI recommendations
- **AND** the invoice MUST remain available as input for a later three-way matching slice

#### Scenario: Receipt and invoice workflow does not require deferred infrastructure
- **WHEN** a developer runs the receipt and invoice workflow in the MVP local environment
- **THEN** the workflow MUST use MySQL and synchronous service calls
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
