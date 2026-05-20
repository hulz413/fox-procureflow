## ADDED Requirements

### Requirement: Global search exposes a read-only procurement search API
The system SHALL provide a read-only global search API that returns matching procurement business objects and shared reference data for the current demo company context.

#### Scenario: Search current company procurement objects
- **WHEN** a caller requests `GET /api/global-search?companyId=company-digital&query=PO-20260518`
- **THEN** the response MUST include matching company-owned purchase orders, receipts, invoices, and three-way matching records for `company-digital`
- **AND** the response MUST NOT include procurement transaction records owned by `company-manufacturing`

#### Scenario: Search group shared supplier pool
- **WHEN** a caller searches for a supplier name such as `上海云舟`
- **THEN** the response MUST include matching suppliers from the group shared supplier pool
- **AND** the supplier results MUST be marked as group shared reference data rather than company-owned transaction data

#### Scenario: Search with no useful query
- **WHEN** a caller submits an empty query or a query that is too short to search reliably
- **THEN** the API MUST return a successful empty result set with the normalized query and generated timestamp
- **AND** the API MUST NOT return frontend static demo results or mutate any business record

#### Scenario: Reject unknown company context
- **WHEN** a caller requests global search with an unknown `companyId`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

### Requirement: Search results are grouped, contextual, and ranked for business lookup
The global search response SHALL group results by business type and provide enough context for a user to distinguish similar procurement objects.

#### Scenario: Return grouped result payload
- **WHEN** global search finds results across purchase requests, RFQs, purchase orders, and suppliers
- **THEN** the response MUST group results by stable result type
- **AND** each result MUST include a stable identifier, display title, result type, status or state label when available, matched fields, and navigation target

#### Scenario: Include business context in transaction results
- **WHEN** a transaction result is returned for a purchase request, RFQ, purchase order, receipt, invoice, or matching record
- **THEN** the result MUST include the owning company identifier and company name
- **AND** it SHOULD include supplier, amount, currency, status, and relevant source document identifiers when those fields exist

#### Scenario: Rank exact identifier matches first
- **WHEN** a query exactly matches or strongly prefixes a business identifier such as `PR-`, `RFQ-`, `PO-`, an invoice number, or a matching identifier
- **THEN** exact or prefix identifier matches MUST appear before broader title, supplier, or note matches within the same result type

### Requirement: Global search respects company isolation and shared data boundaries
The system SHALL preserve the existing Fox Procureflow data ownership model while searching across modules.

#### Scenario: Transaction results remain company scoped
- **WHEN** the current search company is `company-digital`
- **THEN** purchase requests, approvals, RFQs, purchase orders, receipts, invoices, and three-way matching results MUST be limited to records whose `companyId` is `company-digital`
- **AND** the response MUST NOT reveal titles, identifiers, amounts, suppliers, or statuses for `company-manufacturing` transaction records

#### Scenario: Company-scoped master data remains company scoped
- **WHEN** global search returns departments, users, or budget accounts
- **THEN** those results MUST be limited to the selected company where the underlying master data is company-owned
- **AND** procurement categories and suppliers MAY be returned as group shared reference data

#### Scenario: Search does not change procurement state
- **WHEN** a user performs global search or opens a search result
- **THEN** the system MUST NOT create, update, approve, reject, publish, cancel, receive, invoice, recalculate, resolve, upload, or delete any procurement business record

### Requirement: Frontend provides a command-palette global search experience
The frontend SHALL turn the topbar search icon into a command-palette style global search dialog for finding procurement objects quickly.

#### Scenario: Open search from the topbar
- **WHEN** a user clicks the topbar search button
- **THEN** the frontend MUST open a search dialog with a focused search input
- **AND** the dialog MUST be available from the existing Fox Procureflow workspace shell without disrupting the current page

#### Scenario: Open search with keyboard shortcut
- **WHEN** a user presses `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux while focused in the workspace
- **THEN** the frontend MUST open the same global search dialog
- **AND** pressing `Esc` MUST close the dialog without changing the current route

#### Scenario: Search and display backend results
- **WHEN** a user enters a query for a known `PR`, `RFQ`, `PO`, supplier, invoice number, or matching exception
- **THEN** the frontend MUST call the global search API using the current company context
- **AND** it MUST render loading, results, empty, and error states without using static mock search data

#### Scenario: Navigate search results with keyboard
- **WHEN** search results are visible
- **THEN** the user MUST be able to move selection through results with the keyboard and open the selected result with Enter
- **AND** the selected result MUST be visually distinguishable from other results

### Requirement: Search results navigate to the owning workspace and target detail
The frontend SHALL route each search result to the appropriate existing workspace and open or locate the matching business object when possible.

#### Scenario: Open purchase request result
- **WHEN** a user opens a purchase request result from global search
- **THEN** the frontend MUST navigate to `/purchase-requests` with a stable target parameter for the selected request
- **AND** the purchase request workspace MUST open or select the matching request detail when the record is available

#### Scenario: Open RFQ or purchase order result
- **WHEN** a user opens an RFQ or purchase order result from global search
- **THEN** the frontend MUST navigate to `/rfqs` or `/purchase-orders` with a stable target parameter
- **AND** the target workspace MUST open or select the matching detail when the record is available

#### Scenario: Open receipt, invoice, or matching result
- **WHEN** a user opens a receipt, invoice, PO fulfillment, or three-way matching result from global search
- **THEN** the frontend MUST navigate to `/receipts-invoices` or `/three-way-matching` with a stable target parameter
- **AND** the target workspace MUST open or select the related PO or matching detail when the record is available

#### Scenario: Open supplier or master data result
- **WHEN** a user opens a supplier or master data result from global search
- **THEN** the frontend MUST navigate to `/suppliers` or `/master-data` as appropriate
- **AND** supplier results MUST open or select the matching read-only supplier detail when the supplier is available

### Requirement: Global search is documented and avoids deferred infrastructure
The global search capability SHALL be documented and runnable in the MVP local environment without deferred infrastructure or AI services.

#### Scenario: Swagger documents global search endpoint
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include the global search endpoint, query parameters, company context, result types, and response shape

#### Scenario: Search runs without external search infrastructure
- **WHEN** a developer runs global search in the MVP local environment
- **THEN** the search capability MUST use existing MySQL-backed data and synchronous request handling
- **AND** it MUST NOT require Elasticsearch, Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, DeepSeek, or another AI service
