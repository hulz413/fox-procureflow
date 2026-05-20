# AGENTS.md

## 文档与规范

- 用户询问库、框架、SDK、API、CLI 工具或云服务时，使用 Context7 MCP 获取当前文档；不要用于重构、业务逻辑调试、代码审查或一般编程概念。
- 面向人的非结构化项目文档默认使用中文；技术标识、路径、环境变量、服务名、代码命名和第三方产品名保持原文。
- 创建 commit 时使用 Conventional Commits。
- 产品上下文、MVP 边界、roadmap 顺序和 OpenSpec artifact 规则以 `openspec/config.yaml` 和 `docs/mvp/roadmap.md` 为准。

## 本地开发

- Docker 运行数据库、中间件和对象存储；React 前端和 Java 后端在宿主机运行。
- 前端需 Node.js `>=20.19` 或 `>=22.12`；本机默认 Node 不满足时先切版本再运行 Vite/Vitest。
- Java 21 来自 Homebrew `openjdk@21`；必要时使用 `JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"`，并把 `$(brew --prefix openjdk@21)/bin` 放到 `PATH` 前面。
- 启动默认端口服务前，先清理旧的 `8080` 后端和 `5173` 前端 listener。

## 服务收尾

- 需要用户继续试用页面时，收尾前必须确保 demo 服务可用：运行 `./scripts/launch.sh --detach`，再运行 `./scripts/smoke-check.sh`。
- 不要把当前终端会话里的 `./gradlew bootRun` 或 `npm run dev` 当成交付后的稳定服务；这类临时进程容易随工具会话结束而消失。
- 如果用户只要求代码修改且不需要保持服务运行，在最终回复中明确说明服务未启动或已停止。

## 前端实现约束

- 不用前端静态 mock 数据掩盖空列表；优先使用 Flyway seed、后端 API 或真实业务流程。
- 采购执行类列表页通常至少展示 3 条后端演示数据，并覆盖不同状态。
- 详情页或抽屉里的禁用按钮必须提供具体原因 tooltip。
- 可编辑输入有未保存内容时，关闭、切换选中行或离开当前编辑对象前必须确认。

## 范围约束

- 不要引入 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger/Zipkin、Keycloak 或 AI 依赖，除非 roadmap 或当前 OpenSpec change 明确要求。
- AI 能力属于 MVP roadmap 后段；实现时应使用真实 DeepSeek API，mock AI 不应作为最终行为。
