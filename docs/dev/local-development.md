# 本地开发

本文档说明 Fox Procureflow 骨架阶段的本地启动方式、默认端口、环境变量和验证路径。

## 工具要求

- Node.js `>=20.19`
- npm
- Java 21
- Docker
- Docker Compose 插件或 `docker-compose`

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
./scripts/launch.sh
```

`scripts/launch.sh` 是日常开发聚合启动入口。它会按顺序尝试：

1. 启动 `infra/docker-compose.yml` 中的 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO。
2. 启动 `backend/` 中的 Spring Boot 服务。
3. 启动 `frontend/` 中的 Vite 开发服务器。
4. 输出前端、健康接口和 Swagger UI 地址。

脚本会读取仓库根目录 `.env`，并把其中未被当前 shell 覆盖的变量传给 Docker Compose、后端和前端开发服务。

当前采购申请和审批流切片的运行硬依赖是 MySQL。MongoDB、Redis、RabbitMQ 和 MinIO 已在 Compose 中预留，用于后段动态上下文/AI 审计、缓存/看板、事件化三单匹配和真实附件上传；前中期业务切片不应因为这些服务未被业务代码使用而扩大实现范围。

如果本机缺少 Java 或 Docker Compose，脚本会给出下一步提示。也可以用下面的分步命令手动启动。

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
| Redis | `6379` | 后段缓存、待办数量和看板指标预留 |
| RabbitMQ | `5672` / `15672` | 后段事件总线和管理界面预留 |
| MinIO | `9000` / `9001` | 后段真实附件上传和对象存储控制台预留 |

## 数据边界约定

骨架阶段只落工程和演示上下文，不实现真实业务流程。

- 集团共享数据：供应商池、采购品类模板、集团级看板汇总。
- 公司隔离数据：采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果。

后续核心业务表必须预留公司隔离字段。后端默认使用 Spring Data JPA 访问 MySQL，但通过 repository/service 边界保留未来引入 MyBatis Plus、原生 SQL 或 read model 的空间。

## 验证命令

```bash
cd frontend
npm run build
```

```bash
cd backend
./gradlew test
```

当前骨架不包含 Prometheus、Grafana、Jaeger、Zipkin 或 Keycloak。
