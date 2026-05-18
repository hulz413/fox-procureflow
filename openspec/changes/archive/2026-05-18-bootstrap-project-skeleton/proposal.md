## Why

Fox Procureflow 需要先建立一个可运行、可演示、风格一致的工程底座，后续 P0 业务切片才能在同一套前端应用壳、后端 API 约定、本地基础设施和视觉基线之上逐步实现。

本 change 是 MVP 的起步垂直切片：演示人员和开发者可以在本机启动基础设施、后端和前端，看到面向集团内部多公司采购协同的工作台外壳，并验证前后端健康联通。

## What Changes

- 新增项目骨架目录，包含本机运行的 React + TypeScript + Vite 前端、Java 21 + Spring Boot 后端，以及 Docker Compose 本地基础设施。
- 新增前端应用壳，呈现固定左侧导航、顶部公司上下文、采购工作台入口和最终选定的「F 库采 SaaS」视觉基线。
- 新增基础后端服务，提供健康检查接口、Swagger UI 入口和后续 REST API 的包结构约定。
- 新增本地基础设施编排，覆盖 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO，服务名和端口适合后续 P0 业务切片复用。
- 新增开发启动说明，描述 Docker 基础设施、本机后端、本机前端的最短启动路径。
- 预留集团、多公司和共享供应商池的演示数据落点，但不在本 change 中实现完整业务数据模型。
- 非目标：不实现登录认证的完整 JWT 流程、不实现采购申请/审批/RFQ/PO/收货/发票/三单匹配业务流程、不接入 DeepSeek API、不加入 Prometheus、Grafana、Jaeger/Zipkin 或 Keycloak。
- 验收标准：开发者可以启动 Docker 基础设施、启动后端、访问健康接口和 Swagger UI、启动前端、看到 Fox Procureflow 工作台外壳，并从前端验证后端健康联通。

## Capabilities

### New Capabilities

- `project-skeleton`: 定义 Fox Procureflow MVP 工程骨架、本地运行底座、前后端健康联通和「F 库采 SaaS」视觉基线。

### Modified Capabilities

- 无。

## Impact

- 影响代码结构：新增 `frontend/`、`backend/`、`infra/` 和开发文档目录。
- 影响前端依赖：引入 React、TypeScript、Vite、Ant Design、React Router、TanStack Query、Zustand、React Hook Form、Zod 和 ECharts 的骨架依赖。
- 影响后端依赖：引入 Java 21、Spring Boot、Spring Web、Spring Validation、Spring Security、Spring Data JPA、Spring Data MongoDB、Flyway、Spring AMQP、MapStruct、springdoc-openapi 和测试依赖。
- 影响本地环境：需要 Docker Compose 运行 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO；前端和后端仍在本机进程中运行。
- 影响后续业务切片：后续基础组织与演示数据、采购申请、审批流、RFQ、PO、收货、发票和三单匹配都应复用本 change 建立的应用壳、API 基线、公司上下文和本地基础设施。
