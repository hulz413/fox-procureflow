## Why

RFQ, receipt, and invoice workflows currently store only attachment metadata placeholders, so the MVP can describe files but cannot demonstrate uploaded quotation sheets, receiving proofs, or invoice files. Now that the core procurement loop, three-way matching, dashboard, AI assistant, and supplier pool are stable, this change completes the roadmap's "real attachment upload" slice with MinIO-backed file storage and company-scoped business associations.

## What Changes

- Add a real attachment capability for uploading, listing, downloading, and validating business files stored in MinIO with MySQL metadata.
- Associate uploaded attachments with RFQ supplier quotes, receipts, and supplier invoices while preserving each document's company ownership.
- Replace placeholder-only attachment behavior in RFQ quote capture and receipt/invoice registration with uploaded attachment references plus fallback display for existing metadata.
- Add backend validation for file size, content type, target business object, company ownership, and allowed attachment purposes.
- Add frontend upload and attachment-list interactions in the existing RFQ and 收货发票 workspaces, using backend APIs instead of static mock files.
- Keep purchase request intake attachments, payment flows, supplier self-service uploads, object versioning, virus scanning, RabbitMQ events, and external SaaS identity outside this change.

## Capabilities

### New Capabilities

- `file-attachments`: Real MinIO-backed attachment upload, download, metadata, validation, and business-object association for procurement documents.

### Modified Capabilities

- `rfq`: RFQ supplier quotes may reference uploaded quotation attachments instead of only storing placeholder file metadata.
- `receipts-and-invoices`: Receipt and invoice creation may reference uploaded receiving proof and invoice attachments instead of only storing placeholder file metadata.

## Impact

- Backend: new attachment storage service, MinIO client configuration, bucket initialization, REST APIs, DTOs, validators, repositories, Flyway migration, and Swagger documentation.
- Data: MySQL attachment metadata table with company ownership, target type, target ID, object key, original filename, content type, size, checksum/status timestamps, and uploader snapshot.
- Object storage: MinIO bucket and deterministic object key strategy for RFQ quotes, receipts, and invoices.
- Frontend: RFQ detail/quote form and 收货发票 receipt/invoice forms/details gain upload, download, validation feedback, and real attachment state.
- Tests: backend service/API tests for upload/download/ownership validation and frontend tests for upload controls and refreshed attachment displays.
