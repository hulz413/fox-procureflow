## Context

Fox Procureflow 已完成本地工程底座和演示主数据切片。当前系统已有多公司上下文、集团共享供应商池、采购品类、公司级预算科目、用户和只读 `/api/master-data/**` API，但采购工作台里的“采购申请”仍是占位入口。

采购申请 Intake 是后续审批、RFQ、PO、收货、发票和三单匹配的上游业务事实。本 change 需要交付第一张可持久化、可查询、可提交的业务单据，并复用 `demo-master-data` 中的稳定业务 ID。数据归属以 `companyId` 为边界：采购申请、明细、预算科目引用和后续流程实例都属于具体公司；供应商池和采购品类仍为集团共享参考数据。

Roadmap 中采购申请最终会覆盖动态表单、附件和 AI 生成草稿。本次实现选择更小的 P0 垂直切片：先落 MySQL 主单与明细、必要字段快照、前端录入和真实列表详情。MongoDB 动态表单 schema、MinIO 附件和 DeepSeek AI 草稿不在本次完成范围。

## Goals / Non-Goals

**Goals:**

- 新增采购申请 Intake 的数据库表、后端服务、REST API、Swagger 文档和前端页面。
- 支持基于已 seed 的公司、申请人、部门、采购品类和预算科目创建草稿。
- 支持将草稿提交为 `SUBMITTED`，并生成稳定业务 ID 供后续审批流引用。
- 支持按公司查询采购申请列表和详情，确保不同公司之间数据隔离。
- 前端“采购申请”入口变成真实可用页面，列表、详情、表单均来自后端数据。
- 在无 JWT 的当前阶段，对采购申请 demo API 做临时放行，同时保留后续真实鉴权切片的替换空间。

**Non-Goals:**

- 不实现审批流、撤回、驳回、RFQ、PO、收货、发票或三单匹配。
- 不实现真实登录、JWT、用户会话、菜单级权限或审批待办。
- 不实现完整动态表单引擎、MongoDB 表单 schema、MinIO 附件上传或附件预览。
- 不接入 DeepSeek API，不提供 AI 采购申请草稿生成。
- 不扣减预算、不做预算冻结或财务占用，只校验预算科目归属和可用性。

## Decisions

### 1. 采购申请以 MySQL 主单加明细落地

使用 Flyway 新增 `V3__create_purchase_request_intake.sql`，创建 `purchase_requests` 和 `purchase_request_lines`。主单存储 `request_id`、`company_id`、`requester_id`、`department_id`、`category_id`、`budget_account_id`、`title`、`description`、`status`、`total_amount`、`currency`、`expected_delivery_date`、`submitted_at`、审计时间和 `field_snapshot_json`。明细行存储行号、物品名称、规格说明、数量、单位、预估单价和行金额。

理由：本切片需要稳定交易数据和查询能力，关系型表比 MongoDB 更适合主单、明细、金额和公司隔离索引。`field_snapshot_json` 只保存当前固定表单的轻量快照，为后续 MongoDB 动态表单迁移保留上下文。

备选方案：直接实现 MongoDB 动态表单 schema 和快照。暂不采用，因为会扩大切片范围，还会在第一张业务单据前引入表单设计器和版本化规则复杂度。

### 2. 状态只包含 `DRAFT` 和 `SUBMITTED`

本切片只实现草稿创建和提交。提交时将状态从 `DRAFT` 改为 `SUBMITTED` 并写入 `submitted_at`；已提交申请不可通过本切片再次提交或修改。后续审批流 change 将从 `SUBMITTED` 申请创建审批实例，并定义审批中的状态。

理由：`SUBMITTED` 是明确的下游一致性边界。审批、RFQ 和 PO 不应在 Intake 切片内提前伪造。

备选方案：在本切片加入 `APPROVING`、`APPROVED`、`REJECTED`。暂不采用，因为这些状态属于审批流能力，需要审批规则、审批记录和待办一致性配套。

### 3. 后端 API 采用先草稿后提交的显式流程

新增以下 API：

- `POST /api/purchase-requests/drafts`: 创建草稿。
- `POST /api/purchase-requests/{requestId}/submit`: 提交草稿。
- `GET /api/purchase-requests?companyId=...&status=...`: 查询公司范围内的申请列表，`status` 可选。
- `GET /api/purchase-requests/{requestId}`: 查询申请详情。

理由：这组接口能够覆盖演示闭环，也能让后续审批流只依赖已提交申请。`requestId` 使用稳定业务 ID，例如 `PR-20260518-0001`，后续流程引用业务 ID 而不是数据库自增 ID。

备选方案：使用单个 `POST /api/purchase-requests` 携带目标状态。暂不采用，因为会模糊“保存草稿”和“正式提交”的业务动作。

### 4. 主数据引用必须由后端强校验

服务层校验：

- `companyId` 必须存在。
- `requesterId` 必须属于 `companyId` 且用户处于 active。
- `departmentId` 必须属于 `companyId`，并与申请人部门一致或显式选择同公司部门。
- `categoryId` 必须是有效集团采购品类。
- `budgetAccountId` 必须属于 `companyId`，处于 active，且关联同一 `categoryId`。
- 可选 `supplierId` 如果后续前端提供，必须存在于集团共享供应商池，并支持所选 `categoryId`。

理由：前端选择项可以提升体验，但不能承担数据归属与权限边界。错误引用返回可见的 4xx 错误，不回退到默认公司。

备选方案：仅在前端过滤选项。暂不采用，因为会允许 API 调用绕过公司隔离。

### 5. 权限影响保持 demo 临时放行

当前 skeleton 尚未实现 JWT。为了让前端可以完成本地演示，`SecurityConfig` 临时放行 `/api/purchase-requests/**` 的 GET 和 POST。设计上仍要求所有写入请求带显式 `companyId`、`requesterId`，并由服务层执行公司归属校验。后续 JWT change 将把申请人身份从 token 注入，并收紧写入权限。

理由：本地 MVP 先验证业务闭环，不能把 Intake 阻塞在未实现的身份系统上。

备选方案：在本切片同时实现 JWT。暂不采用，因为登录、权限模型和演示账号会明显扩大范围。

### 6. 前端采用现有工作台内页模式

新增 `/purchase-requests` route，将侧边栏“采购申请”入口指向真实页面。页面使用现有视觉基线和 Ant Design 表单控件，包含公司筛选、申请列表、详情区和创建申请表单。表单通过 master data API 拉取公司、用户、品类和预算科目；选择公司后联动过滤申请人和预算科目。

理由：采购申请是高频工作入口，应在工作台内直接完成创建和查询，而不是跳转到独立营销式页面。

备选方案：先做静态表单 mock。暂不采用，因为本 change 的核心是将采购申请变成真实业务单据。

## Risks / Trade-offs

- [Risk] Roadmap 中提到 MongoDB 动态表单和 MinIO 附件，本切片暂不实现，后续可能需要迁移字段快照。→ Mitigation: 在 MySQL 中保留 `field_snapshot_json`，并在 API 响应中明确它只是当前固定表单快照。
- [Risk] 没有 JWT 时所有本地调用都可写入采购申请。→ Mitigation: 限定为 demo 阶段临时放行，并用服务层公司归属校验防止跨公司写入。
- [Risk] 简单业务 ID 生成在高并发下可能冲突。→ Mitigation: 使用数据库唯一约束和服务层按日期序号生成，MVP 本地演示足够；后续并发场景可替换为独立序列或号段服务。
- [Risk] 预算只校验归属，不冻结金额。→ Mitigation: 明确预算占用属于审批或预算控制后续切片，本切片只提供可审计的申请金额事实。
- [Risk] 前端当前集中在 `App.tsx`，继续追加页面会增大单文件复杂度。→ Mitigation: 实现时优先拆分 `purchase-requests` 相关类型、API hooks 和页面组件，逐步把主数据页面也留出后续拆分空间。

## Migration Plan

1. 新增 Flyway `V3__create_purchase_request_intake.sql`，只创建新表和索引，不修改已有 `demo_*` 表。
2. 新增 JPA entity/repository/service/controller 和 DTO，复用现有 `ApiEnvelope` 与全局异常响应。
3. 扩展 `SecurityConfig` 临时放行采购申请 demo API。
4. 新增或扩展前端路由、API client、表单和列表详情页面。
5. 使用 Testcontainers MySQL 跑后端集成测试，确认迁移、创建、提交、查询和隔离规则。
6. 使用前端 build 和本地浏览器验证从页面创建“20 台笔记本”申请并提交。

回滚策略：如果本切片需要回退，删除 V3 新表对应数据和代码引用即可；已有 master data 与 skeleton 表不受影响。

## Open Questions

- 采购申请业务 ID 的展示格式最终是否采用 `PR-YYYYMMDD-NNNN`，还是需要包含公司短码。
- 申请提交后是否允许补充备注或撤回，建议放入审批流 change 中统一定义。
- 附件字段在后续切片中是直接挂在采购申请主单，还是抽象为通用附件表并复用于报价、收货和发票。
