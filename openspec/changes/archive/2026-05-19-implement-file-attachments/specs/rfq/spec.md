## MODIFIED Requirements

### Requirement: Supplier quotes are captured for invited suppliers
The system SHALL allow a procurement user to record the current effective quote for each invited supplier, including amount, tax, delivery, score, risk note, and uploaded quotation attachment references.

#### Scenario: Record quote for invited supplier
- **WHEN** a procurement user records a quote for an invited supplier on an `ISSUED` RFQ with quote amount, tax rate, delivery date, supplier score, risk note, and uploaded quotation attachment IDs
- **THEN** the system MUST persist the quote for the `rfqId` and `supplierId`
- **AND** the RFQ status MUST move to `QUOTING`
- **AND** the response MUST include the quote amount, tax amount, total amount, delivery date, supplier score, risk note, attachment metadata, downloadable flags, and updated timestamp

#### Scenario: Update existing supplier quote
- **WHEN** a procurement user records a new quote payload for a supplier that already has a quote on the same RFQ
- **THEN** the system MUST update the current effective quote instead of creating a duplicate effective quote
- **AND** the RFQ comparison response MUST use the updated quote values
- **AND** the quote's uploaded attachment associations MUST be replaced by the valid uploaded attachment IDs supplied in the update request

#### Scenario: Reject quote from non-invited supplier
- **WHEN** a procurement user tries to record a quote for a supplier that was not invited to the RFQ
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** no quote or attachment metadata MUST be persisted

#### Scenario: Associate uploaded quotation attachments
- **WHEN** a procurement user includes uploaded attachment IDs while recording a quote
- **THEN** the system MUST verify each attachment is `READY`, has purpose `RFQ_QUOTE`, belongs to the same `companyId`, `rfqId`, and `supplierId`, and is not linked to another incompatible target
- **AND** the system MUST persist the quote attachment association with the uploaded object's metadata and storage key

#### Scenario: Reject invalid quotation attachment references
- **WHEN** a procurement user records a quote with an unknown attachment ID, a metadata-only attachment, a cross-company attachment, or an attachment uploaded for a different RFQ or supplier
- **THEN** the system MUST reject the quote request with a client-visible 4xx error
- **AND** the existing quote and attachment associations MUST remain unchanged

#### Scenario: Preserve metadata-only quotation attachments for existing demo data
- **WHEN** an RFQ quote already has attachment metadata without a MinIO object key
- **THEN** the system MUST continue returning the metadata in quote detail and comparison responses
- **AND** the attachment MUST be marked as not downloadable

### Requirement: RFQ APIs expose company-scoped list, detail, and comparison data
The system SHALL expose RFQ REST APIs that return RFQ list, detail, quote, attachment, and comparison data scoped by company ownership and usable in the current demo security model.

#### Scenario: List RFQs for one company
- **WHEN** a caller requests `GET /api/rfqs?companyId=company-digital`
- **THEN** the system MUST return only RFQs owned by `company-digital`
- **AND** the response MUST NOT include RFQs owned by `company-manufacturing`

#### Scenario: Query RFQ detail
- **WHEN** a caller requests `GET /api/rfqs/{rfqId}` for an existing RFQ
- **THEN** the system MUST return the RFQ header, source purchase request summary, approval summary, invited suppliers, current quotes, uploaded and metadata-only attachment metadata, status, and timestamps

#### Scenario: Compare supplier quotes
- **WHEN** a caller requests `GET /api/rfqs/{rfqId}/comparison` for an RFQ with at least two valid quotes
- **THEN** the system MUST return quote comparison rows sorted by deterministic recommendation rank
- **AND** each row MUST include supplier, quote amount, tax amount, total amount, delivery date, supplier score, risk level, risk note, rank, and attachment metadata with downloadable flags

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests the RFQ list with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents RFQ endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include RFQ create, list, detail, quote upsert, comparison, and RFQ attachment reference shapes

#### Scenario: Demo frontend can call RFQ APIs
- **WHEN** the frontend calls RFQ GET, POST, and PUT endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, procurement user, purchase request, approval, RFQ, supplier, and attachment ownership or scope

### Requirement: Frontend provides an RFQ workflow
The frontend SHALL provide a real RFQ page in the procurement workspace for creating RFQs from approved purchase requests, selecting suppliers, uploading quotation attachments, recording quotes, and comparing supplier responses.

#### Scenario: Open RFQ page
- **WHEN** a user selects “询报价” in the workspace navigation
- **THEN** the system MUST open a `/rfqs` page
- **AND** the page MUST load RFQ, approved purchase request, supplier, quote, and attachment data from backend APIs rather than static mock data

#### Scenario: Create RFQ from approved request in the frontend
- **WHEN** a procurement user selects an approved purchase request, chooses valid suppliers, and submits the RFQ form
- **THEN** the frontend MUST call the RFQ create API
- **AND** the new RFQ MUST appear in the RFQ list with its backend `rfqId`, source `requestId`, supplier count, and `ISSUED` status

#### Scenario: Record quotes from the frontend
- **WHEN** a procurement user opens an RFQ detail, uploads or selects valid quotation attachments for an invited supplier, and records quote data
- **THEN** the frontend MUST call the attachment upload API as needed, then call the quote upsert API with uploaded attachment IDs
- **AND** the RFQ detail and comparison views MUST refresh to show the saved quote and backend attachment metadata

#### Scenario: View comparison and recommendation
- **WHEN** an RFQ has at least two valid supplier quotes
- **THEN** the frontend MUST show a comparison table with price, tax, delivery date, supplier score, risk level, risk note, attachment metadata, download availability, and recommendation rank
- **AND** the top-ranked quote MUST be visually identifiable without creating a purchase order

#### Scenario: Guard unavailable attachment actions in RFQ detail
- **WHEN** an attachment is metadata-only, belongs to another supplier context, or is still uploading
- **THEN** the frontend MUST disable invalid download or save actions with a client-visible reason
- **AND** it MUST still rely on backend validation for final enforcement

### Requirement: RFQ does not implement downstream procurement or AI workflows
The system SHALL keep RFQ focused on inquiry, uploaded quotation attachments, and quote comparison, and SHALL NOT create downstream procurement execution records or AI-generated decisions.

#### Scenario: RFQ comparison does not create purchase order
- **WHEN** an RFQ reaches `COMPARISON_READY` or returns a top-ranked quote
- **THEN** the system MUST NOT create purchase orders, receipts, invoices, matching records, supplier portal tasks, or AI recommendations
- **AND** the RFQ comparison result MUST remain input for the existing PO slice

#### Scenario: RFQ upload workflow uses only required storage infrastructure
- **WHEN** a developer runs the RFQ workflow with real quotation attachments in the MVP local environment
- **THEN** the workflow MUST use MySQL, synchronous service calls, and MinIO object storage
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
