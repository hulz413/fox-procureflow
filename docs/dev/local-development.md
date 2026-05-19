# 本地开发

本文档说明 Fox Procureflow 完整 MVP 的本地启动方式、默认端口、环境变量和验证路径。演示叙事和人工检查路径见 [MVP 演示运行手册](mvp-demo-runbook.md)。

## 工具要求

- Node.js `>=20.19`
- npm
- Java 21
- Docker
- Docker Compose 插件或 `docker-compose`

当前前端依赖 Vite 8 / Vitest 4，本机默认 Node.js 若仍是 `20.11.x`，启动时会报 `node:util` 缺少 `styleText`，前端服务不会监听 `5173`，页面也就打不开。用 `nvm use 22`、Volta、Homebrew 或其他方式切到 Node.js `>=20.19` / `>=22.12` 后再执行前端命令。

如果 Java 21 通过 Homebrew 安装，推荐使用 `openjdk@21`：

```bash
brew install openjdk@21
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix openjdk@21)/bin:$PATH"
java -version
```

若 `./gradlew` 报 `JAVA_HOME is set to an invalid directory` 或 macOS 的 `/usr/bin/java` 提示找不到 Java Runtime，先在当前 shell 中设置上面的 `JAVA_HOME` 和 `PATH`。

## 最短路径

```bash
cp .env.example .env
./scripts/launch.sh --detach
```

`scripts/launch.sh --detach` 是推荐的本地演示启动入口。它会按顺序尝试：

1. 启动 `infra/docker-compose.yml` 中的 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO。
2. 启动 `backend/` 中的 Spring Boot 服务。
3. 启动 `frontend/` 中的 Vite 开发服务器。
4. 在后台启动后端和前端，日志写入 `.local/logs/`。
5. 输出前端、健康接口、Swagger UI、RabbitMQ Management、MinIO Console、smoke check 和停止命令。

脚本会读取仓库根目录 `.env`，并把其中未被当前 shell 覆盖的变量传给 Docker Compose、后端和前端开发服务。

如果需要在当前终端前台查看后端和前端日志，可以不带 `--detach`：

```bash
./scripts/launch.sh
```

前台模式会在命令结束时清理本次启动的后端/前端进程；演示和日常使用优先用 `--detach`，避免关闭终端或结束任务后页面打不开。

停止后台演示服务：

```bash
./scripts/stop-demo.sh
```

如果需要同时停止 Docker 基础设施：

```bash
STOP_INFRA=1 ./scripts/stop-demo.sh
```

当前核心采购闭环的运行硬依赖是 MySQL。MongoDB 用于 AI 调用审计，MinIO 用于 RFQ 报价单、收货凭证和供应商发票文件上传/下载。Redis 和 RabbitMQ 仍不是当前 MVP 演示的硬依赖，不应因为工程化验证而扩大业务实现范围。

如果本机缺少 Java、Node.js、npm、Docker 或 Docker Compose，脚本会给出下一步提示，并提醒当前环境不能视为 demo-ready。服务启动完成后运行只读 smoke check：

```bash
./scripts/smoke-check.sh
```

也可以用下面的分步命令手动启动。

## AI 采购助手配置

AI 采购助手使用 OpenAI-compatible Chat Completions API，不提供生产路径 mock 内容。默认 `.env.example` 中 `OPENAI_COMPATIBLE_ENABLED=false`，因此未配置 API key 时，前端会显示 AI 不可用，但采购申请、审批、RFQ、PO、收货发票、三单匹配和看板仍可正常演示。当前默认供应商是 DeepSeek，体现在 `OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com` 和 `OPENAI_COMPATIBLE_MODEL=deepseek-v4-flash`。

启用 AI 前需要本机 Compose 中的 MongoDB 可用，因为 AI 调用会先写入审计记录；如果 MongoDB 不可用，后端会在调用模型供应商前返回不可用错误，避免出现未审计的模型调用。

```bash
OPENAI_COMPATIBLE_ENABLED=true
OPENAI_COMPATIBLE_API_KEY=your_key_here
OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
OPENAI_COMPATIBLE_MODEL=deepseek-v4-flash
OPENAI_COMPATIBLE_TIMEOUT=30s
```

四个演示入口：

- 在“采购申请”新建抽屉中输入自然语言需求，生成可编辑采购草稿，确认后仍通过正式采购申请保存接口落为 `DRAFT`。
- 在采购申请详情或审批详情中触发风险提示，AI 只给建议，不改变提交或审批状态。
- 在 RFQ 详情中对至少两家有效报价触发报价解释，AI 不改变确定性推荐排序，也不创建 PO。
- 在“三单匹配”异常详情中触发异常解释，AI 不追加处理记录，也不改变匹配状态。

## 分步启动

### 基础设施

```bash
cd infra
docker compose up -d
```

如果本机只有旧版 Compose：

```bash
cd infra
docker-compose up -d
```

检查 Compose 配置是否可解析：

```bash
docker compose -f infra/docker-compose.yml config
```

查看服务状态：

```bash
cd infra
docker compose ps
```

停止本地基础设施：

```bash
cd infra
docker compose down
```

检查常用端口占用：

```bash
lsof -nP -iTCP:3306,27017,6379,5672,15672,9000,9001 -sTCP:LISTEN
```

### 后端

```bash
cd backend
./gradlew bootRun
```

健康接口：

```bash
curl http://localhost:8080/api/health
```

Swagger UI：

```text
http://localhost:8080/swagger-ui.html
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端工作台：

```text
http://localhost:5173
```

## 默认端口

| 服务 | 端口 | 说明 |
|---|---:|---|
| Frontend | `5173` | Vite dev server |
| Backend | `8080` | Spring Boot API |
| MySQL | `3306` | 核心交易和组织数据 |
| MongoDB | `27017` | 后段动态表单、AI 审计和富上下文快照预留 |
| Redis | `6379` | 缓存、待办数量和看板指标后续增强，不是当前演示硬依赖 |
| RabbitMQ | `5672` / `15672` | 事件总线和管理界面后续增强，不是当前演示硬依赖 |
| MinIO | `9000` / `9001` | RFQ 报价单、收货凭证和供应商发票真实附件上传/下载 |

## 数据边界约定

当前 MVP 已具备真实采购业务闭环，本地开发和演示必须保持集团共享数据与公司级交易数据的边界。

- 集团共享数据：供应商池、采购品类模板、集团级看板汇总。
- 公司隔离数据：采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果。

后端默认使用 Spring Data JPA 访问 MySQL，并通过 repository/service 边界保留未来引入 MyBatis Plus、原生 SQL 或 read model 的空间。

## 验证命令

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
./gradlew test
```

```bash
./scripts/smoke-check.sh
```

当前 MVP 不包含 Prometheus、Grafana、Jaeger、Zipkin 或 Keycloak。
