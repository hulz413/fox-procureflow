## ADDED Requirements

### Requirement: RFQs are created from approved purchase requests
The system SHALL allow a procurement user to create exactly one company-scoped RFQ from a purchase request only after the related approval instance has reached `APPROVED`.

#### Scenario: Create RFQ from approved digital IT hardware request
- **WHEN** a procurement user from `company-digital` creates an RFQ for an approved `company-digital` purchase request with category `category-it-hardware`
- **THEN** the system MUST persist an RFQ with status `ISSUED`
- **AND** the RFQ MUST reference the source `requestId`, `approvalId`, `companyId`, requester, procurement user, category, budget account, total amount, currency, expected delivery date, and line item snapshot
- **AND** the response MUST return a stable `rfqId`

#### Scenario: Reject RFQ creation before approval completes
- **WHEN** a procurement user tries to create an RFQ for a purchase request whose approval instance is `IN_PROGRESS`, `REJECTED`, or `WITHDRAWN`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist an RFQ, RFQ supplier invitation, quote, purchase order, receipt, invoice, or matching record

#### Scenario: Reject RFQ creation for cross-company request
- **WHEN** a procurement user from `company-digital` tries to create an RFQ for a purchase request owned by `company-manufacturing`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

#### Scenario: Reject duplicate RFQ for same purchase request
- **WHEN** an RFQ already exists for an approved purchase request
- **THEN** a second create request for the same `requestId` MUST be rejected with a conflict-style 4xx error
- **AND** the existing RFQ MUST remain unchanged

### Requirement: RFQs invite suppliers from the group shared supplier pool
The system SHALL allow RFQs to include candidate suppliers from the group-level shared supplier pool while keeping the RFQ itself owned by the source purchase request company.

#### Scenario: Invite three suppliers for a digital IT hardware RFQ
- **WHEN** a procurement user creates an RFQ for a `category-it-hardware` purchase request and selects three valid supplier identifiers from the group shared supplier pool
- **THEN** the system MUST persist one invitation row for each selected supplier
- **AND** each invitation MUST snapshot the supplier name, risk level, service scope, and category coverage used for comparison

#### Scenario: Reject supplier that does not cover the request category
- **WHEN** a procurement user selects a supplier whose category coverage does not include the purchase request category
- **THEN** the system MUST reject the RFQ create request with a client-visible 4xx error
- **AND** the system MUST NOT persist a partial RFQ

#### Scenario: Reject duplicate supplier selection
- **WHEN** a procurement user submits an RFQ create request containing the same `supplierId` more than once
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the error MUST identify that supplier selection must be unique

### Requirement: Supplier quotes are captured for invited suppliers
The system SHALL allow a procurement user to record the current effective quote for each invited supplier, including amount, tax, delivery, score, risk note, and attachment metadata placeholders.

#### Scenario: Record quote for invited supplier
- **WHEN** a procurement user records a quote for an invited supplier on an `ISSUED` RFQ with quote amount, tax rate, delivery date, supplier score, risk note, and attachment file metadata
- **THEN** the system MUST persist the quote for the `rfqId` and `supplierId`
- **AND** the RFQ status MUST move to `QUOTING`
- **AND** the response MUST include the quote amount, tax amount, total amount, delivery date, supplier score, risk note, attachment metadata, and updated timestamp

#### Scenario: Update existing supplier quote
- **WHEN** a procurement user records a new quote payload for a supplier that already has a quote on the same RFQ
- **THEN** the system MUST update the current effective quote instead of creating a duplicate effective quote
- **AND** the RFQ comparison response MUST use the updated quote values

#### Scenario: Reject quote from non-invited supplier
- **WHEN** a procurement user tries to record a quote for a supplier that was not invited to the RFQ
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** no quote or attachment metadata MUST be persisted

#### Scenario: Store attachment metadata without object upload
- **WHEN** a procurement user includes attachment file name, description, content type, and size metadata with a quote
- **THEN** the system MUST store the metadata with the quote
- **AND** the system MUST NOT require a MinIO object key or upload file bytes in this change

### Requirement: RFQ APIs expose company-scoped list, detail, and comparison data
The system SHALL expose RFQ REST APIs that return RFQ list, detail, quote, and comparison data scoped by company ownership and usable in the current demo security model.

#### Scenario: List RFQs for one company
- **WHEN** a caller requests `GET /api/rfqs?companyId=company-digital`
- **THEN** the system MUST return only RFQs owned by `company-digital`
- **AND** the response MUST NOT include RFQs owned by `company-manufacturing`

#### Scenario: Query RFQ detail
- **WHEN** a caller requests `GET /api/rfqs/{rfqId}` for an existing RFQ
- **THEN** the system MUST return the RFQ header, source purchase request summary, approval summary, invited suppliers, current quotes, attachment metadata placeholders, status, and timestamps

#### Scenario: Compare supplier quotes
- **WHEN** a caller requests `GET /api/rfqs/{rfqId}/comparison` for an RFQ with at least two valid quotes
- **THEN** the system MUST return quote comparison rows sorted by deterministic recommendation rank
- **AND** each row MUST include supplier, quote amount, tax amount, total amount, delivery date, supplier score, risk level, risk note, and rank

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests the RFQ list with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents RFQ endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include RFQ create, list, detail, quote upsert, and comparison endpoints

#### Scenario: Demo frontend can call RFQ APIs
- **WHEN** the frontend calls RFQ GET, POST, and PUT endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, procurement user, purchase request, approval, RFQ, and supplier ownership or scope

### Requirement: Frontend provides an RFQ workflow
The frontend SHALL provide a real RFQ page in the procurement workspace for creating RFQs from approved purchase requests, selecting suppliers, recording quotes, and comparing supplier responses.

#### Scenario: Open RFQ page
- **WHEN** a user selects “询报价” in the workspace navigation
- **THEN** the system MUST open a `/rfqs` page
- **AND** the page MUST load RFQ, approved purchase request, supplier, and quote data from backend APIs rather than static mock data

#### Scenario: Create RFQ from approved request in the frontend
- **WHEN** a procurement user selects an approved purchase request, chooses valid suppliers, and submits the RFQ form
- **THEN** the frontend MUST call the RFQ create API
- **AND** the new RFQ MUST appear in the RFQ list with its backend `rfqId`, source `requestId`, supplier count, and `ISSUED` status

#### Scenario: Record quotes from the frontend
- **WHEN** a procurement user opens an RFQ detail and records quote data for an invited supplier
- **THEN** the frontend MUST call the quote upsert API
- **AND** the RFQ detail and comparison views MUST refresh to show the saved quote

#### Scenario: View comparison and recommendation
- **WHEN** an RFQ has at least two valid supplier quotes
- **THEN** the frontend MUST show a comparison table with price, tax, delivery date, supplier score, risk level, risk note, attachment metadata, and recommendation rank
- **AND** the top-ranked quote MUST be visually identifiable without creating a purchase order

### Requirement: RFQ does not implement downstream procurement or AI workflows
The system SHALL keep RFQ focused on inquiry and quote comparison, and SHALL NOT create downstream procurement execution records or AI-generated decisions.

#### Scenario: RFQ comparison does not create purchase order
- **WHEN** an RFQ reaches `COMPARISON_READY` or returns a top-ranked quote
- **THEN** the system MUST NOT create purchase orders, receipts, invoices, matching records, supplier portal tasks, or AI recommendations
- **AND** the RFQ comparison result MUST remain input for a later PO slice

#### Scenario: RFQ does not require deferred infrastructure
- **WHEN** a developer runs the RFQ workflow in the MVP local environment
- **THEN** the workflow MUST use MySQL and synchronous service calls
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, or Keycloak
