# 骨架验证记录

更新时间：2026-05-18

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
  JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./gradlew test --no-daemon
  ```

- 后端本机启动通过，Flyway 已连接 MySQL 并执行 `V1__create_identity_placeholders.sql`，MongoDB 连接成功：

  ```bash
  cd backend
  JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./gradlew bootRun --no-daemon
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

## 当前环境未完成验证

- 无。
