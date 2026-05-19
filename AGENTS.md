# AGENTS.md

## 文档查询

当用户询问库、框架、SDK、API、CLI 工具或云服务时，使用 Context7 MCP 获取当前文档。这包括 API 语法、配置、版本迁移、库特定调试、安装说明和 CLI 用法。

不要将 Context7 用于重构、从零编写脚本、调试业务逻辑、代码审查或一般编程概念说明。

## 仓库约定

- 面向人的非结构化项目文档默认使用中文。技术标识、路径、环境变量、服务名、代码级命名和第三方产品名保持原文。
- 创建 commit 时使用 Conventional Commits。
- 产品上下文、MVP 边界、roadmap 顺序和 OpenSpec artifact 规则以 `openspec/config.yaml` 和 `docs/mvp/roadmap.md` 为准。

## 本地开发

- Docker 运行数据库、中间件和对象存储；React 前端和 Java 后端在宿主机运行。
- 在默认本地端口启动服务前，先检查并停止旧的 `8080` 后端进程和 `5173` 前端进程，再启动当前代码。

## 前端实现约束

- 不要用前端静态 mock 数据掩盖空列表。优先使用 Flyway seed 数据、后端 API 或真实业务流程。
- 采购执行类列表页应提供足够真实的演示数据，通常至少 3 条来自后端的数据，并覆盖不同状态。
- 详情页或抽屉里的禁用按钮应提供 tooltip，说明具体禁用原因。
- 详情页或抽屉存在未保存的可编辑输入时，关闭、切换选中行或离开当前编辑对象前应弹出确认。

## 范围约束

- 不要引入 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger/Zipkin、Keycloak 或 AI 依赖，除非 roadmap 或当前 OpenSpec change 明确要求。
- AI 能力属于 MVP roadmap 后段；实现时应使用真实 DeepSeek API，mock AI 不应作为最终行为。
