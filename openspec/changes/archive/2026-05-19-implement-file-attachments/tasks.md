## 1. Upload Foundation

- [x] 1.1 Add MinIO Java SDK dependency, attachment configuration properties, MinIO client bean, and startup bucket validation for the existing local buckets.
- [x] 1.2 Add Flyway migration for unified file attachment metadata and any required links from RFQ quote, receipt, and invoice attachment records.
- [x] 1.3 Implement attachment domain types for target type, purpose, storage status, validation result, and downloadable metadata responses.
- [x] 1.4 Implement attachment upload service that validates company ownership, target context, file name, content type, size, object key generation, MinIO upload, metadata persistence, and failure cleanup.
- [x] 1.5 Implement company-scoped attachment list and download APIs, including metadata-only disabled download behavior and Swagger documentation.

## 2. RFQ Quotation Attachments

- [x] 2.1 Update RFQ quote upsert request/response shapes to accept uploaded attachment IDs and return downloadable attachment metadata.
- [x] 2.2 Validate RFQ quote attachment IDs against company, RFQ, invited supplier, target purpose, storage status, and incompatible reuse before saving quote changes.
- [x] 2.3 Preserve existing metadata-only RFQ quote attachments as read-only, non-downloadable rows in detail and comparison responses.
- [x] 2.4 Update RFQ frontend quote entry to upload quotation files, show upload progress/state, submit attachment IDs, refresh quote/comparison data, and show disabled download tooltips.

## 3. Receipt And Invoice Attachments

- [x] 3.1 Update receipt create request/response handling to accept uploaded receipt attachment IDs and return downloadable attachment metadata.
- [x] 3.2 Update supplier invoice create request/response handling to accept uploaded invoice attachment IDs and return downloadable attachment metadata.
- [x] 3.3 Validate receipt and invoice attachment IDs against company, issued PO, supplier context, target purpose, storage status, and incompatible reuse before business persistence.
- [x] 3.4 Preserve matching refresh transaction behavior so receipt/invoice creation rolls back source data and business attachment associations when matching refresh fails.
- [x] 3.5 Update 收货发票 frontend forms and detail/list views to upload files, submit attachment IDs, refresh attachment state, and explain metadata-only or pending-file disabled actions.

## 4. Demo And Documentation

- [x] 4.1 Update `.env.example`, README, and MinIO local notes with attachment configuration, bucket usage, supported file types, size limits, and verification steps.
- [x] 4.2 Ensure demo data still provides at least three RFQ/receipt/invoice attachment states across uploaded-ready, metadata-only, and no-attachment records without requiring static frontend mocks.
- [x] 4.3 Keep purchase request Intake attachment upload out of navigation and forms, with no new procurement request attachment API behavior.

## 5. Verification

- [x] 5.1 Add backend tests for successful RFQ, receipt, and invoice upload/list/download flows using company-scoped targets.
- [x] 5.2 Add backend tests for unsupported type, oversized file, missing MinIO object, cross-company upload/download, invalid attachment reuse, and metadata-only download rejection.
- [x] 5.3 Add backend tests that receipt/invoice matching refresh rollback does not leave business attachment associations.
- [x] 5.4 Add frontend tests for RFQ quotation upload, receipt/invoice upload, disabled tooltip reasons, unsaved-upload confirmation, and refreshed attachment displays.
- [x] 5.5 Run backend tests, frontend tests/build, and OpenSpec validation/status checks for `implement-file-attachments`.
