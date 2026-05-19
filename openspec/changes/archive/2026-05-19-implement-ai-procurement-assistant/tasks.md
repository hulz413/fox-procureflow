## 1. AI Provider And Audit Foundation

- [x] 1.1 Add OpenAI-compatible provider configuration entries for enabled state, API key, base URL, model, timeout, and user-facing unavailable reasons.
- [x] 1.2 Implement a backend AI provider adapter that calls the configured OpenAI-compatible endpoint and maps provider success, timeout, rate-limit, and error responses into stable application outcomes.
- [x] 1.3 Add MongoDB AI invocation audit document, repository, and service methods for successful, failed, and provider-skipped AI assistant requests.
- [x] 1.4 Ensure AI provider calls are not started when audit storage is unavailable before the call, and return a service-unavailable response instead.
- [x] 1.5 Implement shared structured-output parsing and validation for AI responses, including required fields, enums, amount/quantity formats, and allowed business references.
- [x] 1.6 Add shared prompt context sanitization helpers that remove secrets, contact details, stack traces, unrelated internal notes, and cross-company records.
- [x] 1.7 Expose AI assistant endpoints in Swagger/OpenAPI and keep them allowed by the current demo security model while enforcing service-layer company and actor validation.

## 2. Purchase Request Draft Assistant

- [x] 2.1 Build server-side prompt context for purchase request drafting from explicit company, actor, natural-language intent, company master data, requester, department, category, and budget account options.
- [x] 2.2 Implement the AI draft preview endpoint that returns editable structured fields, missing-field notes, confidence notes, and `invocationId` without persisting a purchase request.
- [x] 2.3 Wire draft confirmation so reviewed AI output is saved through the existing purchase request draft creation behavior and remains subject to all current master data and company ownership validations.
- [x] 2.4 Add frontend AI draft entry on the purchase request page with natural-language input, loading/error/unavailable states, editable generated fields, and confirm-save behavior.
- [x] 2.5 Add unsaved-edit confirmation when a user closes, switches away from, or leaves an AI-generated purchase request draft before saving.
- [x] 2.6 Cover draft preview, invalid master data, provider unavailable, invalid AI output, and confirmation-to-`DRAFT` behavior with backend and frontend tests.

## 3. Purchase Request And Approval Risk Hints

- [x] 3.1 Build risk-review context for draft purchase requests using request header, line items, company, requester, category, budget account, total amount, and relevant approval rule information.
- [x] 3.2 Build risk-review context for submitted requests and active approval instances using matched approval rule, current approval node, approver, and approval timeline summary.
- [x] 3.3 Implement the AI risk review endpoint returning structured risk level, risk items, supporting facts, suggested actions, and follow-up questions without mutating request or approval status.
- [x] 3.4 Add frontend risk hint actions in purchase request detail and approval review surfaces, with disabled reasons when context is missing or AI is unavailable.
- [x] 3.5 Verify risk review failure does not block normal purchase request submission, approval pass, approval rejection, withdrawal, or timeline display.

## 4. RFQ Quote Explanation

- [x] 4.1 Build company-scoped RFQ explanation context from RFQ header, approved source request summary, invited suppliers, current quotes, deterministic comparison rank, delivery dates, scores, risk notes, and attachment metadata.
- [x] 4.2 Implement the AI RFQ explanation endpoint that requires enough comparable quote data and rejects cross-company RFQ access before calling the provider.
- [x] 4.3 Ensure AI explanations cannot change RFQ status, supplier invitations, quote values, deterministic recommendation rank, or create purchase orders.
- [x] 4.4 Add frontend AI explanation action to RFQ comparison/detail views showing summary, supplier differences, risk notes, questions to confirm, generated timestamp, and `invocationId`.
- [x] 4.5 Cover comparable RFQ, insufficient quotes, cross-company access, provider error, and no-business-mutation scenarios with tests.

## 5. Three-Way Matching Exception Explanation

- [x] 5.1 Build company-scoped matching explanation context from matching result, PO summary, receipt summary, invoice summary, current difference items, severity, invoice variance, and handling records.
- [x] 5.2 Implement the AI matching explanation endpoint for `EXCEPTION` results and state-appropriate unavailable or explanatory responses for `MATCHED`, `PENDING_INPUT`, and `RESOLVED` results.
- [x] 5.3 Ensure AI matching suggestions do not append handling records, create difference items, modify source PO/receipt/invoice records, or change matching status.
- [x] 5.4 Add frontend AI explanation action to the three-way matching detail drawer with structured exception summary, likely causes, suggested manual actions, required follow-up data, confidence notes, and `invocationId`.
- [x] 5.5 Cover exception explanation, non-exception states, cross-company access, provider error, and no-business-mutation scenarios with tests.

## 6. Frontend Shared AI Experience

- [x] 6.1 Add frontend AI API client types and request helpers for draft preview, risk review, RFQ explanation, and matching explanation.
- [x] 6.2 Add reusable AI result presentation components for scenario label, confidence/risk level, generated timestamp, invocation identifier, structured sections, loading state, error state, retry, and disabled reason tooltip.
- [x] 6.3 Ensure AI UI uses backend data and real unavailable states rather than frontend static mock results.
- [x] 6.4 Keep AI controls visually integrated with the existing Ant Design procurement workspace and avoid overlapping text or controls across desktop and mobile widths.

## 7. Verification And Demo Readiness

- [x] 7.1 Add backend tests for OpenAI-compatible provider adapter error mapping using test doubles, audit persistence, context sanitization, company isolation, and structured-output validation.
- [x] 7.2 Add integration tests for all AI assistant endpoints covering success with stubbed provider, provider unavailable, audit storage unavailable, cross-company rejection, and invalid provider output.
- [x] 7.3 Add frontend tests or smoke checks for AI draft creation, AI result display, disabled reasons, error states, and unsaved draft confirmation.
- [x] 7.4 Run backend tests and frontend lint/build, and record verification notes for the AI assistant change.
- [x] 7.5 Update local development documentation with OpenAI-compatible provider environment variables, MongoDB audit dependency, no-mock production behavior, and demo flow steps for the four AI scenarios.
