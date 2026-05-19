## Why

Fox Procureflow 已经完成从采购申请到三单匹配的 P0 采购闭环，但管理者还缺少一个能快速理解集团和公司采购运行状态的聚合入口。现在补齐采购看板，可以把已有申请、审批、RFQ、PO、收货、发票和三单匹配数据转化为可演示的经营视角，支撑集团内部多公司采购协同场景。

## What Changes

- 新增 P1 采购看板能力，提供集团总览和公司筛选视角，聚合采购金额、单据状态、待审批、RFQ、PO、收货、发票和三单匹配异常等核心指标。
- 新增后端看板聚合 API，基于 MySQL 中已有业务数据实时汇总，不引入 Redis 指标缓存。
- 新增采购金额趋势、单据漏斗、异常匹配概览、供应商分布或排行等管理型图表数据，帮助管理者从闭环数据中看到进度、风险和供应商结构。
- 新增前端“采购看板”页面，沿用现有 React/Ant Design 工作台风格，使用后端 API 数据，不使用前端静态 mock 掩盖空列表。
- 准备或复用足够真实的后端 demo 数据，保证两家公司下至少能展示采购金额、状态分布和异常匹配等差异化指标。
- 非目标：不做采购员任务工作台、不新增审批或单据处理动作、不实现 Redis 缓存、AI 自然语言经营摘要、真实附件上传、RabbitMQ 事件化、JWT 登录或复杂权限矩阵。

## Capabilities

### New Capabilities

- `procurement-dashboard`: 定义集团和公司视角的采购管理看板、指标聚合 API、趋势与分布数据、公司隔离规则和前端看板验收行为。

### Modified Capabilities

- 无。

## Impact

- Backend: 新增 dashboard 聚合 service、controller、DTO 和 Swagger/OpenAPI 描述，读取申请、审批、RFQ、PO、收货、发票和三单匹配现有数据。
- Frontend: 新增 `/dashboard` 或 `/procurement-dashboard` 路由、导航入口、指标卡、图表区、公司筛选和异常概览，使用 ECharts 呈现趋势和分布。
- Data: 复用既有 Flyway seed 数据，必要时补充少量演示数据以覆盖两家公司不同状态、金额趋势、供应商分布和匹配异常。
- Testing: 覆盖集团/公司筛选、跨公司隔离、空状态、聚合计算、Swagger 文档和前端构建。
- Dependencies and infrastructure: 继续使用 MySQL 和同步查询聚合；不新增 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek 依赖。

## Acceptance Criteria

- 管理者可以在采购看板查看集团汇总，也可以切换到星河数字科技有限公司或星河智能制造有限公司查看公司级指标。
- 公司级看板只聚合该公司的采购申请、审批、RFQ、PO、收货、发票和三单匹配数据，不泄露另一家公司业务数据。
- 看板至少展示采购金额趋势、待审批数量、采购执行状态分布、三单匹配异常数量和供应商采购/报价分布中的核心指标。
- 前端看板全部从后端 API 加载数据，刷新后能稳定展示来自后端的多状态 demo 数据。
- 本 change 不依赖 Redis 缓存、AI 摘要、真实附件上传、RabbitMQ、JWT 或外部可观测性组件。
