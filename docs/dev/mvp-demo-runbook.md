# MVP 演示运行手册

本文档面向开发者和演示人员，说明如何在本机启动并验证 Fox Procureflow 的完整 MVP 演示。演示叙事从星河控股集团出发，覆盖两家公司主体、集团共享供应商池，以及采购申请到三单匹配的公司级业务闭环。

## 演示上下文

| 层级 | 演示对象 | 演示边界 |
|---|---|---|
| 集团 | 星河控股集团 | 查看集团采购看板汇总，维护集团共享供应商池语境 |
| 公司 | 星河数字科技有限公司 | 覆盖 IT 设备、软件订阅、办公采购、RFQ、PO、收货、发票、附件和 AI 建议 |
| 公司 | 星河智能制造有限公司 | 覆盖生产备件、物流服务、公司级采购交易和三单匹配异常 |
| 共享数据 | 供应商池、采购品类 | 两家公司可查看同一集团供应商池 |
| 公司数据 | 采购申请、审批、RFQ、PO、收货、发票、三单匹配 | 按 `companyId` 隔离，不能在两家公司之间混用交易数据 |

## 本机准备

首次运行：

```bash
cp .env.example .env
```

确认本机满足：

- Node.js `>=20.19` 或 `>=22.12`
- npm
- Java 21 或更高版本
- Docker
- Docker Compose 插件，或 `docker-compose`

Homebrew Java 21 推荐配置：

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix openjdk@21)/bin:$PATH"
```

## 启动和验证

一键启动本地基础设施、后端和前端：

```bash
./scripts/launch.sh --detach
```

`launch.sh --detach` 会先处理常见的 `8080` 后端端口和 `5173` 前端端口旧 listener，再把当前仓库的后端和前端放到后台运行。日志位于 `.local/logs/backend.log` 和 `.local/logs/frontend.log`。服务启动后运行只读 smoke check：

```bash
./scripts/smoke-check.sh
```

Smoke check 只执行 GET/HEAD 风格的可达性和只读 API 检查，不会创建、审批、取消、收货、开票、处理三单匹配或删除业务数据。

演示结束后停止后台前后端：

```bash
./scripts/stop-demo.sh
```

常用地址：

| 服务 | 地址 |
|---|---|
| 前端工作台 | `http://localhost:5173` |
| 后端健康检查 | `http://localhost:8080/api/health` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| RabbitMQ Management | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |

## 演示路径

### 1. 采购看板

打开 `http://localhost:5173/`。先展示集团汇总视角，再切换到 `company-digital` 和 `company-manufacturing`，说明集团看板是汇总，公司看板只显示本公司采购交易、待办和三单匹配异常。

### 2. 供应商池

进入“供应商池”。展示上海云舟信息技术有限公司、深圳蓝芯电子科技有限公司、苏州恒润工业设备有限公司、杭州诚采办公用品有限公司和宁波安捷物流有限公司。强调供应商池是集团共享数据，不属于某一家公司的交易单据。

### 3. 采购申请

进入“采购申请”。使用星河数字科技有限公司的采购申请列表展示草稿、已提交和审批关联摘要。创建或提交新申请属于会写入 MySQL 的正式业务操作，演示前确认是否需要保留数据。

### 4. 审批中心

进入“审批中心”。查看 `user-digital-approver` 或星河智能制造对应审批人的待办与详情抽屉。审批通过、驳回和撤回都会改变审批实例和申请状态，正式演示中按需要操作。

### 5. 询报价

进入“询报价”。展示已审批申请生成的 RFQ、受邀供应商、报价录入、报价对比和确定性推荐排序。报价附件中既有真实 MinIO 文件，也可能存在历史 metadata-only 附件，下载按钮会按后端返回状态展示可用或禁用原因。

### 6. 采购订单

进入“采购订单”。展示从中标报价生成的 PO，以及草稿、已发布、已取消等状态。发布或取消会写入状态记录；详情抽屉中的禁用按钮应显示具体原因。

### 7. 收货发票

进入“收货发票”。展示已发布 PO 的履约摘要、收货登记、供应商发票登记、收货凭证和发票文件上传。真实附件上传依赖 MinIO，文件元数据和业务关联写入 MySQL。

### 8. 三单匹配

进入“三单匹配”。展示公司级 PO、累计收货和供应商发票的匹配结果。星河智能制造有限公司包含可演示的异常队列；处理异常会追加处理记录并改变匹配处理语境。

### 9. AI 采购助手

AI 入口分布在采购申请、审批/RFQ/三单匹配相关详情中。默认 `.env.example` 设置 `OPENAI_COMPATIBLE_ENABLED=false`，因此未配置 API key 时前端会显示 AI 不可用，但核心采购闭环仍可演示。

启用真实 AI 调用需要：

```bash
OPENAI_COMPATIBLE_ENABLED=true
OPENAI_COMPATIBLE_API_KEY=your_key_here
OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
OPENAI_COMPATIBLE_MODEL=deepseek-v4-flash
```

MongoDB 必须可用，因为 AI 调用会先写入审计记录。AI 输出只提供建议、解释和置信度，不直接替代业务校验、审批或落库状态流转。

## 验证清单

自动验证：

```bash
cd backend
JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --no-daemon
```

```bash
cd frontend
PATH="/opt/homebrew/bin:$PATH" npm run lint
PATH="/opt/homebrew/bin:$PATH" npm run build
```

```bash
docker compose -f infra/docker-compose.yml config
curl http://localhost:8080/api/health
curl http://localhost:8080/v3/api-docs
curl -I http://localhost:5173/
./scripts/smoke-check.sh
```

人工演示检查：

- 采购看板：集团、星河数字科技有限公司、星河智能制造有限公司视角。
- 供应商池：集团共享供应商详情和筛选。
- 采购申请：公司级列表、详情、新建抽屉。
- 审批中心：待办、详情、时间线和操作原因。
- 询报价：RFQ 列表、报价对比、附件状态。
- 采购订单：状态记录、发布/取消禁用原因、交付计划。
- 收货发票：履约摘要、收货、发票和附件。
- 三单匹配：异常队列、差异项和处理记录。
- AI：未启用 key 时不可用提示；启用真实 provider 时审计和建议结果。

## 常见恢复

- 前端打不开：确认 Node.js 版本满足 Vite 要求，并检查 `5173` 是否被旧进程占用。
- 后端无法启动：确认 Java 21、MySQL 和 `.env` 中的 `FOX_MYSQL_*` 配置。
- Swagger 或 OpenAPI 不可达：先检查 `http://localhost:8080/api/health`。
- AI 不可用：确认 `OPENAI_COMPATIBLE_ENABLED`、API key、base URL、model 和 MongoDB。
- 附件不可下载：确认 MinIO `9000`、`9001` 可达，并检查对应附件是否是 metadata-only 历史记录。
- 数据看起来不对：确认当前服务来自本仓库当前代码，必要时停止旧的 `8080`/`5173` listener 后重新运行 `./scripts/launch.sh`。
