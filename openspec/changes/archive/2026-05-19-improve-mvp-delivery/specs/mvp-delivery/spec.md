## ADDED Requirements

### Requirement: MVP demo runbook documents the complete delivery path
The system SHALL provide a human-facing MVP demo runbook that explains how to prepare, start, verify, and demonstrate Fox Procureflow as a group-internal multi-company procurement platform.

#### Scenario: Follow fresh checkout demo path
- **WHEN** a developer or demo operator follows the documented MVP demo path from a fresh checkout
- **THEN** the documentation MUST guide them through environment prerequisites, `.env` setup, infrastructure startup, backend startup, frontend startup, and the local URLs required for the demo

#### Scenario: Demonstrate group and company contexts
- **WHEN** a demo operator uses the runbook to present the MVP
- **THEN** the runbook MUST identify 星河控股集团, 星河数字科技有限公司, 星河智能制造有限公司, the shared supplier pool, and the company-owned procurement transaction areas

#### Scenario: Explain optional AI availability
- **WHEN** the runbook describes AI procurement assistant behavior
- **THEN** it MUST distinguish the core procurement workflow from optional real provider calls that require `OPENAI_COMPATIBLE_ENABLED=true`, a provider API key, and MongoDB audit storage

### Requirement: Local launch flow reports demo-ready service addresses
The system SHALL provide a local launch flow that starts or guides startup for required MVP services and reports the addresses needed to inspect demo readiness.

#### Scenario: Launch local MVP services
- **WHEN** a developer runs the documented launch command from the repository root
- **THEN** the system MUST start or guide startup for Docker infrastructure, the Spring Boot backend, and the Vite frontend, then print frontend, backend health, Swagger UI, RabbitMQ management, and MinIO console addresses

#### Scenario: Detect unsupported local runtimes
- **WHEN** the launch flow detects missing Docker Compose, unavailable Java 21, missing npm, or Node.js below the Vite-required version
- **THEN** it MUST print actionable remediation guidance without presenting the environment as demo-ready

#### Scenario: Avoid stale local app listeners
- **WHEN** ports for the backend or frontend are already occupied by local listeners
- **THEN** the launch flow MUST stop or clearly report the stale listeners before starting the current repository services

### Requirement: MVP smoke verification checks critical local surfaces
The system SHALL provide a repeatable smoke verification path that checks whether the local MVP can support a complete demo without mutating procurement business state.

#### Scenario: Verify backend and API documentation
- **WHEN** the smoke verification runs against a started local environment
- **THEN** it MUST verify the backend health endpoint, Swagger UI or OpenAPI JSON, and core API availability using real backend responses

#### Scenario: Verify frontend reachability
- **WHEN** the smoke verification runs against a started local environment
- **THEN** it MUST verify that the frontend workspace responds at the documented URL and does not require frontend static mock data to show procurement content

#### Scenario: Verify infrastructure readiness
- **WHEN** the smoke verification checks infrastructure
- **THEN** it MUST verify MySQL as the required core data store and report MongoDB and MinIO readiness for AI audit and file attachment scenarios

#### Scenario: Preserve procurement business state
- **WHEN** the smoke verification inspects purchase requests, approvals, RFQs, POs, receipts, invoices, three-way matching, dashboards, suppliers, AI, or attachments
- **THEN** it MUST prefer read-only checks and MUST NOT automatically create, approve, cancel, receive, invoice, resolve, or delete business records

### Requirement: Verification records capture current MVP delivery status
The system SHALL maintain developer-facing verification notes that record the latest MVP delivery checks and known environment caveats.

#### Scenario: Record automated verification commands
- **WHEN** a change updates MVP delivery verification
- **THEN** the verification notes MUST list the commands used for backend tests, frontend lint or build, Docker Compose parsing, health checks, OpenAPI checks, and frontend reachability checks

#### Scenario: Record manual demo coverage
- **WHEN** a full MVP demo path is manually checked
- **THEN** the verification notes MUST record which business workbench entries were checked and which company context or group context each entry used

#### Scenario: Record unresolved caveats
- **WHEN** a verification step cannot be completed in the current environment
- **THEN** the verification notes MUST record the skipped or failed step, the reason, and the residual demo risk

### Requirement: Delivery hardening respects MVP scope boundaries
The system SHALL improve delivery confidence without expanding the product scope beyond the current MVP roadmap.

#### Scenario: Avoid new infrastructure scope
- **WHEN** the delivery hardening is implemented
- **THEN** it MUST NOT add Prometheus, Grafana, Jaeger, Zipkin, Keycloak, Redis hard dependencies, RabbitMQ hard dependencies, or new external services

#### Scenario: Avoid new procurement workflow behavior
- **WHEN** the delivery hardening is implemented
- **THEN** it MUST NOT add new purchase request, approval, RFQ, PO, receipt, invoice, three-way matching, supplier, dashboard, AI, or attachment business behavior

#### Scenario: Preserve multi-company data boundaries
- **WHEN** scripts or documentation reference demo data
- **THEN** they MUST preserve the distinction between group-shared suppliers and company-owned procurement transactions for 星河数字科技有限公司 and 星河智能制造有限公司
