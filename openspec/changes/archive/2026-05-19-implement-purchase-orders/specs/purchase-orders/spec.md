## ADDED Requirements

### Requirement: Purchase orders are created from comparable RFQ quotes
The system SHALL allow a procurement user to create exactly one company-scoped purchase order from an effective supplier quote on an RFQ whose status is `COMPARISON_READY`.

#### Scenario: Create PO from top-ranked digital IT hardware RFQ quote
- **WHEN** a procurement user from `company-digital` creates a purchase order from an effective quote on a `company-digital` RFQ with status `COMPARISON_READY`
- **THEN** the system MUST persist a purchase order with status `DRAFT`
- **AND** the purchase order MUST reference the source `rfqId`, `quoteId`, `requestId`, `approvalId`, `companyId`, procurement user, supplier, category, budget account, currency, quote amount, tax rate, tax amount, total amount, expected delivery date, and line item snapshot
- **AND** the response MUST return a stable `poId`

#### Scenario: Reject PO creation before RFQ comparison is ready
- **WHEN** a procurement user tries to create a purchase order from an RFQ whose status is `ISSUED` or `QUOTING`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist a purchase order, purchase order line, delivery schedule, status record, receipt, invoice, or matching record

#### Scenario: Reject PO creation for cross-company RFQ
- **WHEN** a procurement user from `company-digital` tries to create a purchase order from an RFQ owned by `company-manufacturing`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

#### Scenario: Reject duplicate PO for same RFQ
- **WHEN** a purchase order already exists for an RFQ
- **THEN** a second create request for the same `rfqId` MUST be rejected with a conflict-style 4xx error
- **AND** the existing purchase order MUST remain unchanged

#### Scenario: Reject quote outside RFQ scope
- **WHEN** a procurement user submits a purchase order create request with a `quoteId` that does not belong to the selected `rfqId`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist a partial purchase order

### Requirement: Purchase orders snapshot supplier, quote, request, and delivery data
The system SHALL store purchase order header, line, supplier, amount, tax, and delivery schedule data as stable snapshots for downstream receipt, invoice, and three-way matching workflows.

#### Scenario: Snapshot selected supplier and quote amounts
- **WHEN** a purchase order is created from a selected RFQ quote
- **THEN** the purchase order MUST snapshot supplier identifier, supplier name, service scope, risk level, quote amount, tax rate, tax amount, total amount, currency, delivery date, and quote updated timestamp
- **AND** later RFQ quote updates MUST NOT mutate the persisted purchase order snapshot

#### Scenario: Snapshot source request line items
- **WHEN** a purchase order is created from an RFQ that originated from a purchase request with line items
- **THEN** the purchase order MUST persist one purchase order line for each source request line
- **AND** each purchase order line MUST include line number, item name, specification, quantity, unit, category, and amount snapshot fields usable by future receiving workflows

#### Scenario: Record delivery schedule
- **WHEN** a procurement user creates a purchase order with planned delivery date, delivery location, contact person, contact phone, and delivery note
- **THEN** the system MUST persist a delivery schedule associated with the `poId`
- **AND** the purchase order detail response MUST include the delivery schedule data

#### Scenario: Preserve company ownership boundary
- **WHEN** a purchase order is created for `company-digital`
- **THEN** the purchase order, lines, delivery schedule, and status records MUST all persist `company-digital` ownership either directly or through the purchase order header
- **AND** company-scoped queries for `company-manufacturing` MUST NOT return that purchase order

### Requirement: Purchase order status flow supports draft, publish, and cancellation
The system SHALL maintain a small MVP purchase order status flow with auditable status records.

#### Scenario: Publish draft PO
- **WHEN** a procurement user publishes a `DRAFT` purchase order owned by the same company
- **THEN** the purchase order status MUST change to `ISSUED`
- **AND** the system MUST append a status record containing the publish action, actor, optional comment, and timestamp

#### Scenario: Reject publish for non-draft PO
- **WHEN** a caller tries to publish a purchase order whose status is `ISSUED` or `CANCELLED`
- **THEN** the system MUST reject the operation with a conflict-style 4xx error
- **AND** the purchase order status and status records MUST remain unchanged

#### Scenario: Cancel draft or issued PO
- **WHEN** an authorized actor cancels a purchase order whose status is `DRAFT` or `ISSUED` with a cancellation reason
- **THEN** the purchase order status MUST change to `CANCELLED`
- **AND** the system MUST append a status record containing the cancel action, actor, reason, and timestamp

#### Scenario: Reject repeated cancellation
- **WHEN** a caller tries to cancel a purchase order whose status is already `CANCELLED`
- **THEN** the system MUST reject the operation with a conflict-style 4xx error
- **AND** the system MUST NOT create a duplicate cancellation record

### Requirement: Purchase order APIs expose company-scoped list, detail, creation, and status actions
The system SHALL expose purchase order REST APIs that return company-scoped PO data and support the current demo security model.

#### Scenario: List purchase orders for one company
- **WHEN** a caller requests `GET /api/purchase-orders?companyId=company-digital`
- **THEN** the system MUST return only purchase orders owned by `company-digital`
- **AND** the response MUST NOT include purchase orders owned by `company-manufacturing`

#### Scenario: Query purchase order detail
- **WHEN** a caller requests `GET /api/purchase-orders/{poId}` for an existing purchase order
- **THEN** the system MUST return the purchase order header, source RFQ summary, source request summary, selected supplier, quote snapshot, line items, delivery schedule, status records, current status, and timestamps

#### Scenario: Create purchase order through API
- **WHEN** a caller submits `POST /api/purchase-orders` with valid `companyId`, `rfqId`, `quoteId`, procurement user, and delivery schedule data
- **THEN** the system MUST create a `DRAFT` purchase order and return its detail response

#### Scenario: Publish purchase order through API
- **WHEN** a caller submits `POST /api/purchase-orders/{poId}/publish` with a valid actor from the purchase order company
- **THEN** the system MUST publish the purchase order and return the updated detail response

#### Scenario: Cancel purchase order through API
- **WHEN** a caller submits `POST /api/purchase-orders/{poId}/cancel` with a valid actor from the purchase order company and a reason
- **THEN** the system MUST cancel the purchase order and return the updated detail response

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests the purchase order list with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents purchase order endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include purchase order list, detail, create, publish, and cancel endpoints with request and response shapes

#### Scenario: Demo frontend can call purchase order APIs
- **WHEN** the frontend calls purchase order GET and POST endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, actor, procurement user, RFQ, quote, supplier, and purchase order ownership or scope

### Requirement: Frontend provides a purchase order workspace
The frontend SHALL provide a real purchase order page in the procurement workspace for creating POs from comparable RFQ quotes, viewing PO details, and operating MVP status actions.

#### Scenario: Open purchase order page
- **WHEN** a user selects “采购订单” in the workspace navigation
- **THEN** the system MUST open a `/purchase-orders` page
- **AND** the page MUST load purchase order and eligible RFQ quote data from backend APIs rather than static mock data

#### Scenario: Create PO from eligible RFQ quote in the frontend
- **WHEN** a procurement user selects an eligible `COMPARISON_READY` RFQ quote, fills delivery schedule fields, and submits the PO form
- **THEN** the frontend MUST call the purchase order create API
- **AND** the new purchase order MUST appear in the purchase order list with its backend `poId`, source `rfqId`, supplier, total amount, and `DRAFT` status

#### Scenario: Review purchase order detail
- **WHEN** a user selects a purchase order from the list
- **THEN** the frontend MUST show source RFQ information, selected supplier, quote amount, tax amount, total amount, line item snapshot, delivery schedule, status records, and current status

#### Scenario: Publish PO from the frontend
- **WHEN** a procurement user publishes a `DRAFT` purchase order from the detail view
- **THEN** the frontend MUST call the purchase order publish API
- **AND** the purchase order list and detail view MUST refresh to show `ISSUED` status and the publish record

#### Scenario: Cancel PO from the frontend
- **WHEN** a valid actor cancels a `DRAFT` or `ISSUED` purchase order with a reason from the detail view
- **THEN** the frontend MUST call the purchase order cancel API
- **AND** the purchase order list and detail view MUST refresh to show `CANCELLED` status and the cancellation record

### Requirement: Purchase orders do not implement downstream receiving, invoice, matching, or AI workflows
The system SHALL keep this change focused on purchase order creation and status management, and SHALL NOT create downstream execution records or AI-generated decisions.

#### Scenario: PO publication does not create downstream records
- **WHEN** a purchase order reaches `ISSUED`
- **THEN** the system MUST NOT create receipts, invoices, three-way matching results, supplier portal tasks, RabbitMQ events, payment records, or AI recommendations
- **AND** the purchase order MUST remain the input for later receiving and invoice slices

#### Scenario: PO workflow does not require deferred infrastructure
- **WHEN** a developer runs the purchase order workflow in the MVP local environment
- **THEN** the workflow MUST use MySQL and synchronous service calls
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
