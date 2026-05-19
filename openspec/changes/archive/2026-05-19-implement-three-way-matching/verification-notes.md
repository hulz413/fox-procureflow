## Verification Notes

验证日期：2026-05-19

## Commands

- 后端完整测试：

```bash
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" ./gradlew test
```

结果：通过，`BUILD SUCCESSFUL in 1m 14s`，共 41 个测试。

- 前端生产构建：

```bash
cd frontend
PATH="/Users/hulz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build
```

结果：通过。Vite 仍提示 bundle chunk 大于 500 kB，这是现有单入口构建体积提醒，不影响本 change 功能。

## Demo Records

- 星河数字科技有限公司：
  - `TWM-20260519-0001` / `PO-20260518-0301`：`PENDING_INPUT`，用于待补齐输入演示。
  - `TWM-20260519-0002` / `PO-20260518-0302`：`INVOICE_AMOUNT_MISMATCH`，发票金额比 PO 高 `¥2,300`。
  - `TWM-20260519-0003` / `PO-20260518-0303`：`MATCHED`，收货、发票、PO 一致。
- 星河智能制造有限公司：
  - `TWM-20260519-0004` / `PO-20260518-0201`：`MISSING_RECEIPT`。
  - `TWM-20260519-0005` / `PO-20260518-0202`：`INVOICE_QUANTITY_OVER_RECEIPT`。

## Browser Verification

- URL: `http://127.0.0.1:5173/three-way-matching`
- 启动方式：
  - 后端：`FOX_BACKEND_PORT=8080 ./gradlew bootRun --no-daemon`
  - 前端：`npm run dev -- --host 0.0.0.0 --port 5173`
- 验证结果：
  - 页面显示星河数字科技有限公司的后端匹配数据，初始包含 1 条 `MATCHED`、1 条 `PENDING_INPUT`、1 条 `EXCEPTION`。
  - 打开 `PO-20260518-0302` 详情，确认差异项为“金额不一致”，金额差异 `¥2,300`。
  - 填写备注“浏览器验证：金额差异已由财务确认并关闭。”并执行“关闭异常”。
  - 列表状态刷新为“已关闭”，详情展示处理记录“陈思雨 · 2026/05/19 13:07”，异常队列计数降为 0，已关闭计数升为 1。

## Environment Caveats

- 本机默认 Node.js 为 `v20.11.0`，当前 Vite 版本需要 Node.js `>=20.19`；本次构建和本地前端启动使用 Codex bundled Node。
- 本机 Docker 中 Redis、RabbitMQ、MinIO 容器在验证前已经处于运行状态，未由本次验证启动或停止。后端启动日志只显示 MySQL 和 MongoDB 连接；matching workflow 使用 MySQL 与同步服务调用，不依赖 Redis、RabbitMQ、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek。
- 本地浏览器验证会改变持久化 MySQL 中 `TWM-20260519-0002` 的状态并追加处理记录；全新 Flyway seed 仍会创建该记录为 `EXCEPTION`。
- In-app browser 的 screenshot capture 在本机验证时超时；本次以前端 DOM 快照和真实点击/填写/提交结果作为浏览器验证依据。
