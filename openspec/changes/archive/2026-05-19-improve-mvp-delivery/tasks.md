## 1. MVP Demo Runbook

- [x] 1.1 Audit `README.md`, `docs/dev/local-development.md`, `docs/dev/verification-notes.md`, and `scripts/launch.sh` against the completed MVP roadmap and note stale skeleton-stage wording.
- [x] 1.2 Create or update a human-facing MVP demo runbook that starts from 星河控股集团 and walks through supplier pool, purchase request, approval, RFQ, PO, receipts/invoices, three-way matching, dashboard, AI, and attachments.
- [x] 1.3 Document the multi-company demo boundary so the runbook distinguishes group-shared suppliers from 星河数字科技有限公司 and 星河智能制造有限公司 company-owned procurement transactions.
- [x] 1.4 Update the root and local-development documentation so fresh checkout setup, `.env`, launch, URLs, AI availability, MinIO attachment dependency, and recovery tips point to the MVP demo path.

## 2. Demo Readiness Checks

- [x] 2.1 Harden the local launch flow so missing Docker Compose, Java 21, npm, or supported Node.js versions produce actionable guidance and do not imply the environment is demo-ready.
- [x] 2.2 Add or update a repeatable read-only smoke verification command that checks backend health, OpenAPI or Swagger availability, frontend reachability, and critical infrastructure readiness.
- [x] 2.3 Ensure smoke verification reports MySQL as required and MongoDB/MinIO as AI audit and attachment readiness signals without making Redis or RabbitMQ hard dependencies.
- [x] 2.4 Ensure smoke verification preserves procurement state by avoiding automatic create, approve, cancel, receive, invoice, resolve, or delete operations across the MVP business modules.
- [x] 2.5 Make launch or smoke output summarize the local frontend, backend health, Swagger UI, RabbitMQ management, and MinIO console URLs consistently with the documentation.

## 3. Delivery Verification

- [x] 3.1 Run backend verification for the completed MVP, including the Gradle test suite or a documented focused subset if full tests are not available in the current environment.
- [x] 3.2 Run frontend verification, including lint and production build with a Node.js runtime that satisfies the Vite toolchain requirement.
- [x] 3.3 Run infrastructure and API verification, including Docker Compose configuration parsing, health endpoint checks, OpenAPI checks, and the new smoke verification path.
- [x] 3.4 Manually check the MVP demo workbench entries from the runbook and record which group or company context each checked entry uses.
- [x] 3.5 Update `docs/dev/verification-notes.md` with commands, results, skipped checks, environment caveats, and residual demo risk.
