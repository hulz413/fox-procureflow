# approval-workflow Spec

## Purpose

定义 Fox Procureflow MVP 的审批流能力，确保采购申请提交后能够按公司、品类、金额匹配审批规则，生成公司隔离的审批实例、节点和时间线，并让审批人在审批中心完成通过、驳回和撤回等操作。

## Requirements

### Requirement: Approval rules create company-scoped approval instances
The system SHALL create a company-scoped approval instance for a submitted purchase request by matching active approval rules against the request company, procurement category, and total amount.

#### Scenario: Digital IT hardware high amount uses department and finance approval
- **WHEN** a `DRAFT` purchase request for `company-digital` uses category `category-it-hardware`, total amount at least `100000.00`, and is submitted
- **THEN** the system MUST create one approval instance for the same `requestId` with status `IN_PROGRESS`
- **AND** the first approval node MUST be assigned to `user-digital-approver` with status `ACTIVE`
- **AND** the second approval node MUST be assigned to `user-digital-finance` with status `PENDING`
- **AND** the approval context MUST snapshot the request company, requester, department, category, budget account, supplier, total amount, currency, expected delivery date, and line count

#### Scenario: Manufacturing equipment spares uses production approval
- **WHEN** a `DRAFT` purchase request for `company-manufacturing` uses category `category-equipment-spares` and is submitted
- **THEN** the system MUST create one approval instance for the same `requestId` with status `IN_PROGRESS`
- **AND** the approval path MUST contain one active node assigned to `user-mfg-approver`

#### Scenario: Company default rule covers other submitted requests
- **WHEN** a submitted purchase request has no more specific category or amount rule but the request company has an active default approval rule
- **THEN** the system MUST create an `IN_PROGRESS` approval instance from the default rule
- **AND** the matched rule identifier MUST be visible in the approval detail response

#### Scenario: Missing approval rule rejects submission atomically
- **WHEN** a caller submits a `DRAFT` purchase request whose company, category, and amount match no active approval rule
- **THEN** the system MUST reject the submit call with a client-visible 4xx error
- **AND** the purchase request MUST remain `DRAFT`
- **AND** the system MUST NOT create a partial approval instance, node, or record

### Requirement: Approval actions advance the active serial workflow
The system SHALL allow the current active approver to approve or reject an approval instance and SHALL maintain a complete approval record timeline.

#### Scenario: Approve first node activates the next node
- **WHEN** `user-digital-approver` approves the active first node of a digital IT hardware approval instance
- **THEN** the first node MUST change to `APPROVED`
- **AND** the second node assigned to `user-digital-finance` MUST change to `ACTIVE`
- **AND** the approval instance MUST remain `IN_PROGRESS`
- **AND** the approval record timeline MUST include the approval action, actor, comment, and timestamp

#### Scenario: Approve final node completes the approval
- **WHEN** the active final approver approves an approval instance
- **THEN** the active node MUST change to `APPROVED`
- **AND** the approval instance MUST change to `APPROVED`
- **AND** the approval detail response MUST expose the completed timestamp

#### Scenario: Reject active node terminates the approval
- **WHEN** the active approver rejects an approval instance with a comment
- **THEN** the active node MUST change to `REJECTED`
- **AND** the approval instance MUST change to `REJECTED`
- **AND** pending nodes MUST NOT remain actionable
- **AND** the approval record timeline MUST include the rejection action, actor, comment, and timestamp

#### Scenario: Non-current approver cannot operate
- **WHEN** a user who is not assigned to the active approval node tries to approve or reject the approval instance
- **THEN** the system MUST reject the operation with a client-visible 4xx error
- **AND** the approval instance, nodes, and records MUST remain unchanged

#### Scenario: Terminal approval cannot be operated again
- **WHEN** a caller tries to approve or reject an approval instance whose status is `APPROVED`, `REJECTED`, or `WITHDRAWN`
- **THEN** the system MUST reject the operation with a conflict-style 4xx error
- **AND** the system MUST NOT create a duplicate approval record

### Requirement: Requesters can withdraw in-progress approvals
The system SHALL allow the original requester to withdraw an in-progress approval before it reaches a terminal status.

#### Scenario: Requester withdraws in-progress approval
- **WHEN** the original requester withdraws an approval instance whose status is `IN_PROGRESS`
- **THEN** the approval instance MUST change to `WITHDRAWN`
- **AND** active or pending nodes MUST no longer be actionable
- **AND** the approval record timeline MUST include the withdraw action, actor, comment, and timestamp

#### Scenario: Non-requester cannot withdraw approval
- **WHEN** a user other than the original requester tries to withdraw an approval instance
- **THEN** the system MUST reject the operation with a client-visible 4xx error
- **AND** the approval instance MUST remain unchanged

#### Scenario: Terminal approval cannot be withdrawn
- **WHEN** the original requester tries to withdraw an approval instance whose status is `APPROVED`, `REJECTED`, or `WITHDRAWN`
- **THEN** the system MUST reject the operation with a conflict-style 4xx error
- **AND** the approval record timeline MUST NOT receive a duplicate withdraw action

### Requirement: Approval APIs expose company-scoped tasks, details, and timeline
The system SHALL expose approval REST APIs that return task lists, approval details, and timeline records scoped by company ownership and usable in the current demo security model.

#### Scenario: List active tasks for one approver
- **WHEN** a caller requests `GET /api/approvals/tasks?companyId=company-digital&approverId=user-digital-approver`
- **THEN** the system MUST return only active approval nodes owned by `company-digital` and assigned to `user-digital-approver`
- **AND** the response MUST NOT include approvals owned by `company-manufacturing`

#### Scenario: Query approval detail by approvalId
- **WHEN** a caller requests `GET /api/approvals/{approvalId}` for an existing approval instance
- **THEN** the system MUST return the approval header, request identifiers, matched rule, current status, nodes, context snapshot, and timeline records

#### Scenario: Query approval detail by requestId
- **WHEN** a caller requests `GET /api/approvals/by-request/{requestId}` for a purchase request with an approval instance
- **THEN** the system MUST return the approval summary, nodes, and timeline for that request

#### Scenario: Unknown company task request is rejected
- **WHEN** a caller requests approval tasks with an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of falling back to a default company

#### Scenario: Swagger documents approval endpoints
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include approval task, detail, approve, reject, and withdraw endpoints

#### Scenario: Demo frontend can call approval APIs
- **WHEN** the frontend calls approval GET and POST endpoints in the current skeleton environment
- **THEN** Spring Security MUST allow the calls without JWT
- **AND** the service layer MUST still validate explicit company, actor, requester, and approver ownership

### Requirement: Frontend provides an approval center workflow
The frontend SHALL provide a real approval center page for approvers to review and process approval tasks.

#### Scenario: Open approval center page
- **WHEN** a user selects “审批中心” in the workspace navigation
- **THEN** the system MUST open an `/approvals` page
- **AND** the page MUST load approval tasks from backend APIs rather than static mock data

#### Scenario: Review approval task detail
- **WHEN** an approver selects an active approval task
- **THEN** the frontend MUST show the purchase request summary, approval path, current node, context snapshot, and timeline records

#### Scenario: Approve task from frontend
- **WHEN** the active approver approves a task from the approval center
- **THEN** the frontend MUST call the approve API
- **AND** the task list and approval detail MUST refresh to show the next active node or final `APPROVED` status

#### Scenario: Reject task from frontend
- **WHEN** the active approver rejects a task with a comment from the approval center
- **THEN** the frontend MUST call the reject API
- **AND** the task list and approval detail MUST refresh to show `REJECTED` status and the rejection record

### Requirement: Approval workflow does not create downstream procurement records
The system SHALL keep approval focused on request review and SHALL NOT create RFQs, purchase orders, receipts, invoices, matching records, or AI recommendations.

#### Scenario: Approval completion does not create RFQ or PO
- **WHEN** an approval instance reaches `APPROVED`
- **THEN** the system MUST NOT create RFQs, purchase orders, receipts, invoices, matching records, or AI recommendations
- **AND** the approval detail MUST remain the source of the request approval outcome for later slices

#### Scenario: Frontend does not expose downstream actions from approval center
- **WHEN** a user views an approval detail after this change
- **THEN** the page MUST NOT present working RFQ, PO, receiving, invoice, matching, attachment upload, or AI risk actions
