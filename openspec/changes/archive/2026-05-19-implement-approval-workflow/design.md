## Context

Fox Procureflow 当前已完成工程骨架、演示主数据和采购申请 Intake。采购申请可以创建草稿、提交为 `SUBMITTED`、按公司查询列表和详情，但提交后不会生成审批实例。Roadmap 将审批流列为下一条 P0 切片，要求按公司、金额、品类生成审批路径，并复用采购申请已有稳定业务 ID。

本 change 需要把采购申请从“已提交上游记录”推进到“可审批业务对象”。审批流仍属于集团内部多公司采购协同：审批实例、节点、记录、待办和后续 RFQ 放行资格都归属具体 `companyId`；供应商池和采购品类仍是集团共享参考数据。当前没有 JWT 和真实权限系统，因此审批 API 在 demo 阶段继续使用显式 `companyId`、`actorId`、`approverId` 做服务层校验。

## Goals / Non-Goals

**Goals:**

- 新增审批规则、审批实例、审批节点和审批记录的数据模型。
- 在采购申请提交时按规则创建审批实例，并保持采购申请主数据和明细不变。
- 支持审批通过、驳回、撤回、待办列表、审批详情和时间线。
- 支持两个 roadmap 演示场景：星河数字科技 IT 设备大额采购走部门负责人 + 财务审批；星河智能制造设备备件采购走生产负责人审批。
- 采购申请详情和列表能展示审批摘要，前端新增真实“审批中心”页面。
- 保持 RFQ、PO、收货、发票和三单匹配仍由后续切片消费审批通过结果，不在本切片创建下游单据。

**Non-Goals:**

- 不实现 JWT、真实登录态、菜单权限、组织权限管理或审批委托。
- 不实现 BPMN、拖拽流程设计器、复杂条件表达式或并行会签。
- 不实现 Redis 待办缓存；待办直接由 MySQL 查询提供。
- 不发布或消费 RabbitMQ 事件；审批流与采购申请提交保持同步事务边界。
- 不实现 MinIO 附件上传；审批只读取采购申请主数据、明细和上下文快照。
- 不接入 DeepSeek API，不做审批前 AI 风险提示。
- 不实现 RFQ、PO、收货、发票、三单匹配或预算冻结。

## Decisions

### 1. 审批流作为 `procurement.approval` 独立模块

新增后端包 `com.foxprocureflow.procurement.approval`，包含审批规则、实例、节点、记录的 entity/repository/service/controller/DTO。采购申请模块只在提交事务中调用审批服务创建实例，并在列表/详情响应中附加审批摘要。

理由：审批是采购申请之后、RFQ 之前的独立业务能力。将它从 Intake 拆开，可以避免申请录入模块承载规则匹配、节点推进和待办查询的复杂度。

备选方案：把审批字段直接塞进 `purchase_requests`。暂不采用，因为多节点时间线和后续 RFQ 放行需要独立可审计的审批事实。

### 2. 审批核心数据先全部落 MySQL

新增 Flyway migration 创建：

- `approval_rules`: 规则头，包含 `rule_id`、`company_id`、可选 `category_id`、金额区间、优先级、active 状态和展示名称。
- `approval_rule_steps`: 规则步骤，包含 `step_order`、`approver_id`、节点名称。
- `approval_instances`: 审批实例，包含 `approval_id`、`request_id`、`company_id`、`requester_id`、`matched_rule_id`、`status`、`current_step_order`、`context_snapshot_json`、时间字段。
- `approval_nodes`: 实例节点，包含 `node_id`、`approval_id`、`step_order`、`approver_id`、`status`、激活/完成时间。
- `approval_records`: 审批记录，包含 `record_id`、`approval_id`、可选 `node_id`、`actor_id`、`action`、意见和时间。

理由：审批创建、节点推进和采购申请提交需要事务一致性。MySQL 能在本切片中用同一个事务保证“提交申请”和“创建审批实例”同时成功或同时失败。若后续需要富审计或动态上下文，再把 `context_snapshot_json` 迁移或同步到 MongoDB；本切片只使用 MySQL 保存必要快照。

备选方案：审批上下文立即写 MongoDB。暂不采用，因为会让提交事务跨 MySQL/MongoDB，增加失败补偿和测试复杂度。

### 3. 规则匹配采用优先级和默认规则

规则按 `companyId`、`categoryId`、金额区间和 `priority` 匹配。更具体规则优先，兜底规则使用同公司 `categoryId = NULL`、金额区间覆盖全部金额。

初始演示规则：

- `company-digital` + `category-it-hardware` + 金额大于等于 100000：`user-digital-approver` 后接 `user-digital-finance`。
- `company-manufacturing` + `category-equipment-spares`：`user-mfg-approver` 一步审批。
- 两家公司各有默认规则，使用公司业务负责人一步审批，避免其他可提交申请因没有规则而卡死。

理由：P0 需要展示规则匹配，但不需要完整流程引擎。默认规则让已有草稿和未来演示输入都有可走通路径。

备选方案：没有规则就自动通过。暂不采用，因为这会削弱审批流作为控制点的业务含义，也不利于 RFQ 后续只消费已审批申请。

### 4. 提交申请和创建审批实例在同一事务内完成

`POST /api/purchase-requests/{requestId}/submit` 继续把 `DRAFT` 改为 `SUBMITTED` 并写入 `submittedAt`，随后审批服务读取申请主数据和明细，匹配规则并创建 `IN_PROGRESS` 审批实例。首个节点为 `ACTIVE`，后续节点为 `PENDING`。如果规则缺失或审批实例创建失败，整个事务回滚，申请保持 `DRAFT`。

一致性边界：

```text
PurchaseRequest: DRAFT -> SUBMITTED
ApprovalInstance: IN_PROGRESS -> APPROVED | REJECTED | WITHDRAWN
ApprovalNode: PENDING -> ACTIVE -> APPROVED
ApprovalNode: ACTIVE -> REJECTED
```

理由：申请提交后立即进入审批流，前端和 API 不会出现“已提交但无审批实例”的新数据。已有历史 `SUBMITTED` 演示数据可通过迁移 seed 或幂等补偿任务补齐审批实例。

备选方案：提供单独的“发起审批”按钮。暂不采用，因为会增加一个用户动作，并让申请处在较长时间的悬空状态。

### 5. 审批操作只作用于当前活动节点

审批通过、驳回和撤回均通过审批服务处理：

- 当前 `ACTIVE` 节点的 `approverId` 才能通过或驳回。
- 通过非最后节点时，当前节点变为 `APPROVED`，下一节点变为 `ACTIVE`。
- 通过最后节点时，实例变为 `APPROVED`。
- 驳回任一活动节点时，实例变为 `REJECTED`，未处理节点终止。
- 申请人可在实例 `IN_PROGRESS` 时撤回，实例变为 `WITHDRAWN`。
- 终态实例拒绝重复通过、驳回或撤回。

理由：串行审批足以覆盖 roadmap 演示场景，状态流转清晰，便于后续 RFQ 判断是否已通过审批。

备选方案：节点只记录 records，不保存节点状态。暂不采用，因为待办列表和当前节点展示需要快速查询活动节点。

### 6. API 采用显式 actor 的 demo 模型

新增审批 API：

- `GET /api/approvals/tasks?companyId=...&approverId=...`: 查询当前审批人待办。
- `GET /api/approvals/{approvalId}`: 查询审批详情和时间线。
- `GET /api/approvals/by-request/{requestId}`: 按采购申请查询审批摘要和时间线。
- `POST /api/approvals/{approvalId}/approve`: 当前审批人通过。
- `POST /api/approvals/{approvalId}/reject`: 当前审批人驳回。
- `POST /api/approvals/{approvalId}/withdraw`: 申请人撤回。

请求体携带 `actorId`、可选 `comment`，服务层校验 actor 是否属于同公司并是否为当前节点审批人或原申请人。Spring Security 在 demo 阶段放行这些 API，但不跳过业务校验。

理由：当前项目尚无 JWT。显式 actor 模型保持本地演示可用，也为后续 JWT 接入保留清晰替换点。

### 7. 前端新增审批中心并复用工作台视觉

侧边栏“审批中心”指向 `/approvals`。页面加载当前演示公司、审批人列表、待办列表和选中审批详情；支持通过、驳回、填写意见，并刷新采购申请列表/详情。采购申请详情抽屉展示审批状态、当前节点、审批人和时间线入口。

理由：审批人和申请人都需要在工作台里看到同一条业务链路。审批中心应是操作面，采购申请详情是上下文面。

## Risks / Trade-offs

- [Risk] 修改采购申请提交行为会影响既有 Intake 测试。→ Mitigation: 更新 `purchase-request-intake` delta spec 和测试断言，保留 `SUBMITTED` 状态与原始字段不变，只新增审批摘要和实例创建。
- [Risk] 当前没有真实身份认证，actor 参数可伪造。→ Mitigation: 只作为 demo 阶段模型；服务层仍校验 actor/company/当前节点，后续 JWT change 替换 actor 来源。
- [Risk] 使用 MySQL JSON 存审批上下文会限制复杂审计查询。→ Mitigation: 本切片优先事务一致性，字段命名为 snapshot，后续如需要富审计再迁移到 MongoDB 审计文档。
- [Risk] 默认规则可能掩盖规则配置缺失。→ Mitigation: 默认规则只在公司级兜底使用，并在详情响应中返回 matched rule，方便演示和排查。
- [Risk] 前端 `App.tsx` 已经较大，继续追加审批中心会增加维护成本。→ Mitigation: 实现时优先拆分审批 API/types/page 组件，减少主文件继续膨胀。

## Migration Plan

1. 新增审批流 Flyway migration，创建规则、规则步骤、实例、节点和记录表。
2. Seed 审批规则和必要的演示审批实例，覆盖已有 `SUBMITTED` 演示申请。
3. 新增审批 JPA entity/repository/service/controller/DTO。
4. 扩展采购申请提交事务，创建审批实例并返回审批摘要。
5. 扩展采购申请列表/详情 DTO，显示审批摘要。
6. 扩展 Spring Security demo 放行审批 API。
7. 新增前端审批中心 route、API 调用、待办列表、详情、通过/驳回操作和申请详情审批信息。
8. 补充后端集成测试、OpenAPI 断言和前端构建验证。

回滚策略：审批表为新增表；如需回退，可移除审批模块代码和对应 migration 数据。已有采购申请主数据仍保留为 `SUBMITTED`，后续可重新创建审批实例。

## Open Questions

- 审批通过后是否需要同步扩展采购申请状态枚举为 `APPROVED`，还是长期保持审批状态独立于申请状态。
- 撤回后的申请是否允许回到 `DRAFT` 并重新编辑，还是保持 `SUBMITTED` 加审批 `WITHDRAWN` 记录。
- 后续 JWT 接入时，审批 API 是否通过当前登录用户自动推断 actor，还是仍允许演示操作员代选 actor。
