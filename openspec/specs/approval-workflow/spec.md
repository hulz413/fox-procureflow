# approval-workflow 规格

## Purpose

定义 Fox Procureflow MVP 的审批流能力，确保采购申请提交后能够按公司、品类、金额匹配审批规则，生成公司隔离的审批实例、节点和时间线，并让审批人在审批中心完成通过、驳回和撤回等操作。

## Requirements

### Requirement: 审批规则创建公司级审批实例
系统 SHALL 在采购申请提交后，根据申请所属公司、采购品类和总金额匹配活跃审批规则，并创建公司级审批实例。

#### Scenario: 数字公司 IT 硬件高金额走部门和财务审批
- **WHEN** `company-digital` 的 `DRAFT` 采购申请使用 `category-it-hardware` 品类、总金额至少为 `100000.00`，并被提交
- **THEN** 系统 MUST 为同一 `requestId` 创建一个状态为 `IN_PROGRESS` 的审批实例
- **AND** 第一个审批节点 MUST 分配给 `user-digital-approver`，状态为 `ACTIVE`
- **AND** 第二个审批节点 MUST 分配给 `user-digital-finance`，状态为 `PENDING`
- **AND** 审批上下文 MUST 快照申请公司、申请人、部门、品类、预算科目、供应商、总金额、币种、期望交付日期和行数

#### Scenario: 制造公司设备备件走生产审批
- **WHEN** `company-manufacturing` 的 `DRAFT` 采购申请使用 `category-equipment-spares` 品类并被提交
- **THEN** 系统 MUST 为同一 `requestId` 创建一个状态为 `IN_PROGRESS` 的审批实例
- **AND** 审批路径 MUST 包含一个分配给 `user-mfg-approver` 的活跃节点

#### Scenario: 公司默认规则覆盖其他已提交申请
- **WHEN** 已提交采购申请没有更具体的品类或金额规则，但申请所属公司存在活跃默认审批规则
- **THEN** 系统 MUST 基于默认规则创建一个 `IN_PROGRESS` 审批实例
- **AND** 匹配到的规则标识 MUST 在审批详情响应中可见

#### Scenario: 缺少审批规则时原子拒绝提交
- **WHEN** 调用方提交一个 `DRAFT` 采购申请，且该申请的公司、品类和金额未匹配任何活跃审批规则
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝提交调用
- **AND** 采购申请 MUST 保持 `DRAFT`
- **AND** 系统 MUST NOT 创建部分审批实例、节点或记录

### Requirement: 审批操作推进当前活跃串行流程
系统 SHALL 允许当前活跃审批人通过或驳回审批实例，并 SHALL 维护完整审批记录时间线。

#### Scenario: 通过第一个节点后激活下一个节点
- **WHEN** `user-digital-approver` 通过数字公司 IT 硬件审批实例的第一个活跃节点
- **THEN** 第一个节点 MUST 变为 `APPROVED`
- **AND** 分配给 `user-digital-finance` 的第二个节点 MUST 变为 `ACTIVE`
- **AND** 审批实例 MUST 保持 `IN_PROGRESS`
- **AND** 审批记录时间线 MUST 包含审批动作、操作者、备注和时间戳

#### Scenario: 通过最终节点完成审批
- **WHEN** 当前最终审批人通过审批实例
- **THEN** 活跃节点 MUST 变为 `APPROVED`
- **AND** 审批实例 MUST 变为 `APPROVED`
- **AND** 审批详情响应 MUST 暴露完成时间戳

#### Scenario: 驳回活跃节点终止审批
- **WHEN** 当前活跃审批人带备注驳回审批实例
- **THEN** 活跃节点 MUST 变为 `REJECTED`
- **AND** 审批实例 MUST 变为 `REJECTED`
- **AND** 待处理节点 MUST NOT 继续可操作
- **AND** 审批记录时间线 MUST 包含驳回动作、操作者、备注和时间戳

#### Scenario: 非当前审批人不能操作
- **WHEN** 未分配到活跃审批节点的用户尝试通过或驳回审批实例
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝操作
- **AND** 审批实例、节点和记录 MUST 保持不变

#### Scenario: 终态审批不能再次操作
- **WHEN** 调用方尝试通过或驳回状态为 `APPROVED`、`REJECTED` 或 `WITHDRAWN` 的审批实例
- **THEN** 系统 MUST 以冲突语义的 4xx 错误拒绝操作
- **AND** 系统 MUST NOT 创建重复审批记录

### Requirement: 申请人可以撤回进行中的审批
系统 SHALL 允许原申请人在审批进入终态前撤回进行中的审批。

#### Scenario: 申请人撤回进行中的审批
- **WHEN** 原申请人撤回状态为 `IN_PROGRESS` 的审批实例
- **THEN** 审批实例 MUST 变为 `WITHDRAWN`
- **AND** 活跃或待处理节点 MUST 不再可操作
- **AND** 审批记录时间线 MUST 包含撤回动作、操作者、备注和时间戳

#### Scenario: 非申请人不能撤回审批
- **WHEN** 原申请人之外的用户尝试撤回审批实例
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝操作
- **AND** 审批实例 MUST 保持不变

#### Scenario: 终态审批不能撤回
- **WHEN** 原申请人尝试撤回状态为 `APPROVED`、`REJECTED` 或 `WITHDRAWN` 的审批实例
- **THEN** 系统 MUST 以冲突语义的 4xx 错误拒绝操作
- **AND** 审批记录时间线 MUST NOT 接收重复撤回动作

### Requirement: 审批 API 暴露公司级任务、详情和时间线
系统 SHALL 暴露审批 REST API，返回按公司归属隔离的任务列表、审批详情和时间线记录，并可用于当前演示安全模型。

#### Scenario: 列出一个审批人的活跃任务
- **WHEN** 调用方请求 `GET /api/approvals/tasks?companyId=company-digital&approverId=user-digital-approver`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 且分配给 `user-digital-approver` 的活跃审批节点
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的审批

#### Scenario: 按 approvalId 查询审批详情
- **WHEN** 调用方对现有审批实例请求 `GET /api/approvals/{approvalId}`
- **THEN** 系统 MUST 返回审批头、申请标识、匹配规则、当前状态、节点、上下文快照和时间线记录

#### Scenario: 按 requestId 查询审批详情
- **WHEN** 调用方对已有审批实例的采购申请请求 `GET /api/approvals/by-request/{requestId}`
- **THEN** 系统 MUST 返回该申请的审批摘要、节点和时间线

#### Scenario: 未知公司任务请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求审批任务
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

#### Scenario: Swagger 记录审批端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含审批任务、详情、通过、驳回和撤回端点

#### Scenario: 演示前端可以调用审批 API
- **WHEN** 前端在当前 skeleton 环境中调用审批 GET 和 POST 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司、操作者、申请人和审批人归属

### Requirement: 前端提供审批中心流程
前端 SHALL 提供真实审批中心页面，供审批人查看和处理审批任务。

#### Scenario: 打开审批中心页面
- **WHEN** 用户在工作台导航中选择“审批中心”
- **THEN** 系统 MUST 打开 `/approvals` 页面
- **AND** 页面 MUST 从后端 API 加载审批任务，而不是使用静态 mock 数据

#### Scenario: 查看审批任务详情
- **WHEN** 审批人选择一个活跃审批任务
- **THEN** 前端 MUST 展示采购申请摘要、审批路径、当前节点、上下文快照和时间线记录

#### Scenario: 从前端通过任务
- **WHEN** 当前活跃审批人在审批中心通过任务
- **THEN** 前端 MUST 调用通过 API
- **AND** 任务列表和审批详情 MUST 刷新，以展示下一个活跃节点或最终 `APPROVED` 状态

#### Scenario: 从前端驳回任务
- **WHEN** 当前活跃审批人在审批中心带备注驳回任务
- **THEN** 前端 MUST 调用驳回 API
- **AND** 任务列表和审批详情 MUST 刷新，以展示 `REJECTED` 状态和驳回记录

### Requirement: 审批流不创建下游采购记录
系统 SHALL 将审批聚焦在申请审核，并且 SHALL NOT 创建 RFQ、采购订单、收货、发票、匹配记录或 AI 建议。

#### Scenario: 审批完成不创建 RFQ 或 PO
- **WHEN** 审批实例到达 `APPROVED`
- **THEN** 系统 MUST NOT 创建 RFQ、采购订单、收货、发票、匹配记录或 AI 建议
- **AND** 审批详情 MUST 保持为后续切片使用的申请审批结果来源

#### Scenario: 审批中心前端不暴露下游操作
- **WHEN** 用户查看本 change 后的审批详情
- **THEN** 页面 MUST NOT 呈现可工作的 RFQ、PO、收货、发票、匹配、附件上传或 AI 风险操作
