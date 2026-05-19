# 骨架验证记录

更新时间：2026-05-19

## 已验证

- 前端生产构建通过：

  ```bash
  PATH="/opt/homebrew/bin:$PATH" npm run build
  ```

- 前端 lint 通过：

  ```bash
  PATH="/opt/homebrew/bin:$PATH" npm run lint
  ```

- `scripts/launch.sh` 的安全模式可输出本地关键 URL：

  ```bash
  SKIP_INFRA=1 SKIP_BACKEND=1 SKIP_FRONTEND=1 ./scripts/launch.sh
  ```

- `infra/docker-compose.yml` 通过 YAML 语法解析：

  ```bash
  ruby -e "require 'yaml'; YAML.load_file('infra/docker-compose.yml'); puts 'infra/docker-compose.yml YAML ok'"
  ```

- Docker Compose 配置语义解析通过：

  ```bash
  docker compose -f infra/docker-compose.yml config
  ```

- Docker Compose 基础设施启动通过，MySQL、MongoDB、Redis、RabbitMQ 均达到 healthy 状态，MinIO 正常运行：

  ```bash
  docker compose -f infra/docker-compose.yml up -d --quiet-pull
  docker compose -f infra/docker-compose.yml ps
  ```

- 后端测试通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --no-daemon
  ```

- 后端本机启动通过，Flyway 已连接 MySQL 并执行 `V1__create_identity_placeholders.sql`，MongoDB 连接成功：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew bootRun --no-daemon
  ```

- 健康接口返回 200，并返回 `status: "UP"`、`application: "Fox Procureflow"`、星河控股集团和默认公司上下文：

  ```bash
  curl http://localhost:8080/api/health
  ```

- Swagger UI 与 OpenAPI JSON 验证通过：

  ```bash
  curl http://localhost:8080/swagger-ui/index.html
  curl http://localhost:8080/v3/api-docs
  ```

- 前端已通过浏览器打开 `http://127.0.0.1:5173/` 进行视觉检查，页面展示最终 F「库采 SaaS」风格、星河控股集团语境、星河数字科技有限公司公司上下文、采购工作台内容和后端连接状态。

## implement-procurement-dashboard 验证记录

- 后端 dashboard 集成测试通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --tests com.foxprocureflow.dashboard.ProcurementDashboardIntegrationTest
  ```

- 后端完整测试通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test
  ```

- 前端生产构建通过；当前 shell 若落到旧 Node `20.11.0`，需要把 Homebrew Node 放到 PATH 前面：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run build
  ```

- 本地浏览器验证通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew bootRun

  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run dev -- --host 127.0.0.1
  ```

  验证 URL：`http://127.0.0.1:5173/`

  已验证范围：
  - 集团汇总：显示采购看板、集团/公司 scope 切换、已发布 PO 金额、待审批、进行中 RFQ、已发布 PO、收货/发票待补齐和三单匹配异常。
  - `company-digital`：看板切换后只显示星河数字科技有限公司指标，三单匹配异常摘要显示真实空状态。
  - `company-manufacturing`：看板切换后只显示星河智能制造有限公司指标，异常摘要展示 `PO-20260518-0201` 和 `PO-20260518-0202`，点击“查看三单匹配”可跳转到 `/three-way-matching`。

  环境备注：
  - Java 使用 Homebrew `openjdk@21`，`JAVA_HOME` 必须指向 `libexec/openjdk.jdk/Contents/Home`。
  - 前端构建需要 Node `>=20.19`；本机 `/opt/homebrew/bin/node` 为 `v25.9.0`，满足 Vite 要求。

## 当前环境未完成验证

- 无。
