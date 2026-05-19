# Purchase Order Verification Notes

Date: 2026-05-19

## Automated Verification

- Purchase order integration tests passed:
  `JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home ./gradlew test --tests com.foxprocureflow.procurement.order.PurchaseOrderIntegrationTest`
- Backend full test suite passed:
  `JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home ./gradlew test`
- Frontend production build passed:
  `PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin npm run build`
- Vite emitted the existing large chunk warning for the application bundle; the build completed successfully.

## Local Browser Verification

- Local infrastructure was started/confirmed with:
  `docker compose -f infra/docker-compose.yml up -d`
- Default ports `8080` and `5173` were already occupied by existing local processes, so PO verification used:
  - Backend: `http://localhost:18080`
  - Frontend: `http://127.0.0.1:5174/purchase-orders`
- Backend command:
  `JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home FOX_BACKEND_PORT=18080 FOX_CORS_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174 ./gradlew bootRun`
- Frontend command:
  `PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin VITE_API_BASE_URL=http://localhost:18080 npm run dev -- --host 127.0.0.1 --port 5174`
- Flyway applied `V10__create_purchase_orders.sql` to the local MySQL schema during backend startup.

Browser flow verified from `http://127.0.0.1:5174/purchase-orders`:

- Prepared an approved 星河数字科技 IT hardware request as the browser precondition:
  - Request: `PR-20260519-0306`
  - Approval: `AP-20260519-0306`
  - Status: `APPROVED`
- Created a comparable RFQ and selected quote through browser-context API calls:
  - RFQ: `RFQ-20260519-0002`
  - RFQ status: `COMPARISON_READY`
  - Selected quote: `RFQ-20260519-0002-Q01`
  - Supplier: `supplier-bluechip` / 深圳蓝芯电子科技有限公司
- Created and published purchase order:
  - PO: `PO-20260519-0001`
  - Status after publish: `ISSUED`
  - Status actions: `CREATED`, `PUBLISHED`
- The PO workspace rendered the list row for `PO-20260519-0001` with source RFQ, supplier, total amount, planned delivery date, and `已发布` status.
- Opening PO detail rendered quote snapshot, delivery schedule, line snapshot, and auditable status records for `创建` and `发布`.

## Boundary Checks

- PO publication does not create receipts, invoices, three-way matching results, supplier portal tasks, RabbitMQ events, payment records, attachment uploads, or AI recommendations.
- Local MySQL check after browser verification:
  - `purchase_orders`: `1`
  - `purchase_order_status_records`: `2`
  - No downstream execution tables named `receipts`, `invoices`, `matching_records`, `payments`, or `supplier_portal_tasks` exist.
- `backend/src/main/java/com/foxprocureflow/procurement/order` uses MySQL/JPA repositories and synchronous service calls against RFQ, purchase request, approval, and master data repositories.
- The PO runtime path contains no Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, Keycloak, DeepSeek, or OpenAI/AI integration.
- Roadmap now marks `implement-purchase-orders` as implemented and verified, with `收货与发票` identified as the next downstream P0 slice.

## Environment Caveats

- The default macOS Java lookup did not provide a usable JDK for Gradle, so Homebrew OpenJDK 21 was used explicitly.
- The default Node.js runtime seen by `npm run build` was `20.11.0`, below the Vite requirement of Node `20.19+` or `22.12+`; using `/opt/homebrew/bin` provided Node `25.9.0` and the build passed.
- Existing local services on `8080` and `5173` were left untouched; the verification run used `18080` and `5174`.
