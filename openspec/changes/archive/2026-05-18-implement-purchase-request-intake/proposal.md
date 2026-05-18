## Why

Fox Procureflow 已具备工程底座和稳定演示主数据，但采购工作台仍没有第一张真实业务单据。采购申请 Intake 是后续审批、RFQ、PO、收货、发票和三单匹配的上游事实来源，因此需要先把申请创建、草稿/提交、列表和详情闭环落到真实后端与前端页面。

## What Changes

- 新增采购申请 Intake 能力，允许申请人基于已 seed 的公司、用户、采购品类和预算科目创建采购申请。
- 新增采购申请 MySQL schema、JPA entity/repository/service/controller，保存申请主数据、明细行和必要的动态字段快照。
- 新增只读/写入 API：创建草稿、提交申请、查询列表、查询详情，并返回稳定业务 ID 供后续审批流引用。
- 前端新增“采购申请”可用页面，支持选择公司、申请人、品类、预算科目，录入标题、需求说明、金额、期望交付日期和明细行，保存草稿或提交。
- 采购申请列表和详情展示真实后端数据，并在工作台/导航中体现真实申请数据，而不是继续依赖静态 mock。
- 保留后续审批流、RFQ、PO、收货、发票、三单匹配、真实 JWT 登录和 AI 生成草稿的扩展空间，本 change 不实现这些下游流程。
- 验收标准：开发者启动基础设施、后端和前端后，可以从前端创建星河数字科技“20 台笔记本”采购申请草稿并提交，在列表/详情/API/Swagger 中看到真实持久化数据，且预算科目与公司隔离校验生效。

## Capabilities

### New Capabilities

- `purchase-request-intake`: 定义采购申请 Intake 的创建、草稿/提交状态、列表、详情、公司级数据隔离、主数据引用校验和前端录入体验。

### Modified Capabilities

- 无。

## Impact

- 影响后端：新增或扩展 `procurement` 包、Flyway migration、JPA entity/repository/service/controller、DTO、异常处理和测试。
- 影响数据库：新增采购申请主表、明细表和动态字段快照字段/表；引用 `companyId`、`requesterId`、`categoryId`、`budgetAccountId`、可选 `supplierId` 等稳定业务 ID。
- 影响前端：采购工作台导航中的“采购申请”从占位入口变为可用页面；新增采购申请表单、列表和详情，复用现有 F「库采 SaaS」视觉基线。
- 影响 API 文档：Swagger/OpenAPI 展示采购申请 Intake 相关接口和基础响应结构。
- 影响测试：新增 Flyway/JPA/API 测试覆盖创建、提交、列表、详情、公司隔离、预算科目校验和 OpenAPI 文档。
- 不新增外部依赖；继续使用 Spring Data JPA、Flyway、React、Ant Design、TanStack Query、React Hook Form 和 Zod。
