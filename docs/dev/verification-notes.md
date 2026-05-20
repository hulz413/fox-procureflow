# MVP 交付验证记录

更新时间：2026-05-19

## improve-mvp-delivery 验证记录

- OpenSpec 严格校验通过：

  ```bash
  openspec validate "improve-mvp-delivery" --strict
  ```

- 本次工程化完善审计已覆盖 `README.md`、`docs/dev/local-development.md`、`docs/dev/verification-notes.md` 和 `scripts/launch.sh`。已将“骨架阶段”类遗留表述更新为完整 MVP 本地交付语境，并新增 [MVP 演示运行手册](mvp-demo-runbook.md)。

- `scripts/launch.sh` 安全模式可输出完整本地地址和 smoke check 提示：

  ```bash
  SKIP_INFRA=1 SKIP_BACKEND=1 SKIP_FRONTEND=1 ./scripts/launch.sh
  ```

  验证结果：输出前端、后端健康检查、Swagger UI、RabbitMQ Management、MinIO Console 和 `./scripts/smoke-check.sh`。

- 本地演示推荐使用后台启动，避免前台任务结束后页面打不开：

  ```bash
  ./scripts/launch.sh --detach
  ./scripts/stop-demo.sh
  ```

  后台日志记录在 `.local/logs/backend.log` 和 `.local/logs/frontend.log`，PID 文件记录在 `.local/pids/`。macOS 下 `--detach` 使用 `launchctl` 托管后端和前端，并显式传递当前可用的 `PATH` 与 `JAVA_HOME`，避免命令会话结束后页面不可达，或后台 job 找不到 Java/npm。

- `launch.sh --detach` 本地验证通过：

  ```bash
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="/opt/homebrew/bin:$(brew --prefix openjdk@21)/bin:$PATH" ./scripts/launch.sh --detach
  ./scripts/smoke-check.sh
  ```

  验证结果：`launchctl` job `com.foxprocureflow.backend` 和 `com.foxprocureflow.frontend` 正常运行，`8080` 与 `5173` 均监听，浏览器可打开 `http://localhost:5173/`，smoke check passed with no warnings。

- 脚本语法检查通过：

  ```bash
  bash -n scripts/launch.sh
  bash -n scripts/smoke-check.sh
  ```

- Docker Compose 配置语义解析通过：

  ```bash
  docker compose -f infra/docker-compose.yml config
  ```

- 后端完整测试通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --no-daemon
  ```

  验证结果：`BUILD SUCCESSFUL`，当前测试任务为 up-to-date。

- 前端 lint 通过；当前仍有 4 条既有 `react-hooks/exhaustive-deps` warning，无 error：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run lint
  ```

  备注：本次将测试需要导出的 `localizedContent` 和 `shouldConfirmReceiptInvoiceDrawerClose` 加入 `react-refresh/only-export-components` 允许名单，使 Fast Refresh 规则不再阻断 lint。

- 前端生产构建通过；Vite 仍提示主 chunk 大于 500 kB：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run build
  ```

- 前端测试通过：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm test
  ```

  验证结果：1 个测试文件、4 个用例通过。

- 本地 MVP 服务启动通过：

  ```bash
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="/opt/homebrew/bin:$(brew --prefix openjdk@21)/bin:$PATH" ./scripts/launch.sh
  ```

  验证结果：Docker Compose 基础设施已启动；后端连接 MySQL 并确认 Flyway schema version 21；MongoDB 连接成功；前端 Vite 服务监听 `5173`；`launch.sh` 输出本地关键 URL 和 smoke check 命令。

- MVP read-only smoke check 通过且无 warning：

  ```bash
  ./scripts/smoke-check.sh
  ```

  已验证范围：
  - Docker Compose 配置解析。
  - MySQL `3306` 作为核心数据存储可达。
  - MongoDB `27017` 作为 AI 审计存储可达。
  - MinIO `9000` 作为附件对象存储 API 可达。
  - RabbitMQ `5672` 作为预留 broker 可达，但不是 smoke 的硬业务依赖。
  - 后端健康接口、OpenAPI JSON、Swagger UI 和前端工作台均返回 200。
  - 只读 API 覆盖主数据、集团共享供应商池、集团看板、星河数字科技有限公司采购申请/审批/RFQ/PO/履约摘要、星河智能制造有限公司三单匹配异常和 RFQ 附件元数据。
  - smoke check 未执行创建、审批、取消、收货、开票、处理异常或删除操作。

- 前端工作台路由可达性通过：

  ```bash
  for route in / /suppliers /purchase-requests /approvals /rfqs /purchase-orders /receipts-invoices /three-way-matching /master-data; do
    curl -fsS -o /dev/null -w '%{http_code}' "http://localhost:5173${route}"
  done
  ```

  验证结果：全部返回 `200`。

- 浏览器人工 spot check 通过：
  - `http://localhost:5173/`：采购看板展示星河控股集团、星河数字科技有限公司、星河智能制造有限公司 scope，后端状态为 `UP`，集团汇总展示采购金额、待审批、RFQ、PO、收货/发票和三单匹配异常。
  - `http://localhost:5173/suppliers`：供应商池展示集团共享边界、当前公司语境和 15 条真实后端供应商数据。

- MVP runbook 入口覆盖记录：
  - 采购看板：集团汇总、`company-digital`、`company-manufacturing`。
  - 供应商池：集团共享供应商池，当前公司语境为星河数字科技有限公司。
  - 采购申请：`company-digital` 只读列表 API。
  - 审批中心：`company-digital` + `user-digital-approver` 待办 API。
  - 询报价：`company-digital` RFQ 列表 API。
  - 采购订单：`company-digital` PO 列表 API。
  - 收货发票：`company-digital` 履约摘要 API。
  - 三单匹配：`company-manufacturing` 异常队列 API。
  - 附件：`company-digital` + `RFQ-20260518-0301` + `supplier-yunzhou` 附件元数据 API。
  - AI：未启用真实 provider key；本次验证覆盖默认禁用态文档、MongoDB 审计依赖和 OpenAPI endpoint 存在性。

环境备注：

- Java 使用 Homebrew `openjdk@21`，本次后端启动输出 Java `21.0.11`。
- 前端构建使用 `/opt/homebrew/bin` 下的 Node.js，满足 Vite 8 要求。
- 仍保留 4 条既有 `react-hooks/exhaustive-deps` warning 和 Vite 主 chunk 大小 warning；均不阻断当前 MVP 交付验证。
- 本次未使用真实 `OPENAI_COMPATIBLE_API_KEY` 调用 DeepSeek/OpenAI-compatible provider；真实 AI 调用仍需演示环境提供 key。

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

## implement-ai-procurement-assistant 验证记录

- OpenSpec 严格校验通过：

  ```bash
  openspec validate "implement-ai-procurement-assistant" --strict
  ```

- AI 助手后端专项测试通过，覆盖 OpenAI-compatible provider adapter 映射、结构化输出校验、上下文脱敏、审计不可用、provider 不可用、跨公司拒绝、无业务状态变更和四类 AI 场景：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --tests 'com.foxprocureflow.ai.*' --no-daemon
  ```

- 后端完整测试通过：

  ```bash
  cd backend
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --no-daemon
  ```

- 前端 lint 通过；当前仍有 4 条既有 `react-hooks/exhaustive-deps` warning，无 error：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run lint
  ```

- 前端生产构建通过；Vite 仍提示主 chunk 大于 500 kB：

  ```bash
  cd frontend
  PATH="/opt/homebrew/bin:$PATH" npm run build
  ```

- 本地服务启动与 smoke check 通过：

  ```bash
  JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="/opt/homebrew/bin:$(brew --prefix openjdk@21)/bin:$PATH" ./scripts/launch.sh
  curl http://localhost:8080/api/health
  curl -I http://localhost:5173/
  curl http://localhost:8080/v3/api-docs
  ```

  验证结果：后端健康接口返回 `status: "UP"`，前端首页返回 `200 OK`，OpenAPI JSON 包含四个 `/api/ai-assistant/*` endpoint。

- 运行环境备注：
  - `OPENAI_COMPATIBLE_ENABLED` 默认 `false`，本次自动化验证未使用真实 provider key。
  - 生产/演示启用 AI 时必须提供 `OPENAI_COMPATIBLE_API_KEY`，并保持 MongoDB 可用以写入 AI 调用审计。
  - AI 助手不提供前端静态 mock；provider、审计或结构化输出异常会返回真实不可用/失败状态。

## 当前环境未完成验证 / 残余风险

- 未执行真实 AI provider 调用；原因是本地 `.env.example` 默认 `OPENAI_COMPATIBLE_ENABLED=false` 且没有记录真实 API key。残余风险：正式演示启用 AI 时仍需单独验证 provider key、base URL、model 和 MongoDB 审计链路。
- 前端仍有 4 条既有 hook dependency warning；当前未扩展范围做 UI 状态 refactor。残余风险：相关视图未来改动时应优先用 `useMemo` 收敛依赖。
- Vite 仍提示主 chunk 大于 500 kB；当前未扩展范围做代码拆分。残余风险：生产化部署前应评估按工作台路由拆包。
