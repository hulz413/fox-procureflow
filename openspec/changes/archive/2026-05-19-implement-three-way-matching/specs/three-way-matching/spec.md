## ADDED Requirements

### Requirement: Three-way matching results are calculated from issued purchase orders
The system SHALL calculate company-scoped three-way matching results from issued purchase orders, cumulative receipt lines, and cumulative supplier invoice lines.

#### Scenario: Create pending matching result for issued PO without complete inputs
- **WHEN** the matching service recalculates an `ISSUED` `company-digital` purchase order that has no receipt or invoice data
- **THEN** the system MUST persist or update one current matching result for that `poId`
- **AND** the matching result MUST have status `PENDING_INPUT`
- **AND** the matching result MUST reference `company-digital`, the source `poId`, supplier, PO amount, and last calculated timestamp

#### Scenario: Calculate matched result for fully received and invoiced PO
- **WHEN** the matching service recalculates an `ISSUED` purchase order whose PO line quantities equal cumulative receipt quantities and cumulative invoice quantities, and whose invoice total amount equals the PO total amount
- **THEN** the matching result MUST have status `MATCHED`
- **AND** the matching result MUST have zero current difference items
- **AND** the result MUST remain scoped to the source purchase order company

#### Scenario: Ignore draft or cancelled PO during matching
- **WHEN** a caller tries to recalculate matching for a `DRAFT` or `CANCELLED` purchase order
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT create or update a matching result, difference item, or handling record for that purchase order

#### Scenario: Recalculate matching idempotently
- **WHEN** the matching service recalculates the same `company-digital` purchase order twice without source PO, receipt, or invoice changes
- **THEN** the system MUST keep exactly one current matching result for that `poId`
- **AND** the system MUST NOT duplicate current difference items
- **AND** existing manual handling records MUST remain available in the matching detail

### Requirement: Matching differences identify quantity and amount exceptions
The system SHALL persist current difference items when PO, receipt, and invoice data do not align.

#### Scenario: Detect invoice amount higher than PO
- **WHEN** a `company-digital` supplier invoice total is 2,300 higher than the source purchase order total after recalculation
- **THEN** the matching result MUST have status `EXCEPTION`
- **AND** the system MUST persist an `INVOICE_AMOUNT_MISMATCH` difference item with PO amount, invoice amount, difference amount, currency, and severity
- **AND** the matching result MUST appear in the company exception queue

#### Scenario: Detect invoice quantity greater than received quantity
- **WHEN** a purchase order line has cumulative invoice quantity greater than cumulative received quantity
- **THEN** the matching result MUST have status `EXCEPTION`
- **AND** the system MUST persist an `INVOICE_QUANTITY_OVER_RECEIPT` difference item referencing the source `poLineId`
- **AND** the difference item MUST include ordered quantity, received quantity, invoiced quantity, unit, and line item snapshot

#### Scenario: Detect invoice without receipt
- **WHEN** an issued purchase order has supplier invoice lines but no corresponding receipt lines
- **THEN** the matching result MUST have status `EXCEPTION`
- **AND** the system MUST persist a `MISSING_RECEIPT` difference item
- **AND** the exception queue MUST show the purchase order supplier and invoice summary for finance review

#### Scenario: Keep received but not invoiced PO as pending input
- **WHEN** an issued purchase order has receipt lines but no supplier invoice lines
- **THEN** the matching result MUST have status `PENDING_INPUT`
- **AND** the system MUST NOT include that result in the default exception queue
- **AND** the matching detail MUST expose the missing invoice state for follow-up

### Requirement: Matching APIs expose company-scoped lists, exceptions, details, recalculation, and actions
The system SHALL expose three-way matching REST APIs that return company-scoped data, support the current demo security model, and validate ownership in the service layer.

#### Scenario: List matching results for one company
- **WHEN** a caller requests `GET /api/three-way-matching?companyId=company-digital`
- **THEN** the system MUST return only matching results owned by `company-digital`
- **AND** the response MUST NOT include matching results owned by `company-manufacturing`

#### Scenario: List matching exceptions for one company
- **WHEN** a caller requests `GET /api/three-way-matching/exceptions?companyId=company-digital`
- **THEN** the system MUST return only `EXCEPTION` matching results owned by `company-digital`
- **AND** each result MUST include PO summary, supplier, difference count, highest severity, invoice variance, and last calculated timestamp

#### Scenario: Query matching detail
- **WHEN** a caller requests `GET /api/three-way-matching/{matchId}?companyId=company-digital` for an existing company-owned result
- **THEN** the system MUST return the matching result, source PO summary, receipt summary, invoice summary, current difference items, handling records, status, and timestamps

#### Scenario: Recalculate matching through API
- **WHEN** a caller submits `POST /api/three-way-matching/recalculate` with valid `companyId`, `poId`, and actor from the same company
- **THEN** the system MUST recalculate the current matching result for that issued purchase order
- **AND** the response MUST return the updated matching detail

#### Scenario: Reject cross-company matching access
- **WHEN** a caller from `company-digital` requests, recalculates, or handles a matching result owned by `company-manufacturing`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

#### Scenario: Swagger documents matching endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include matching list, exception list, detail, recalculate, and action endpoints with request and response shapes

### Requirement: Matching exceptions can be handled with auditable actions
The system SHALL allow finance or procurement actors from the owning company to append handling actions to matching exceptions without mutating source PO, receipt, or invoice records.

#### Scenario: Acknowledge a matching exception
- **WHEN** a valid actor from the matching result company submits an `ACKNOWLEDGE` action with a handling note for an `EXCEPTION` result
- **THEN** the system MUST append a handling record with actor, action type, note, and timestamp
- **AND** the matching detail MUST show the handling record

#### Scenario: Resolve a matching exception
- **WHEN** a valid actor from the matching result company submits a `RESOLVE` action with a required resolution note for an `EXCEPTION` result
- **THEN** the matching result status MUST change to `RESOLVED`
- **AND** the system MUST append a handling record with the resolution note
- **AND** the system MUST NOT modify source purchase order, receipt, invoice, or attachment metadata records

#### Scenario: Reopen resolved exception after new source data changes
- **WHEN** a `RESOLVED` matching result is recalculated after new receipt or invoice data creates a current difference
- **THEN** the matching result status MUST become `EXCEPTION`
- **AND** prior handling records MUST remain visible in chronological order

#### Scenario: Reject handling action without company-owned actor
- **WHEN** a caller submits a matching handling action with an unknown actor or an actor from another company
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT append a handling record

### Requirement: Frontend provides a three-way matching workspace
The frontend SHALL provide a real three-way matching page in the procurement workspace for reviewing matching status, triaging exceptions, viewing details, and recording handling actions.

#### Scenario: Open three-way matching page
- **WHEN** a user selects “三单匹配” in the workspace navigation
- **THEN** the system MUST open a `/three-way-matching` page
- **AND** the page MUST load matching results and exception data from backend APIs rather than static mock data

#### Scenario: Review matching overview and exception queue
- **WHEN** the three-way matching page loads for `company-digital`
- **THEN** the page MUST show company-scoped totals for matched, pending input, exception, and resolved results
- **AND** the exception queue MUST show at least PO number, supplier, status, highest severity, difference count, invoice variance, and last calculated timestamp for each backend result

#### Scenario: Review matching detail
- **WHEN** a user selects a matching result from the list
- **THEN** the frontend MUST show PO summary, supplier, ordered quantities, received quantities, invoiced quantities, PO amount, invoice amount, difference items, and handling records from backend APIs

#### Scenario: Handle exception from the frontend
- **WHEN** a user submits an allowed handling action with a valid note from the detail view
- **THEN** the frontend MUST call the matching action API
- **AND** the matching list and detail view MUST refresh to show the updated status and handling record

#### Scenario: Guard unavailable handling actions in the frontend
- **WHEN** a matching result is `MATCHED`, `PENDING_INPUT`, or already `RESOLVED`
- **THEN** the frontend MUST disable invalid handling actions with a client-visible tooltip explaining the reason
- **AND** it MUST still rely on backend validation for final enforcement

#### Scenario: Confirm before discarding unsaved handling note
- **WHEN** a user has typed an unsaved handling note and closes the detail drawer, switches selected row, or leaves the current handling object
- **THEN** the frontend MUST show a confirmation before discarding the unsaved input

### Requirement: Three-way matching does not implement deferred infrastructure, payment, upload, or AI workflows
The system SHALL keep this change focused on deterministic three-way matching and SHALL NOT create payment, object storage, asynchronous messaging, or AI-generated decisions.

#### Scenario: Matching workflow does not require deferred infrastructure
- **WHEN** a developer runs the three-way matching workflow in the MVP local environment
- **THEN** the workflow MUST use MySQL and synchronous service calls
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek

#### Scenario: Matching exception handling does not create payment or AI decisions
- **WHEN** a user resolves a matching exception
- **THEN** the system MUST NOT create payment records, supplier portal tasks, RabbitMQ events, uploaded files, or AI recommendations
- **AND** the matching handling record MUST remain an audit note rather than an automated financial settlement
