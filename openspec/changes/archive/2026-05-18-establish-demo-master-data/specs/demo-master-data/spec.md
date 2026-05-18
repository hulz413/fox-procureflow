## ADDED Requirements

### Requirement: Demo organization master data is seeded
The system SHALL seed stable organization master data for the Fox Procureflow MVP demo, including 星河控股集团, 星河数字科技有限公司, 星河智能制造有限公司, departments, users, and roles.

#### Scenario: Seed group and company context
- **WHEN** the backend database migrations run on an empty local MySQL database
- **THEN** the system MUST create stable records for `group-xinghe`, `company-digital`, and `company-manufacturing`
- **AND** each company MUST include its roadmap business scope and active/inactive demo context metadata

#### Scenario: Seed departments users and roles
- **WHEN** a developer queries the seeded organization master data
- **THEN** each demo company MUST have departments and users covering applicant, approver, procurement, finance, warehouse, administrator, and demo operator roles needed by later P0 slices

### Requirement: Group shared supplier pool is available
The system SHALL provide a group-level shared supplier pool for the demo companies.

#### Scenario: Seed roadmap suppliers
- **WHEN** the backend database migrations run
- **THEN** the shared supplier pool MUST include 上海云舟信息技术有限公司, 深圳蓝芯电子科技有限公司, 苏州恒润工业设备有限公司, 杭州诚采办公用品有限公司, and 宁波安捷物流有限公司

#### Scenario: Suppliers are shared across companies
- **WHEN** a caller requests supplier master data from either demo company context
- **THEN** the system MUST return the same group-level supplier pool
- **AND** the response MUST make clear that suppliers are shared group data, not company-owned procurement records

### Requirement: Procurement categories and budget accounts are available
The system SHALL provide procurement categories and company-scoped budget accounts for later procurement request validation.

#### Scenario: Procurement categories are group-level reference data
- **WHEN** a caller requests procurement categories
- **THEN** the system MUST return group-level categories covering IT equipment, software subscription, office supplies, production consumables, equipment spare parts, and logistics services

#### Scenario: Budget accounts are scoped by company
- **WHEN** a caller requests budget accounts for `company-digital`
- **THEN** the system MUST return only 星河数字科技有限公司 budget accounts
- **AND** the response MUST NOT include 星河智能制造有限公司 budget accounts

#### Scenario: Unknown company budget account request is rejected
- **WHEN** a caller requests budget accounts for an unknown `companyId`
- **THEN** the system MUST return a client-visible error instead of silently falling back to the default company

### Requirement: Read-only master data APIs expose stable identifiers
The system SHALL expose read-only backend APIs for demo master data with stable business identifiers suitable for later P0 business slices.

#### Scenario: Query demo context API
- **WHEN** a caller requests `GET /api/master-data/context`
- **THEN** the system MUST return the group, default active company, company list, supplier pool scope, and group/company data boundary using seeded master data

#### Scenario: Query company-scoped master data APIs
- **WHEN** a caller requests company-scoped departments, users, or budget accounts with a valid `companyId`
- **THEN** the system MUST return only records belonging to that company
- **AND** every record MUST include a stable business identifier that later procurement workflows can reference

#### Scenario: Query shared supplier and category APIs
- **WHEN** a caller requests shared suppliers or procurement categories
- **THEN** the system MUST return group-level records with stable supplier and category identifiers

#### Scenario: Master data APIs appear in OpenAPI documentation
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the master data endpoints MUST be documented with their response shapes

### Requirement: Frontend validates master data from backend APIs
The frontend SHALL provide a read-only foundation data view that verifies the backend master data APIs in the procurement workspace.

#### Scenario: Open foundation data view
- **WHEN** a user opens the frontend foundation data view
- **THEN** the page MUST display group and company context fetched from the backend master data APIs
- **AND** it MUST preserve the F 库采 SaaS visual baseline from the project skeleton

#### Scenario: View shared and company-scoped data together
- **WHEN** a user selects a demo company in the foundation data view
- **THEN** the page MUST show the group shared supplier pool and procurement categories
- **AND** it MUST show only the selected company's departments, users, and budget accounts

#### Scenario: Foundation data view remains read-only
- **WHEN** a user inspects the foundation data view
- **THEN** the page MUST NOT present create, edit, delete, approval, RFQ, PO, receipt, invoice, or matching actions

### Requirement: Demo master data does not implement procurement workflows
The system SHALL keep this change focused on foundation data and SHALL NOT implement downstream procurement workflows.

#### Scenario: Business workflow endpoints are absent
- **WHEN** a developer inspects the API surface after this change
- **THEN** procurement request, approval, RFQ, PO, receiving, invoice, and three-way matching endpoints MUST NOT be implemented as real business workflows by this change

#### Scenario: AI behavior remains out of scope
- **WHEN** a developer inspects the foundation data implementation
- **THEN** DeepSeek API integration and AI procurement assistant behavior MUST NOT be introduced by this change
