## 1. Establish Approval Rules and Demo Data

- [x] 1.1 Add a Flyway migration for approval rules, rule steps, approval instances, approval nodes, and approval records with company/request/status indexes and stable business IDs
- [x] 1.2 Seed approval rules for the digital IT hardware high-amount path, manufacturing equipment spares path, and company default fallback paths
- [x] 1.3 Seed or backfill approval instances for existing submitted demo purchase requests so the approval center has realistic data immediately after migration
- [x] 1.4 Add approval status/action enums, JPA entities, repositories, and DTOs for rules, instances, nodes, records, task list items, details, and timelines

## 2. Turn Submitted Requests into Approval Work

- [x] 2.1 Implement rule matching by `companyId`, `categoryId`, amount range, active flag, and priority, including default company fallback rules
- [x] 2.2 Create approval instances, nodes, context snapshots, and initial timeline records in the same transaction as purchase request submit
- [x] 2.3 Keep submitted purchase request header and line data unchanged while returning an approval summary from submit responses
- [x] 2.4 Reject submit atomically when no approval rule can be matched, and preserve the purchase request as `DRAFT`
- [x] 2.5 Prevent duplicate approval instances when a submitted request is submitted again or already has approval data
- [x] 2.6 Extend purchase request list and detail APIs to include approval status, current node, current approver, matched rule, and timeline summary when available

## 3. Process Approval Tasks

- [x] 3.1 Add company-scoped approval task listing for active nodes by `companyId` and `approverId`
- [x] 3.2 Add approval detail and by-request lookup APIs that return request identifiers, matched rule, nodes, context snapshot, and timeline records
- [x] 3.3 Implement approve action so the active approver advances to the next node or completes the instance as `APPROVED`
- [x] 3.4 Implement reject action so the active approver terminates the instance as `REJECTED` and records the comment
- [x] 3.5 Implement requester withdraw action for `IN_PROGRESS` instances and reject withdraw on terminal instances
- [x] 3.6 Validate actor/company ownership for approve, reject, withdraw, detail, and task-list operations in the demo security model
- [x] 3.7 Temporarily allow local demo GET/POST calls to `/api/approvals/**` in `SecurityConfig` while preserving service-layer ownership validation

## 4. Make the Approval Center Usable

- [x] 4.1 Add frontend approval API types and query/mutation functions for tasks, details, by-request lookup, approve, reject, and withdraw
- [x] 4.2 Route the sidebar “审批中心” item to `/approvals` and replace placeholder approval content with backend-backed data
- [x] 4.3 Build the approval center with active company context, approver selector, task list, selected approval detail, approval path, context summary, and timeline
- [x] 4.4 Support approving an active task from the UI and refreshing the task list, approval detail, and purchase request data
- [x] 4.5 Support rejecting an active task with a comment from the UI and rendering the terminal rejection state
- [x] 4.6 Show approval status, current approver, approval path, and timeline summary in the purchase request detail drawer after submit
- [x] 4.7 Keep RFQ, PO, receiving, invoice, matching, attachment, and AI actions hidden or non-actionable in the approval and purchase request views

## 5. Verify the Approval Business Flow

- [x] 5.1 Add backend integration tests for migration, rule matching, digital two-step approval, manufacturing one-step approval, default rule fallback, and missing-rule rollback
- [x] 5.2 Add backend integration tests for approve, reject, withdraw, non-current approver rejection, duplicate terminal operation rejection, company isolation, and by-request lookup
- [x] 5.3 Update purchase request integration tests to expect approval creation and approval summaries while preserving `SUBMITTED` request status and original request data
- [x] 5.4 Assert Swagger/OpenAPI documents purchase request approval summaries and approval task/detail/action endpoints
- [x] 5.5 Run `./gradlew test` in `backend` and `npm run build` in `frontend`
- [x] 5.6 Start local infrastructure, backend, and frontend, then verify from the browser that a submitted 星河数字科技 IT hardware request creates a two-step approval and can be approved through the approval center
- [x] 5.7 Record verification commands, URLs, demo users, and any environment caveats in the change notes before archive

## 6. Preserve MVP Boundaries

- [x] 6.1 Confirm approval completion does not create RFQs, POs, receipts, invoices, matching records, AI recommendations, or budget freezes
- [x] 6.2 Confirm approval data remains company-scoped while suppliers and procurement categories remain group-level reference data
- [x] 6.3 Confirm the approval workflow implementation does not require Redis, RabbitMQ, or MinIO at runtime
- [x] 6.4 Confirm existing roadmap and OpenSpec docs still identify RFQ as the next downstream P0 slice after approval is complete
