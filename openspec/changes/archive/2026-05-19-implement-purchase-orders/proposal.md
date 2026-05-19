## Why

Fox Procureflow 已经完成采购申请、审批和 RFQ 询报价，但采购执行链路仍停在报价对比阶段，采购员无法把选定报价转化为可发布、可交付、可供后续收货和发票使用的采购订单。

本 change 衔接 roadmap 中的 P0「PO 采购订单」切片，让集团内部多公司采购闭环从“询价比较”推进到“正式订单执行”，并为下一步收货、发票和三单匹配建立稳定上游单据。

## What Changes

- 新增 PO 采购订单能力：采购员可以基于 `COMPARISON_READY` RFQ 中的有效报价创建公司级采购订单。
- PO 创建时快照 RFQ、源采购申请、审批结果、选定供应商、报价、税率、金额和明细行，保证后续审计不依赖上游记录变化。
- 支持 PO 草稿、发布和状态查询，覆盖 `DRAFT`、`ISSUED`、`CANCELLED` 等 MVP 所需状态流转。
- 支持交付计划记录，包括计划交付日期、交付地点、联系人和备注，为后续收货切片提供业务入口。
- 新增公司隔离的 PO REST API、Swagger 文档和前端“采购订单”工作台页面。
- 明确保留 P0 边界：不创建收货单、发票、三单匹配、RabbitMQ 事件、真实附件上传或 AI 决策。

## Capabilities

### New Capabilities

- `purchase-orders`: 定义从 RFQ 选定报价创建、发布、查询和管理公司级采购订单的 MVP 能力。

### Modified Capabilities

无。PO 将读取 RFQ、采购申请和审批结果作为上游输入，但不改变现有 capability 的需求契约。

## Impact

- 后端新增 PO 相关 MySQL 表、Flyway migration、JPA entity、repository、service、controller、DTO、状态枚举和 Swagger/OpenAPI 描述。
- 后端需要读取 RFQ、报价、采购申请和审批数据，并在服务层继续校验 `companyId`、采购员、供应商和上游单据归属。
- 前端新增 `/purchase-orders` 路由、侧边栏“采购订单”入口、PO 列表、详情、创建抽屉和发布动作，沿用现有 Ant Design 工作台风格。
- 测试覆盖 PO 创建资格、重复创建拒绝、跨公司拒绝、金额税率快照、发布状态流转、Swagger 文档和前端构建。
- 运行时继续使用 MySQL 和同步服务调用；不新增 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek 依赖。
