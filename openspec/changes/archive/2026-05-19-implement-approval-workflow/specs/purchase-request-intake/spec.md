## MODIFIED Requirements

### Requirement: Draft purchase requests can be submitted as upstream business records
The system SHALL allow a valid draft purchase request to be submitted, making it the approval workflow entry and the upstream record for later RFQ, PO, receiving, invoice, and matching workflows.

#### Scenario: Submit an existing draft
- **WHEN** a caller submits an existing `DRAFT` purchase request by `requestId`
- **THEN** the system MUST change the purchase request status to `SUBMITTED`
- **AND** the system MUST set `submittedAt`
- **AND** the system MUST keep the original company, requester, category, budget account, total amount, and line item data unchanged
- **AND** the system MUST create exactly one approval instance for the same `requestId` according to approval workflow rules
- **AND** the response MUST include an approval summary for the created approval instance

#### Scenario: Reject duplicate submit
- **WHEN** a caller submits a purchase request that is already `SUBMITTED`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST keep the original `submittedAt` value unchanged
- **AND** the system MUST NOT create a second approval instance for the same `requestId`

#### Scenario: Unknown request cannot be submitted
- **WHEN** a caller submits an unknown `requestId`
- **THEN** the system MUST return a not found error
- **AND** the system MUST NOT create a new purchase request or approval instance implicitly

#### Scenario: Approval rule failure keeps draft unchanged
- **WHEN** a caller submits a `DRAFT` purchase request but no active approval rule can be matched
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the purchase request MUST remain `DRAFT`
- **AND** the system MUST NOT create a partial approval instance

### Requirement: Purchase request APIs expose company-scoped list and detail data
The system SHALL expose read APIs that return purchase request list and detail data scoped by company ownership, including approval summary when an approval instance exists.

#### Scenario: List purchase requests for one company
- **WHEN** a caller requests `GET /api/purchase-requests?companyId=company-digital`
- **THEN** the system MUST return only purchase requests owned by `company-digital`
- **AND** the response MUST NOT include purchase requests owned by `company-manufacturing`
- **AND** each submitted request with an approval instance MUST include its approval status summary

#### Scenario: Filter purchase requests by status
- **WHEN** a caller requests `GET /api/purchase-requests?companyId=company-digital&status=SUBMITTED`
- **THEN** the system MUST return only `SUBMITTED` purchase requests for `company-digital`

#### Scenario: Query purchase request detail
- **WHEN** a caller requests `GET /api/purchase-requests/{requestId}` for an existing purchase request
- **THEN** the system MUST return the request header, status, company, requester, department, category, budget account, total amount, expected delivery date, field snapshot, and line items
- **AND** if an approval instance exists for the request, the response MUST include approval status, current node, current approver, matched rule, and timeline summary

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests the purchase request list with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

### Requirement: Frontend provides purchase request intake workflow
The frontend SHALL provide a real purchase request page in the procurement workspace for creating, submitting, listing, viewing purchase requests, and seeing their approval state.

#### Scenario: Open purchase request page
- **WHEN** a user selects “采购申请” in the workspace navigation
- **THEN** the system MUST open a `/purchase-requests` page
- **AND** the page MUST load company, requester, category, and budget account options from backend APIs rather than static mock data

#### Scenario: Active company context scopes form options
- **WHEN** a user opens the purchase request page under the active demo company context
- **THEN** the requester and budget account options MUST show only records belonging to that active company
- **AND** the purchase request page MUST NOT expose a company switcher in the current MVP slice
- **AND** the supplier pool and procurement categories MUST remain group-level reference data

#### Scenario: Save draft from the frontend
- **WHEN** a user fills the required purchase request fields and saves a draft
- **THEN** the frontend MUST call the draft creation API
- **AND** the new draft MUST appear in the list with its backend `requestId` and `DRAFT` status

#### Scenario: Submit purchase request from the frontend
- **WHEN** a user submits a saved draft
- **THEN** the frontend MUST call the submit API
- **AND** the list and detail views MUST show the request as `SUBMITTED`
- **AND** the list and detail views MUST show the created approval instance status and current approval node

#### Scenario: View purchase request approval timeline
- **WHEN** a user opens the detail for a submitted purchase request with an approval instance
- **THEN** the frontend MUST show the approval status, current approver, approval path, and timeline summary from backend APIs

### Requirement: Purchase request Intake does not implement downstream workflows
The system SHALL keep purchase request Intake focused on creating and submitting the upstream request record plus approval workflow handoff, and SHALL NOT create procurement execution records.

#### Scenario: Approval workflow is created by submit handoff
- **WHEN** a purchase request is submitted after approval workflow is available
- **THEN** the system MUST create an approval instance according to approval workflow rules
- **AND** the system MUST NOT create RFQs, POs, receipts, invoices, matching records, or AI recommendations

#### Scenario: Downstream actions are absent from the frontend
- **WHEN** a user views the purchase request page after this change
- **THEN** the page MAY present approval status and navigation to approval detail
- **AND** the page MUST NOT present working RFQ, PO, receiving, invoice, matching, attachment upload, or AI draft actions
