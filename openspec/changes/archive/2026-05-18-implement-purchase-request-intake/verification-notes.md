## Verification

Date: 2026-05-18

Commands run:

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew test` in `backend`
- `PATH=/opt/homebrew/opt/node/bin:$PATH npm run build` in `frontend`
- `curl http://localhost:8080/api/health`
- `curl http://localhost:8080/v3/api-docs`
- `POST http://localhost:8080/api/purchase-requests/drafts`
- `POST http://localhost:8080/api/purchase-requests/PR-20260518-0001/submit`
- `GET http://localhost:8080/api/purchase-requests?companyId=company-digital&status=SUBMITTED`
- `GET http://localhost:8080/api/purchase-requests/PR-20260518-0001`

Local services:

- Infrastructure: `docker compose -f infra/docker-compose.yml ps`
- Backend: `http://localhost:8080/api/health`
- Frontend: `http://127.0.0.1:5173/purchase-requests`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

Observed result:

- Backend tests passed.
- Frontend production build passed.
- Swagger includes purchase request endpoints.
- Created and submitted `PR-20260518-0001` for `company-digital`.
- List/detail APIs returned “20 台笔记本采购” with `SUBMITTED` status, one line item, and total amount `186000`.
- Chrome rendered `/purchase-requests` with real list, detail, company selector, backend `后端 UP` status, and the submitted request visible.
- Added V4 demo purchase request seed data and verified `company-digital` now returns multiple request records.
- Adjusted truncated UI text to expose native hover tooltips and tuned status tags for vertical text centering.

Environment notes:

- The system `/usr/bin/java` launcher did not see Java 21, so verification used Homebrew JDK 21 through `JAVA_HOME`.
- The default `node` was `v20.11.0`, while Vite requires `>=20.19`; verification used Homebrew Node from `/opt/homebrew/opt/node/bin`.
