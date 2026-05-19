## Purpose

Define the read-only procurement dashboard for Fox Procureflow, including explicit group and company scopes, backend aggregation semantics, chart-ready metrics, frontend management dashboard behavior, and boundaries that exclude deferred infrastructure and AI-generated summaries.

## Requirements

### Requirement: Procurement dashboard exposes explicit group and company scopes
The system SHALL provide a read-only procurement dashboard that can aggregate data for the demo group or for one selected company, with explicit scope semantics and company ownership validation.

#### Scenario: Query group dashboard
- **WHEN** a caller requests `GET /api/procurement-dashboard?scope=GROUP`
- **THEN** the system MUST return dashboard data aggregated across 星河数字科技有限公司 and 星河智能制造有限公司
- **AND** the response MUST identify the scope as `GROUP`, include the demo group identifier, and include the generated timestamp

#### Scenario: Query company dashboard
- **WHEN** a caller requests `GET /api/procurement-dashboard?scope=COMPANY&companyId=company-digital`
- **THEN** the system MUST return dashboard data aggregated only from records owned by `company-digital`
- **AND** the response MUST identify the scope as `COMPANY`, include `company-digital`, and include the company display name
- **AND** the response MUST NOT include procurement records owned by `company-manufacturing`

#### Scenario: Reject company dashboard without valid company
- **WHEN** a caller requests a company dashboard with a missing or unknown `companyId`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company

### Requirement: Dashboard summarizes procurement lifecycle metrics
The system SHALL summarize the current procurement lifecycle using existing purchase request, approval, RFQ, purchase order, receipt, invoice, and three-way matching data.

#### Scenario: Return dashboard summary metrics
- **WHEN** a caller queries the procurement dashboard for `company-digital`
- **THEN** the response MUST include summary metrics for purchase amount, pending approvals, active RFQs, issued purchase orders, receipt or invoice follow-up, and three-way matching exceptions
- **AND** each metric MUST include a stable key, display label, numeric value, optional currency, and source timestamp or generated timestamp

#### Scenario: Calculate purchase amount from issued purchase orders
- **WHEN** the dashboard calculates purchase amount for a selected scope
- **THEN** the amount MUST be aggregated from issued purchase order total amounts in that scope
- **AND** draft or cancelled purchase orders MUST NOT increase the issued purchase amount

#### Scenario: Count pending approval work
- **WHEN** the dashboard calculates pending approvals for a selected scope
- **THEN** the count MUST include active or in-progress approval work owned by companies in that scope
- **AND** completed, rejected, or withdrawn approval instances MUST NOT be counted as pending approval work

#### Scenario: Count matching exceptions
- **WHEN** the dashboard calculates matching exceptions for a selected scope
- **THEN** the count MUST include current three-way matching results with status `EXCEPTION`
- **AND** matched, pending input, and resolved matching results MUST NOT be counted as active exceptions

### Requirement: Dashboard provides trends, funnel, distributions, and exception highlights
The system SHALL expose chart-ready datasets that help managers understand procurement progress, supplier concentration, and financial risk.

#### Scenario: Return purchase amount trend
- **WHEN** a caller queries the dashboard for the group scope
- **THEN** the response MUST include a purchase amount trend grouped by month or demo reporting period
- **AND** each trend point MUST include period, amount, currency, and source document count

#### Scenario: Return procurement document funnel
- **WHEN** a caller queries the dashboard for a selected scope
- **THEN** the response MUST include funnel counts for purchase requests, approved requests, comparable RFQs, issued purchase orders, received purchase orders, invoiced purchase orders, and matched purchase orders
- **AND** the counts MUST be computed from backend data rather than frontend static constants

#### Scenario: Return status distributions
- **WHEN** a caller queries the dashboard for a selected scope
- **THEN** the response MUST include status distributions for at least approval, RFQ, purchase order, receipt, invoice, and three-way matching records
- **AND** each distribution bucket MUST include status, count, and business label

#### Scenario: Return supplier distribution
- **WHEN** a caller queries the dashboard for a selected scope
- **THEN** the response MUST include supplier distribution data based on supplier-related RFQ quote or purchase order records in that scope
- **AND** supplier master data MAY come from the group-shared supplier pool while transaction amounts and counts MUST remain scoped to the selected companies

#### Scenario: Return matching exception highlights
- **WHEN** the selected scope contains three-way matching exceptions
- **THEN** the response MUST include exception highlights with match identifier, company identifier, PO number or PO identifier, supplier, severity, invoice variance, and last calculated timestamp
- **AND** the highlights MUST be ordered so the most severe or most recent exceptions are visible first

### Requirement: Dashboard APIs are documented and remain read-only
The system SHALL document dashboard APIs and keep the dashboard capability free of business mutations, deferred infrastructure, and AI-generated summaries.

#### Scenario: Swagger documents procurement dashboard endpoint
- **WHEN** a developer opens Swagger UI or requests `/v3/api-docs`
- **THEN** the API documentation MUST include the procurement dashboard endpoint, query parameters, scope values, and response shape

#### Scenario: Dashboard query does not mutate procurement records
- **WHEN** a caller queries the procurement dashboard
- **THEN** the system MUST NOT create, update, or delete purchase requests, approval instances, RFQs, purchase orders, receipts, invoices, three-way matching results, handling records, uploaded files, or payment records

#### Scenario: Dashboard does not require deferred infrastructure or AI
- **WHEN** a developer runs the procurement dashboard in the MVP local environment
- **THEN** the dashboard MUST use MySQL-backed existing business data and synchronous request handling
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, DeepSeek, or another AI service

### Requirement: Frontend provides a management procurement dashboard
The frontend SHALL provide a real procurement dashboard page for managers to review group and company procurement status using backend dashboard APIs.

#### Scenario: Open procurement dashboard from navigation
- **WHEN** a user selects “采购看板” in the workspace navigation or opens the application root route
- **THEN** the frontend MUST show the procurement dashboard page
- **AND** the page MUST load dashboard data from backend APIs rather than frontend static mock data

#### Scenario: Switch dashboard scope
- **WHEN** a user switches the dashboard scope between group summary and a specific company
- **THEN** the frontend MUST request dashboard data for the selected scope
- **AND** the visible KPI cards, charts, distributions, and exception highlights MUST refresh to match that scope

#### Scenario: Review dashboard KPI and chart sections
- **WHEN** dashboard data loads successfully
- **THEN** the page MUST show KPI cards for purchase amount, pending approvals, active RFQs, issued purchase orders, and matching exceptions
- **AND** the page MUST show chart-ready views for purchase amount trend, procurement document funnel, status distribution, and supplier distribution

#### Scenario: Review exception highlights
- **WHEN** the dashboard response contains matching exception highlights
- **THEN** the frontend MUST show the exception company, PO or match reference, supplier, severity, invoice variance, and last calculated timestamp
- **AND** the frontend SHOULD provide a navigation path to the three-way matching page for detailed handling

#### Scenario: Show real empty state without static filler
- **WHEN** a selected company has no records for a dashboard section
- **THEN** the frontend MUST show a clear empty state for that section
- **AND** it MUST NOT fill the section with hard-coded procurement demo metrics

#### Scenario: Show dashboard loading and error states
- **WHEN** dashboard data is loading or the dashboard API fails
- **THEN** the frontend MUST show a loading or error state that does not overlap with existing workspace controls
- **AND** the user MUST still be able to switch company context or navigate to other procurement pages
