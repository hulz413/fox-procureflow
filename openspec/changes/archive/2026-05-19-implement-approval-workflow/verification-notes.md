## Verification Notes

Date: 2026-05-18

### Automated Verification

- Backend tests passed:

  ```bash
  cd backend
  JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH \
    ./gradlew test
  ```

- Frontend build passed with the Codex bundled Node runtime:

  ```bash
  cd frontend
  PATH=/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
    npm run build
  ```

- Environment caveat: the shell default `node` is `v20.11.0`, but Vite requires Node `20.19+` or `22.12+`. The bundled Node `v24.14.0` was used for the successful build.
- Environment caveat: the shell default Java lookup failed until `JAVA_HOME` was set to Homebrew `openjdk@21`.

### Browser Verification

- Existing local ports `8080` and `5173` were already occupied, so this verification used:
  - Backend: `http://localhost:18080`
  - Frontend: `http://127.0.0.1:5174`
- Backend launch command:

  ```bash
  cd backend
  JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH \
    FOX_BACKEND_PORT=18080 \
    FOX_CORS_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174 \
    ./gradlew bootRun --no-daemon
  ```

- Frontend launch command:

  ```bash
  cd frontend
  PATH=/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
    VITE_API_BASE_URL=http://localhost:18080 \
    npm run dev -- --host 127.0.0.1 --port 5174
  ```

- Browser flow verified:
  - Opened `http://127.0.0.1:5174`.
  - Created a 星河数字科技 IT hardware request from the default purchase request form.
  - Submitted local demo request `PR-20260518-0203`.
  - Confirmed matched rule `rule-digital-it-high`.
  - Confirmed approval path:
    - Step 1: `user-digital-approver` / 周明远 / 部门负责人审批.
    - Step 2: `user-digital-finance` / 陈思雨 / 财务审批.
  - Approved step 1 from the approval center as 周明远 with comment `一审同意`.
  - Switched approver to 陈思雨 and approved step 2 with comment `财务同意`.
  - Confirmed the approval detail reached `已通过`.

### MVP Boundary Checks

- Approval submit and actions use MySQL-backed rules, instances, nodes, records, and request data.
- No approval action creates RFQs, purchase orders, receipts, invoices, matching records, AI recommendations, or budget freezes.
- Redis, RabbitMQ, and MinIO are not required by the approval workflow runtime behavior. They may exist in the shared local compose stack from earlier skeleton work, but this change does not call them for approval submit, task listing, details, approve, reject, or withdraw.
- Suppliers and procurement categories remain group-level references; approval instances, nodes, records, and tasks are company-scoped.
- Roadmap still identifies RFQ as the next downstream P0 slice after approval.
