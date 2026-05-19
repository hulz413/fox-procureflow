## Verification Notes

Date: 2026-05-19

## Commands

- `./gradlew test` from `backend`
  - Result: passed after launching with `JAVA_HOME=/opt/homebrew/opt/openjdk@21` and `/opt/homebrew/opt/openjdk@21/bin` on `PATH`.
- `PATH=/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build` from `frontend`
  - Result: passed.
  - Note: Vite emitted the existing large chunk warning.
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./scripts/launch.sh`
  - Result: stopped existing listeners on `8080` and `5173`, started infrastructure, backend, and frontend.
  - Backend result: Flyway at version `13`; receipt/invoice repositories registered; `GET /api/receipts-invoices/purchase-orders?companyId=company-digital` returned `200`.
- Chrome headless DOM check for `http://localhost:5173/receipts-invoices`
  - Result: page rendered with backend `UP`, `PO-20260518-0302`, full receipt/full invoice status, and invoice amount variance visible.
- Browser/API create verification on `PO-20260519-0001`
  - Result: created partial receipt `RCPT-20260519-0303` and supplier invoice `INV-20260519-0302`.
  - Refreshed fulfillment summary showed `2 / 20` received, `2 / 20` invoiced, `PARTIALLY_RECEIVED`, `PARTIALLY_INVOICED`, and invoice amount variance `-115260.00`.
  - Chrome headless DOM check showed backend `UP`, `PO-20260519-0001`, `2 / 20`, `部分收货`, `部分开票`, and amount variance in the rendered page.
- `rg -n "matching|RabbitMQ|Rabbit|MinIO|DeepSeek|payment|three-way|三单" backend/src/main/java/com/foxprocureflow/procurement/execution frontend/src/App.tsx backend/src/main/resources/db/migration/V12__create_receipts_and_invoices.sql backend/src/main/resources/db/migration/V13__seed_demo_receipts_and_invoices.sql`
  - Result: only boundary/demo text mentions matching; no receipt/invoice service, controller, migration, or frontend flow creates matching records, payment records, RabbitMQ events, MinIO uploads, or AI recommendations.

## Demo Records

- Issued PO with no downstream records: `PO-20260518-0301`
- Issued PO with receipt and invoice activity: `PO-20260518-0302`
- Seeded receipts:
  - `RCPT-20260519-0301`
  - `RCPT-20260519-0302`
- Seeded invoice:
  - `INV-20260519-0301`
  - Invoice number: `FP-CHENGCAI-202606-001`
  - Amount variance: `2300.00`
- Local archive verification records:
  - PO: `PO-20260519-0001`
  - Receipt: `RCPT-20260519-0303`
  - Invoice: `INV-20260519-0302`
  - Invoice number: `FP-ARCHIVE-1779164375765`
  - Amount variance: `-115260.00`

## Browser Verification

Target URL: `http://localhost:5173/receipts-invoices`

Verified:

- The sidebar “收货发票” opens `/receipts-invoices`.
- `PO-20260518-0301` appears as an issued PO with no receipt/invoice records.
- `PO-20260518-0302` shows full receipt, full invoice, and invoice amount variance.
- Creating a receipt refreshes fulfillment summaries and receipt list.
- Creating an invoice refreshes fulfillment summaries and invoice list.
