## Verification Notes

Date: 2026-05-18

### Passed

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./gradlew test --no-daemon`
  - Result: passed.
  - Coverage: Flyway/JPA seed load, master data APIs, company budget isolation, unknown company 404 JSON, OpenAPI paths.
- `PATH="/opt/homebrew/bin:$PATH" npm run build`
  - Result: passed.
  - Note: Vite reported a large chunk warning from the current Ant Design/ECharts bundle; build completed successfully.
- Docker Compose infrastructure:
  - `docker compose -f infra/docker-compose.yml ps`
  - Result: MySQL, MongoDB, Redis, RabbitMQ and MinIO were running; MySQL/MongoDB/Redis/RabbitMQ reported healthy where healthchecks exist.
- Empty database Flyway verification using the Docker Compose MySQL service:
  - Created temporary database `fox_procureflow_verify`.
  - Started backend with `FOX_MYSQL_URL=jdbc:mysql://localhost:3306/fox_procureflow_verify?... ./gradlew bootRun --no-daemon`.
  - Result: Flyway validated and applied V1/V2 from an empty schema, ending at version v2.
- API smoke checks:
  - `curl http://localhost:8080/api/health`
  - `curl http://localhost:8080/api/master-data/context`
  - `curl http://localhost:8080/api/master-data/companies/company-digital/budget-accounts`
  - `curl http://localhost:8080/v3/api-docs`
  - Result: health and master data returned seeded Xinghe context; OpenAPI contained all `/api/master-data/**` endpoints.
- Browser verification:
  - Started backend and frontend in tmux sessions `fox-procureflow-backend` and `fox-procureflow-frontend`.
  - Verified `http://127.0.0.1:5173/master-data` with Playwright/Chrome desktop and mobile viewports.
  - Result: page rendered `组织与主数据`, `星河控股集团`, `上海云舟信息技术有限公司`, `数字科技 IT 设备预算`, and `星河智能制造有限公司`.

### Environment Notes

- The first Testcontainers run failed while pulling `testcontainers/ryuk:0.12.0` because Docker Hub TLS handshakes timed out. After the image finished pulling, the same backend test command passed.
- Computer Use could not read the local Chrome/Safari window (`cgWindowNotFound`), so browser verification used Playwright with the installed Chrome channel instead.
