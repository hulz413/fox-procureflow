# RFQ Verification Notes

Date: 2026-05-19

## Automated Verification

- Backend tests passed:
  `JAVA_HOME=/Users/hulz/.cache/codex-jdks/jdk-21.0.11+10/Contents/Home PATH=/Users/hulz/.cache/codex-jdks/jdk-21.0.11+10/Contents/Home/bin:$PATH ./gradlew test`
- Frontend build passed:
  `PATH=/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build`
- Vite emitted the existing large chunk warning for the application bundle; the build completed successfully.

## Local Browser Verification

- Local infrastructure was started/confirmed with:
  `docker compose -f infra/docker-compose.yml up -d`
- Default ports `8080` and `5173` were already occupied, so RFQ verification used:
  - Backend: `http://localhost:18080`
  - Frontend: `http://127.0.0.1:5174/rfqs`
- Backend command:
  `JAVA_HOME=/Users/hulz/.cache/codex-jdks/jdk-21.0.11+10/Contents/Home PATH=/Users/hulz/.cache/codex-jdks/jdk-21.0.11+10/Contents/Home/bin:$PATH FOX_BACKEND_PORT=18080 FOX_CORS_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174 ./gradlew bootRun --no-daemon`
- Frontend command:
  `PATH=/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH VITE_API_BASE_URL=http://localhost:18080 npm run dev -- --host 127.0.0.1 --port 5174`

Browser flow verified:

- Prepared an approved 星河数字科技 IT hardware request as the browser precondition:
  - Request: `PR-20260519-0305`
  - Approval: `AP-20260519-0305`
  - Status: `APPROVED`
- In the RFQ workspace, created:
  - RFQ: `RFQ-20260519-0001`
  - Source request: `PR-20260519-0305`
  - Company: `company-digital`
  - Procurement user: `user-digital-buyer`
- Invited three group-shared IT hardware suppliers:
  - `supplier-yunzhou` - 上海云舟信息技术有限公司
  - `supplier-chengcai` - 杭州诚采办公用品有限公司
  - `supplier-bluechip` - 深圳蓝芯电子科技有限公司
- Entered quote metadata for all three suppliers. The RFQ detail view showed `3/3` quote progress and `可比价`.
- Comparison ranking was visible in the browser and confirmed through the API:
  1. `supplier-bluechip`, total `126560.00`, attachment `bluechip-rfq-browser.pdf`
  2. `supplier-chengcai`, total `129950.00`, attachment `chengcai-rfq-browser.pdf`
  3. `supplier-yunzhou`, total `133340.00`, attachment `yunzhou-rfq-browser.pdf`

## Boundary Checks

- `backend/src/main/java/com/foxprocureflow/procurement/rfq` contains no PO, receipt, invoice, three-way matching, supplier portal, AI, budget-freeze, Redis, RabbitMQ, MongoDB, MinIO, Prometheus, Grafana, Jaeger, Zipkin, or Keycloak runtime dependencies.
- Local MySQL check found zero downstream execution tables named `purchase_orders`, `receipts`, `invoices`, or `matching_records`, and confirmed `RFQ-20260519-0001` exists.
- RFQ remains scoped to MySQL-backed synchronous create, quote capture, and deterministic comparison. PO 采购订单 is the next P0 downstream slice.

## Environment Caveats

- The host Java runtime was unavailable during verification, so the local Temurin JDK 21 under `/Users/hulz/.cache/codex-jdks/jdk-21.0.11+10/Contents/Home` was used.
- The default Node.js runtime was `20.11.0`, below the current Vite requirement of Node `20.19+`, so the bundled runtime under `/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin` was used.
