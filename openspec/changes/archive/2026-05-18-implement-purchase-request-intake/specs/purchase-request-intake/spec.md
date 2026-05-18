## ADDED Requirements

### Requirement: Purchase request drafts are created from validated master data
The system SHALL allow a caller to create a purchase request draft using seeded company, requester, department, procurement category, and budget account master data.

#### Scenario: Create a draft for the digital company laptop request
- **WHEN** a caller submits a draft for `company-digital` with requester `user-digital-applicant`, category `category-it-hardware`, budget account `budget-digital-it-equipment`, title "20 台笔记本采购", expected delivery date, total amount, and at least one line item
- **THEN** the system MUST persist a purchase request with status `DRAFT`
- **AND** the system MUST return a stable `requestId`, the submitted company and requester identifiers, the calculated total amount, and all persisted line items

#### Scenario: Reject mismatched budget account company
- **WHEN** a caller submits a draft for `company-digital` using a budget account that belongs to `company-manufacturing`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT persist a purchase request

#### Scenario: Reject mismatched category and budget account
- **WHEN** a caller submits a draft whose `categoryId` does not match the selected `budgetAccountId`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the error MUST identify that the budget account is not valid for the category

#### Scenario: Reject requester outside company
- **WHEN** a caller submits a draft for one company using a requester from another company
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the default active company

### Requirement: Draft purchase requests can be submitted as upstream business records
The system SHALL allow a valid draft purchase request to be submitted, making it the upstream record for later approval, RFQ, PO, receiving, invoice, and matching workflows.

#### Scenario: Submit an existing draft
- **WHEN** a caller submits an existing `DRAFT` purchase request by `requestId`
- **THEN** the system MUST change the status to `SUBMITTED`
- **AND** the system MUST set `submittedAt`
- **AND** the system MUST keep the original company, requester, category, budget account, total amount, and line item data unchanged

#### Scenario: Reject duplicate submit
- **WHEN** a caller submits a purchase request that is already `SUBMITTED`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST keep the original `submittedAt` value unchanged

#### Scenario: Unknown request cannot be submitted
- **WHEN** a caller submits an unknown `requestId`
- **THEN** the system MUST return a not found error
- **AND** the system MUST NOT create a new purchase request implicitly

### Requirement: Purchase request APIs expose company-scoped list and detail data
The system SHALL expose read APIs that return purchase request list and detail data scoped by company ownership.

#### Scenario: List purchase requests for one company
- **WHEN** a caller requests `GET /api/purchase-requests?companyId=company-digital`
- **THEN** the system MUST return only purchase requests owned by `company-digital`
- **AND** the response MUST NOT include purchase requests owned by `company-manufacturing`

#### Scenario: Filter purchase requests by status
- **WHEN** a caller requests `GET /api/purchase-requests?companyId=company-digital&status=SUBMITTED`
- **THEN** the system MUST return only `SUBMITTED` purchase requests for `company-digital`

#### Scenario: Query purchase request detail
- **WHEN** a caller requests `GET /api/purchase-requests/{requestId}` for an existing purchase request
- **THEN** the system MUST return the request header, status, company, requester, department, category, budget account, total amount, expected delivery date, field snapshot, and line items

#### Scenario: Unknown company list request is rejected
- **WHEN** a caller requests the purchase request list with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

### Requirement: Purchase request endpoints are documented and usable in the current demo security model
The system SHALL expose the purchase request Intake endpoints in generated API documentation and allow local demo calls before JWT authentication is implemented.

#### Scenario: Swagger documents purchase request endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include the draft creation, draft submission, list, and detail endpoints for purchase requests

#### Scenario: Demo frontend can call purchase request APIs
- **WHEN** the frontend calls purchase request GET and POST endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company and master data ownership

### Requirement: Frontend provides purchase request intake workflow
The frontend SHALL provide a real purchase request page in the procurement workspace for creating, submitting, listing, and viewing purchase requests.

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

### Requirement: Purchase request Intake does not implement downstream workflows
The system SHALL keep purchase request Intake focused on creating and submitting the upstream request record.

#### Scenario: Approval workflow is not created by intake
- **WHEN** a purchase request is submitted
- **THEN** the system MUST NOT create approval instances, approval nodes, approver tasks, RFQs, POs, receipts, invoices, matching records, or AI recommendations

#### Scenario: Downstream actions are absent from the frontend
- **WHEN** a user views the purchase request page after this change
- **THEN** the page MUST NOT present working approval, RFQ, PO, receiving, invoice, matching, attachment upload, or AI draft actions
