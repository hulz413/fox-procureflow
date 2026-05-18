## Why

Fox Procureflow 已经具备演示主数据和采购申请 Intake，但提交后的申请仍停留在 `SUBMITTED`，无法形成集团内部采购协同的第一道控制点。审批流是 RFQ、PO、收货、发票和三单匹配之前的必经 P0 切片，需要让不同公司按金额、品类和责任人生成可追踪、可处理的审批路径。

## What Changes

- 新增审批流垂直切片，复用已有 `requestId`、`companyId`、`requesterId`、`departmentId`、`categoryId`、`budgetAccountId`、`supplierId`、金额和申请明细，不重复创建采购申请。
- 新增公司级审批规则匹配：星河数字科技 IT 设备大额采购进入部门负责人 + 财务审批；星河智能制造设备备件采购进入生产负责人审批。
- 新增审批实例、审批节点、审批记录和审批上下文快照，支持审批通过、驳回、撤回、待办列表和审批时间线。
- 采购申请提交后进入审批流，申请详情展示审批状态；后续 RFQ 只能消费审批通过的申请。
- 前端新增“审批中心”真实页面，并在采购申请详情中展示当前审批状态、当前节点和时间线。
- 验收标准：开发者启动 MySQL、后端和前端后，可以提交一张演示采购申请，系统按公司/品类/金额生成审批路径，审批人可以在审批中心处理待办，申请人可以撤回未完成审批，列表/详情/API/Swagger 能看到一致状态。
- 非目标：不实现 RFQ、PO、收货、发票、三单匹配、JWT 登录、真实组织权限、审批前 AI 风险提示、Redis 待办缓存、RabbitMQ 事件发布、MinIO 附件上传或复杂可配置 BPMN/流程设计器。

## Capabilities

### New Capabilities

- `approval-workflow`: 定义采购申请审批流的规则匹配、实例生成、节点流转、审批操作、撤回、待办列表、时间线、公司级数据隔离和前端审批中心体验。

### Modified Capabilities

- `purchase-request-intake`: 提交后的采购申请从单纯上游记录扩展为审批流入口；申请仍保持原始主数据和明细不变，但需要暴露审批状态，并且不触发 RFQ、PO、收货、发票、三单匹配或 AI 行为。

## Impact

- 影响后端：新增 `procurement.approval` 相关 entity/repository/service/controller/DTO，扩展采购申请提交和详情查询的审批状态协作点。
- 影响数据库：新增审批规则、审批实例、审批节点、审批记录表；可选补充审批上下文快照存储；所有核心表保留 `companyId` 以支持公司隔离。
- 影响前端：导航中的“审批中心”从占位入口变为可用页面；采购申请详情显示审批状态、当前节点和审批时间线。
- 影响 API 文档：Swagger/OpenAPI 展示审批流创建/查询/待办/通过/驳回/撤回接口，以及采购申请详情中的审批摘要字段。
- 影响测试：新增后端集成测试覆盖规则匹配、路径生成、通过、驳回、撤回、公司隔离、重复操作拒绝和 OpenAPI 文档；前端至少通过构建验证审批中心与申请详情集成。
- 外部依赖：本切片只要求 MySQL 相关能力，复用现有 Spring Data JPA、Flyway、Spring Web、Spring Validation、React、Ant Design 和 TanStack Query；Redis、RabbitMQ、MinIO、AI 风险提示和完整权限鉴权留给后续切片。
