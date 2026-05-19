## Purpose

AI 采购助手为集团内部采购闭环提供上下文内建议能力：从采购申请草稿、风险提示、RFQ 报价解释到三单匹配异常解释。AI 输出必须保持为可审查建议，不替代正式后端校验、审批规则、确定性排序或业务状态机。

## Requirements

### Requirement: AI assistant uses real provider calls with structured output
The system SHALL provide an AI procurement assistant backed by a configured OpenAI-compatible provider, defaulting to DeepSeek for the MVP, and SHALL return only service-validated structured JSON to the frontend.

#### Scenario: Generate structured result from configured provider
- **WHEN** a caller requests an AI assistant scenario with valid company, actor, and business context while provider configuration is available
- **THEN** the system MUST call the configured OpenAI-compatible provider
- **AND** the response MUST include a stable `invocationId`, scenario identifier, model identifier, structured result, confidence or risk indicators, and generated timestamp

#### Scenario: Reject unavailable provider without mock content
- **WHEN** provider API key, base URL, model, enabled state, or provider availability is missing for an AI assistant request
- **THEN** the system MUST return a client-visible error explaining that AI is unavailable
- **AND** the system MUST NOT return hard-coded mock AI content as the final behavior
- **AND** the system MUST NOT create, update, or submit any procurement business record

#### Scenario: Reject invalid AI output
- **WHEN** the provider returns malformed JSON, missing required fields, invalid enum values, unsafe amount formats, or business identifiers outside the request context
- **THEN** the system MUST reject the AI output with a client-visible error
- **AND** the system MUST record the failed invocation for audit
- **AND** the system MUST NOT expose the invalid output as a usable procurement suggestion

### Requirement: AI assistant enforces company-scoped and sanitized context
The system SHALL build AI prompts on the server from sanitized, company-scoped procurement context and SHALL prevent cross-company data from entering AI requests or responses.

#### Scenario: Build prompt context for one company
- **WHEN** a caller requests an AI assistant scenario for `company-digital` with an actor belonging to `company-digital`
- **THEN** the system MUST include only business records owned by `company-digital` plus allowed group-shared supplier master data
- **AND** the system MUST exclude procurement transactions owned by `company-manufacturing`

#### Scenario: Reject cross-company business reference
- **WHEN** a caller from `company-digital` requests an AI explanation for an RFQ, purchase order, invoice, or matching result owned by `company-manufacturing`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT call the AI provider
- **AND** the system MUST NOT fall back to the active demo company

#### Scenario: Exclude sensitive and irrelevant fields
- **WHEN** the system constructs prompt context for any AI assistant scenario
- **THEN** the context MUST exclude API keys, system configuration secrets, stack traces, phone numbers, email addresses, and unrelated internal notes
- **AND** the context MUST include only the fields needed to satisfy the requested procurement scenario

### Requirement: AI assistant can generate purchase request draft previews
The system SHALL allow an applicant to turn natural-language procurement intent into a purchase request draft preview that can be reviewed before any formal purchase request is persisted.

#### Scenario: Generate draft preview from natural language
- **WHEN** an applicant from `company-digital` asks the AI assistant to draft a request such as "采购 20 台研发笔记本，下月交付"
- **THEN** the system MUST return a draft preview with title, business purpose, candidate requester, department, category, budget account, line items, quantities, estimated amounts, expected delivery date, missing fields, and confidence notes
- **AND** the system MUST NOT persist a purchase request merely by generating the preview

#### Scenario: Confirm AI draft into formal purchase request draft
- **WHEN** the applicant reviews an AI draft preview, fills any required missing fields, and confirms saving it
- **THEN** the system MUST create a formal purchase request through the existing purchase request draft creation behavior
- **AND** the persisted request MUST have status `DRAFT`
- **AND** existing master data, company ownership, amount, line item, category, budget account, and requester validations MUST still apply

#### Scenario: Reject AI draft confirmation with invalid master data
- **WHEN** an AI draft preview references a budget account, requester, category, or line item value that is not valid for the selected company
- **THEN** the formal draft confirmation MUST be rejected with a client-visible 4xx error
- **AND** the system MUST NOT persist a purchase request
- **AND** the user MUST be able to correct the draft preview before retrying

### Requirement: AI assistant provides risk hints before submission or approval
The system SHALL provide AI-generated risk hints for purchase requests before submission or during approval review without replacing approval rules or approval decisions.

#### Scenario: Review risk for purchase request draft
- **WHEN** a caller requests AI risk review for a `DRAFT` purchase request owned by `company-digital`
- **THEN** the system MUST return structured risk hints including risk level, risk items, supporting facts, suggested user actions, and whether more information is recommended before submission
- **AND** the purchase request status MUST remain `DRAFT`

#### Scenario: Review risk for active approval
- **WHEN** an approver requests AI risk review for a `SUBMITTED` purchase request with an active approval instance in the same company
- **THEN** the system MUST include the request summary, amount, category, budget account, line items, matched approval rule, and current approval node in the AI context
- **AND** the response MUST present suggestions as advisory information only
- **AND** approval actions MUST still be performed through the existing approval workflow endpoints

#### Scenario: AI risk review does not block deterministic workflow
- **WHEN** AI risk review fails, times out, or returns no usable recommendation
- **THEN** the user MUST still be able to use the normal purchase request submit and approval actions
- **AND** the system MUST NOT change approval instance status, approval node status, or approval records because of the failed AI call

### Requirement: AI assistant explains RFQ quote comparison
The system SHALL explain RFQ quote comparison results using current RFQ, supplier, and quote data while preserving the deterministic comparison rank and purchase order creation boundary.

#### Scenario: Explain comparable RFQ quotes
- **WHEN** a procurement user requests AI explanation for an RFQ with at least two valid supplier quotes in the same company
- **THEN** the system MUST provide a structured explanation of price, tax, delivery date, supplier score, risk level, risk note, attachment metadata, and recommendation rank differences
- **AND** the explanation MUST reference only suppliers invited to the RFQ

#### Scenario: Preserve deterministic RFQ ranking
- **WHEN** the AI assistant explains RFQ comparison data
- **THEN** the system MUST NOT change the persisted quote values, supplier invitation status, RFQ status, or deterministic recommendation rank
- **AND** the system MUST NOT create a purchase order from the AI explanation

#### Scenario: Reject RFQ explanation without enough quotes
- **WHEN** a procurement user requests AI explanation for an RFQ with fewer than two valid supplier quotes
- **THEN** the system MUST return a client-visible unavailable-state response
- **AND** the system MUST NOT call the provider with incomplete comparison context unless the response is explicitly a missing-data explanation

### Requirement: AI assistant explains three-way matching exceptions
The system SHALL explain three-way matching exceptions and suggest handling next steps without mutating matching status or source PO, receipt, or invoice records.

#### Scenario: Explain matching exception
- **WHEN** a finance user requests AI explanation for a company-owned matching result with status `EXCEPTION`
- **THEN** the system MUST return a structured explanation containing exception summary, difference interpretations, likely causes, suggested handling actions, required follow-up data, and confidence notes
- **AND** the explanation MUST reference the current PO, receipt, invoice, difference item, and handling record context used to generate it

#### Scenario: Keep matching handling manual and auditable
- **WHEN** the AI assistant suggests acknowledging, resolving, or reopening a matching exception
- **THEN** the system MUST NOT append a matching handling record automatically
- **AND** the user MUST still submit handling actions through the existing three-way matching action workflow
- **AND** the matching result status MUST remain unchanged until that workflow succeeds

#### Scenario: Handle non-exception matching states
- **WHEN** a user requests AI explanation for a matching result with status `MATCHED`, `PENDING_INPUT`, or `RESOLVED`
- **THEN** the system MUST return a state-appropriate explanation or client-visible unavailable-state response
- **AND** it MUST NOT create new difference items, handling records, receipt records, invoice records, or payment records

### Requirement: AI assistant records auditable invocation history
The system SHALL persist AI invocation audit records in MongoDB for every attempted provider call and every provider-skipped validation failure that is relevant to AI governance.

#### Scenario: Record successful invocation audit
- **WHEN** an AI assistant request completes successfully
- **THEN** the system MUST persist an audit record with invocation identifier, company identifier, actor identifier, scenario, source references, sanitized input summary, model, provider, structured output, status, latency, and timestamps
- **AND** the audit record MUST be queryable by company and invocation identifier from backend code

#### Scenario: Record failed invocation audit
- **WHEN** an AI assistant request fails because of provider error, timeout, invalid provider output, or missing audit storage after the provider call starts
- **THEN** the system MUST persist or update an audit record with failure status, error code, error summary, scenario, company identifier, and timestamps when storage is available
- **AND** the frontend response MUST include a stable error code suitable for user-facing messaging

#### Scenario: Avoid unaudited provider calls
- **WHEN** MongoDB audit storage is unavailable before an AI provider call begins
- **THEN** the system MUST fail the AI assistant request before calling the configured provider
- **AND** the system MUST return a client-visible service unavailable error

### Requirement: Frontend exposes contextual AI assistant workflows
The frontend SHALL expose AI assistant entry points inside relevant procurement workspaces and SHALL present AI output as reviewable suggestions with loading, error, unavailable, and confirmation states.

#### Scenario: Use AI assistant on purchase request page
- **WHEN** a user opens the purchase request workspace
- **THEN** the frontend MUST provide an AI draft entry that accepts natural-language procurement intent
- **AND** generated fields MUST be editable before the user saves a formal purchase request draft

#### Scenario: Use AI assistant on RFQ and matching details
- **WHEN** a user opens RFQ comparison detail or three-way matching detail with enough backend context
- **THEN** the frontend MUST provide an AI explanation action
- **AND** the visible explanation MUST show the scenario, generated timestamp, confidence or risk level, structured sections, and invocation identifier

#### Scenario: Explain disabled AI actions
- **WHEN** an AI action is unavailable because of missing provider configuration, insufficient comparison data, non-exception matching status, missing company context, or loading state
- **THEN** the frontend MUST disable the action with a tooltip or inline reason explaining the specific unavailable condition

#### Scenario: Confirm before discarding unsaved AI draft edits
- **WHEN** a user edits AI-generated purchase request draft fields and then closes the drawer, switches selected object, or leaves the current draft flow before saving
- **THEN** the frontend MUST show a confirmation before discarding unsaved input
