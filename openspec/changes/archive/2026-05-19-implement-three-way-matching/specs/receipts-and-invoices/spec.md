## MODIFIED Requirements

### Requirement: Receipts and invoices do not implement matching, payment, upload, or AI workflows
The system SHALL keep receipt and invoice registration focused on factual receipt/invoice data while allowing the three-way matching capability to synchronously refresh matching results after successful receipt or invoice creation; the workflow SHALL NOT create payment, object storage, asynchronous messaging, or AI-generated decisions.

#### Scenario: Receipt creation refreshes matching records after matching is available
- **WHEN** a receipt is created for an issued purchase order after the three-way matching capability is available
- **THEN** the system MUST synchronously recalculate the current three-way matching result for the same `companyId` and `poId`
- **AND** the receipt MUST remain available as source input for the matching detail
- **AND** the system MUST NOT create payment records, RabbitMQ events, or AI recommendations

#### Scenario: Invoice creation refreshes matching records after matching is available
- **WHEN** a supplier invoice is created for an issued purchase order after the three-way matching capability is available
- **THEN** the system MUST synchronously recalculate the current three-way matching result for the same `companyId` and `poId`
- **AND** the invoice MUST remain available as source input for the matching detail
- **AND** the system MUST NOT create payment records, RabbitMQ events, or AI recommendations

#### Scenario: Receipt and invoice creation rolls back if matching refresh fails
- **WHEN** receipt or invoice creation succeeds in validation but the synchronous matching refresh fails for the same purchase order
- **THEN** the system MUST roll back the receipt or invoice creation transaction
- **AND** the system MUST NOT leave source receipt/invoice data without a refreshed matching result

#### Scenario: Receipt and invoice workflow does not require deferred infrastructure
- **WHEN** a developer runs the receipt, invoice, and matching refresh workflow in the MVP local environment
- **THEN** the workflow MUST use MySQL and synchronous service calls
- **AND** it MUST NOT require Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, or DeepSeek
