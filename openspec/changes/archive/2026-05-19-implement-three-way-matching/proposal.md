## Why

Fox Procureflow 已经完成从采购申请、审批、RFQ、PO 到收货与发票登记的 P0 业务链路，但财务人员还无法判断 PO、收货单和供应商发票之间是否一致。三单匹配是 MVP 必须展示的闭环终点，需要现在补齐差异识别、异常队列和处理记录，让集团内部两家公司都能演示从采购执行到财务核验的完整流程。

## What Changes

- 新增三单匹配能力，以已发布 PO、累计收货和供应商发票为输入，识别数量差异、金额差异、缺收货、缺发票和超额开票等 MVP 异常。
- 新增公司级匹配结果、差异项、异常队列、详情查询和处理记录，财务人员可以确认、标记处理中或关闭异常。
- 收货或发票创建后，同步刷新对应 PO 的匹配结果，保持前中期 P0 边界内的 MySQL + 同步服务调用实现。
- 新增前端“三单匹配”工作台，展示公司隔离的匹配概览、异常队列、匹配详情和处理操作，不使用前端静态 mock 掩盖空列表。
- 准备多状态 demo 数据，至少覆盖完全匹配、发票金额高于 PO、收货数量不足、发票数量超过收货等真实演示场景。
- 非目标：不实现付款、供应商门户、真实附件上传、RabbitMQ 事件触发、AI 异常解释、Redis 指标缓存、JWT 登录或复杂权限矩阵。

## Capabilities

### New Capabilities

- `three-way-matching`: 定义 PO、收货单和供应商发票三方匹配、差异识别、异常队列、处理记录、公司级 API 和前端工作台行为。

### Modified Capabilities

- `receipts-and-invoices`: 收货和发票创建后的边界从“不创建 matching 记录”调整为在三单匹配能力存在时同步刷新对应 PO 的匹配结果。

## Impact

- Backend: 新增三单匹配 MySQL 表、Flyway migration、JPA entity、repository、service、controller、DTO、状态枚举、差异类型和 Swagger/OpenAPI 描述。
- Backend integration: 读取采购订单、收货单和发票数据，并在收货/发票创建后调用匹配服务刷新同一公司、同一 PO 的匹配结果。
- Frontend: 新增 `/three-way-matching` 路由、导航入口、匹配概览、异常队列、详情抽屉和异常处理操作，沿用现有 Ant Design 工作台风格。
- Data: seed 数据需要覆盖星河数字科技有限公司和星河智能制造有限公司的不同匹配状态，采购执行类列表至少提供 3 条来自后端的真实演示数据。
- Testing: 覆盖完全匹配、数量差异、金额差异、缺收货/缺发票、跨公司隔离、重复刷新幂等、异常处理状态流转、Swagger 文档和前端构建。
- Dependencies and infrastructure: 继续使用 MySQL 和同步服务调用；不新增 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek 依赖。

## Acceptance Criteria

- 财务人员可以按公司查看三单匹配列表和异常队列，且不会看到另一家公司 PO、收货或发票产生的匹配结果。
- 系统能基于已发布 PO、累计收货和供应商发票识别正常匹配和至少三类异常，并将差异项保存为可审计记录。
- 收货或发票新增后，相关 PO 的匹配结果会同步刷新；重复刷新不会产生重复异常或重复处理记录。
- 前端可以完成核心演示：查看匹配概览、打开详情、查看差异项、处理异常并刷新列表状态。
- 本 change 不依赖 RabbitMQ、AI、真实附件上传或付款流程。
