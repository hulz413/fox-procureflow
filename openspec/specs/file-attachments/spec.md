# file-attachments Spec

## Purpose

Define the shared real-file attachment capability for procurement workflows, including MinIO object storage, company-scoped MySQL metadata, list/download APIs, business association validation, and frontend upload/download behavior for RFQ quotations, receipts, and supplier invoices.

## Requirements

### Requirement: Attachments are uploaded to object storage with company-scoped metadata
The system SHALL allow procurement users to upload real business attachments to MinIO while persisting company-scoped metadata in MySQL.

#### Scenario: Upload RFQ quotation attachment for the digital company
- **WHEN** a user uploads a PDF quotation file for `company-digital` with target type `RFQ_QUOTE`, target RFQ `RFQ-20260518-0301`, target supplier, file name, content type, file size, and optional description
- **THEN** the system MUST validate that the RFQ belongs to `company-digital` and the supplier was invited to the RFQ
- **AND** the system MUST store the file bytes in the configured RFQ MinIO bucket
- **AND** the system MUST persist attachment metadata with `company-digital`, bucket, object key, original file name, content type, size, purpose, target identifiers, uploader, status `READY`, and timestamps
- **AND** the response MUST return a stable `attachmentId`

#### Scenario: Upload receipt proof for the manufacturing company
- **WHEN** a user uploads an image or PDF receiving proof for `company-manufacturing` with target type `RECEIPT`, a valid issued PO context, file name, content type, file size, and optional description
- **THEN** the system MUST validate the PO and future receipt context belong to `company-manufacturing`
- **AND** the system MUST store the file bytes in the configured receipt/invoice MinIO bucket
- **AND** the attachment metadata MUST be visible only in `company-manufacturing` scoped reads

#### Scenario: Reject unsupported file type or oversized file
- **WHEN** a user uploads a file whose content type is not in the configured allowlist or whose size exceeds the configured attachment size limit
- **THEN** the system MUST reject the upload with a client-visible 4xx error
- **AND** the system MUST NOT persist attachment metadata or business attachment associations
- **AND** the system MUST NOT expose a downloadable object for that failed upload

#### Scenario: Reject cross-company attachment target
- **WHEN** a user from `company-digital` attempts to upload an attachment for an RFQ, receipt, invoice, or PO context owned by `company-manufacturing`
- **THEN** the system MUST reject the upload with a client-visible 4xx error
- **AND** the system MUST NOT fall back to the active demo company
- **AND** no MinIO object key MUST be associated with `company-digital`

#### Scenario: Object storage failure does not create ready metadata
- **WHEN** MinIO upload fails after request validation succeeds
- **THEN** the system MUST return a client-visible error
- **AND** the system MUST NOT create a `READY` attachment metadata record
- **AND** the target RFQ quote, receipt, or invoice MUST remain unchanged

### Requirement: Attachment APIs expose company-scoped list and download operations
The system SHALL expose REST APIs for listing and downloading attachments only after explicit company ownership validation.

#### Scenario: List attachments for one RFQ quote
- **WHEN** a caller requests attachments for an RFQ quote with `companyId=company-digital`
- **THEN** the system MUST return only attachments whose metadata and target RFQ quote belong to `company-digital`
- **AND** each attachment row MUST include `attachmentId`, original file name, description, content type, size, storage status, downloadable flag, uploaded user, and timestamps
- **AND** the response MUST NOT include attachments owned by `company-manufacturing`

#### Scenario: Download attachment after company validation
- **WHEN** a caller requests `GET /api/attachments/{attachmentId}/download?companyId=company-digital` for a `READY` attachment owned by `company-digital`
- **THEN** the system MUST validate the attachment metadata, target business object, and company ownership before reading MinIO
- **AND** the response MUST stream the object bytes with the stored content type and original file name

#### Scenario: Reject cross-company download
- **WHEN** a caller requests a `company-manufacturing` attachment download with `companyId=company-digital`
- **THEN** the system MUST reject the request with a client-visible 4xx error
- **AND** the system MUST NOT read the object bytes from MinIO

#### Scenario: Metadata-only attachment is not downloadable
- **WHEN** an existing attachment record has file metadata but no stored object key
- **THEN** the system MUST return the attachment in business detail responses with `downloadable=false`
- **AND** a download request for that attachment MUST be rejected with a client-visible reason that the file is metadata-only

### Requirement: Attachment associations are accepted only by the matching business workflow
The system SHALL allow RFQ quote, receipt, and invoice workflows to associate only uploaded attachments that match the same company, target type, and business object.

#### Scenario: Associate uploaded attachment with RFQ quote
- **WHEN** a procurement user saves a quote for an invited supplier and references one or more uploaded `RFQ_QUOTE` attachment IDs
- **THEN** the system MUST verify each attachment is `READY`, belongs to the same `companyId`, RFQ, and supplier context
- **AND** the quote response MUST include the uploaded attachments with `downloadable=true`

#### Scenario: Associate uploaded attachment with receipt
- **WHEN** a warehouse or procurement user creates a receipt and references uploaded `RECEIPT` attachment IDs
- **THEN** the system MUST verify each attachment belongs to the same `companyId` and PO context as the receipt
- **AND** the receipt response MUST include the uploaded attachments with `downloadable=true`

#### Scenario: Associate uploaded attachment with supplier invoice
- **WHEN** a finance or procurement user creates a supplier invoice and references uploaded `INVOICE` attachment IDs
- **THEN** the system MUST verify each attachment belongs to the same `companyId`, PO, and supplier context as the invoice
- **AND** the invoice response MUST include the uploaded attachments with `downloadable=true`

#### Scenario: Reject attachment reuse across incompatible targets
- **WHEN** a user references a `RECEIPT` attachment ID while saving an RFQ quote or references an attachment already linked to a different company-owned target
- **THEN** the system MUST reject the business request with a client-visible 4xx error
- **AND** the existing attachment association MUST remain unchanged

### Requirement: Frontend uses real attachment upload and download controls
The frontend SHALL provide real upload and download controls in RFQ and 收货发票 workflows without using static mock files.

#### Scenario: Upload and attach a quotation file from RFQ detail
- **WHEN** a procurement user opens an RFQ detail, selects an invited supplier, uploads a quotation file, and saves quote data
- **THEN** the frontend MUST call the attachment upload API before quote upsert
- **AND** the quote upsert request MUST reference the returned `attachmentId`
- **AND** the RFQ detail and comparison views MUST refresh to show the backend attachment metadata and download action

#### Scenario: Upload and attach receipt and invoice files
- **WHEN** a warehouse or finance user creates a receipt or supplier invoice from the 收货发票 workspace and uploads a file
- **THEN** the frontend MUST call the attachment upload API and submit only backend `attachmentId` references with the business form
- **AND** the receipt or invoice list and detail drawer MUST refresh to show backend attachment state

#### Scenario: Show disabled download reason for metadata-only attachments
- **WHEN** an attachment row is metadata-only or not downloadable
- **THEN** the frontend MUST disable the download action
- **AND** the disabled control MUST provide a tooltip explaining the specific reason

#### Scenario: Confirm before leaving uploaded unsaved attachments
- **WHEN** a user has uploaded attachments in an editable RFQ quote, receipt, or invoice form but has not saved the business object, and then closes, switches selected row, or leaves the current edit object
- **THEN** the frontend MUST show a confirmation prompt before discarding the current edit context
