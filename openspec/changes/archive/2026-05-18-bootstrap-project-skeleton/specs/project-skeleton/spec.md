## ADDED Requirements

### Requirement: Local development foundation starts required services
The system SHALL provide a local development foundation that starts the MVP infrastructure services needed by later procurement slices.

#### Scenario: Start local infrastructure
- **WHEN** a developer starts the local infrastructure from the documented command
- **THEN** MySQL, MongoDB, Redis, RabbitMQ, and MinIO MUST be available through stable local service names and documented ports

#### Scenario: Excluded observability and identity services are absent
- **WHEN** a developer inspects the local infrastructure definition
- **THEN** Prometheus, Grafana, Jaeger, Zipkin, and Keycloak MUST NOT be included in the MVP skeleton

### Requirement: Backend service exposes health and API documentation
The system SHALL provide a runnable backend service for Fox Procureflow using the roadmap backend stack and exposing baseline REST API surfaces.

#### Scenario: Health endpoint reports service availability
- **WHEN** a developer starts the backend service and requests `GET /api/health`
- **THEN** the system MUST return a successful response containing service status and Fox Procureflow application identity

#### Scenario: API documentation is reachable
- **WHEN** a developer starts the backend service and opens the documented Swagger UI URL
- **THEN** the system MUST show generated API documentation for the available skeleton endpoints

### Requirement: Frontend shell presents the procurement workspace
The system SHALL provide a runnable frontend application shell for the internal procurement workspace.

#### Scenario: Open frontend workspace
- **WHEN** a developer starts the frontend and opens the documented local frontend URL
- **THEN** the system MUST display the Fox Procureflow procurement workspace rather than a marketing landing page

#### Scenario: Verify frontend to backend connectivity
- **WHEN** the frontend workspace loads while the backend is running
- **THEN** the system MUST call the backend health endpoint and display a successful connection state in the workspace

### Requirement: Final F procurement SaaS visual baseline is applied
The frontend shell SHALL apply the final agreed "F 库采 SaaS" visual baseline for a modern B2B procurement and inventory operations tool.

#### Scenario: Visual baseline uses agreed tokens
- **WHEN** the frontend workspace is rendered
- **THEN** the system MUST use low-saturation green brand emphasis with primary color `#2f7a4d`, light gray main background, white panels, thin borders, and minimal shadows

#### Scenario: Visual baseline avoids marketing decoration
- **WHEN** the frontend workspace is rendered
- **THEN** the system MUST avoid hero marketing layouts, gradients, illustrations, and decorative visual effects that do not support procurement operations

### Requirement: Multi-company demo context is visible and preserved
The system SHALL present the MVP as a group-internal, multi-company procurement platform with explicit company context.

#### Scenario: Group and company context appears in the shell
- **WHEN** a user views the frontend workspace
- **THEN** the system MUST show 星河控股集团 context and at least one active company context from the roadmap demo companies

#### Scenario: Company isolation convention is represented
- **WHEN** a developer reviews skeleton backend structure, frontend context naming, or seed-data placeholders
- **THEN** the system MUST distinguish group-level shared data such as the supplier pool from company-owned procurement data such as requests, approvals, orders, receipts, invoices, and matching results

### Requirement: Skeleton does not implement business workflows
The system SHALL keep the skeleton focused on the engineering and visual foundation while preserving extension points for later business workflows.

#### Scenario: Business modules are placeholders only
- **WHEN** a developer inspects the skeleton application
- **THEN** procurement request, approval, RFQ, PO, receiving, invoice, and three-way matching capabilities MUST exist only as navigation, package, route, or documentation placeholders

#### Scenario: No final AI behavior is mocked as production
- **WHEN** a developer inspects the skeleton application
- **THEN** DeepSeek API integration and AI procurement assistant behavior MUST NOT be presented as final production functionality

### Requirement: Developer documentation enables end-to-end verification
The system SHALL document the shortest path to verify the skeleton from a fresh checkout.

#### Scenario: Use unified launch script
- **WHEN** a developer runs `scripts/launch.sh` from the repository root
- **THEN** the script MUST start or guide startup for local infrastructure, backend, and frontend, then print the frontend URL, backend health URL, and Swagger UI URL

#### Scenario: Follow documented startup path
- **WHEN** a developer follows the documented local startup instructions
- **THEN** the developer MUST be able to start infrastructure, backend, and frontend, then verify the frontend workspace, backend health endpoint, and Swagger UI

#### Scenario: Document environment and ports
- **WHEN** a developer reads the development documentation
- **THEN** the documentation MUST list required tooling, local environment variables, and default ports for frontend, backend, and infrastructure services

### Requirement: Backend data access defaults to Spring Data JPA with extension boundaries
The backend skeleton SHALL use Spring Data JPA as the default MySQL data access layer while preserving extension points for later complex procurement queries.

#### Scenario: Default relational access uses Spring Data JPA
- **WHEN** a developer inspects backend relational persistence dependencies and skeleton repositories
- **THEN** the system MUST use Spring Data JPA as the default data access approach for MySQL-backed skeleton modules

#### Scenario: Future query alternatives remain possible
- **WHEN** later business slices require complex read models, reporting queries, RFQ comparisons, or three-way matching projections
- **THEN** the skeleton MUST keep data access behind module-level repository or service boundaries so MyBatis Plus, native SQL, or dedicated read models can be introduced by a later change without replacing controller contracts
