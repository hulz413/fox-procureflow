# purchase-request-intake 规格

## Purpose

定义 Fox Procureflow MVP 的采购申请录入能力，确保申请人可以基于演示主数据创建、保存、提交、列表查看和打开采购申请，并为后续审批、询报价、采购订单、收货、发票和三单匹配流程提供稳定上游业务记录。

## Requirements

### Requirement: 采购申请草稿基于已校验主数据创建
系统 SHALL 允许调用方使用已 seed 的公司、申请人、部门、采购品类和预算科目主数据创建采购申请草稿。

#### Scenario: 为数字公司笔记本采购创建草稿
- **WHEN** 调用方为 `company-digital` 提交草稿，使用申请人 `user-digital-applicant`、品类 `category-it-hardware`、预算科目 `budget-digital-it-equipment`、标题 "20 台笔记本采购"、期望交付日期、总金额和至少一条明细
- **THEN** 系统 MUST 持久化状态为 `DRAFT` 的采购申请
- **AND** 系统 MUST 返回稳定的 `requestId`、已提交的公司和申请人标识、计算后的总金额以及所有已持久化明细

#### Scenario: 拒绝公司不匹配的预算科目
- **WHEN** 调用方为 `company-digital` 提交草稿，但使用属于 `company-manufacturing` 的预算科目
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化采购申请

#### Scenario: 拒绝品类和预算科目不匹配
- **WHEN** 调用方提交的草稿中 `categoryId` 与所选 `budgetAccountId` 不匹配
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 错误 MUST 指明该预算科目不适用于该品类

#### Scenario: 拒绝公司外申请人
- **WHEN** 调用方为一个公司提交草稿，却使用另一个公司的申请人
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到默认活跃公司

### Requirement: 采购申请草稿可提交为上游业务记录
系统 SHALL 允许有效采购申请草稿被提交，使其成为审批流入口，以及后续 RFQ、PO、收货、发票和匹配流程的上游记录。

#### Scenario: 提交现有草稿
- **WHEN** 调用方按 `requestId` 提交现有 `DRAFT` 采购申请
- **THEN** 系统 MUST 将采购申请状态变为 `SUBMITTED`
- **AND** 系统 MUST 设置 `submittedAt`
- **AND** 系统 MUST 保持原始公司、申请人、品类、预算科目、总金额和明细数据不变
- **AND** 系统 MUST 按审批流规则为同一 `requestId` 创建正好一个审批实例
- **AND** 响应 MUST 包含所创建审批实例的审批摘要

#### Scenario: 拒绝重复提交
- **WHEN** 调用方提交已经是 `SUBMITTED` 的采购申请
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST 保持原始 `submittedAt` 值不变
- **AND** 系统 MUST NOT 为同一 `requestId` 创建第二个审批实例

#### Scenario: 未知申请不能提交
- **WHEN** 调用方提交未知 `requestId`
- **THEN** 系统 MUST 返回 not found 错误
- **AND** 系统 MUST NOT 隐式创建新的采购申请或审批实例

#### Scenario: 审批规则失败时草稿保持不变
- **WHEN** 调用方提交 `DRAFT` 采购申请，但无法匹配活跃审批规则
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 采购申请 MUST 保持 `DRAFT`
- **AND** 系统 MUST NOT 创建部分审批实例

### Requirement: 采购申请 API 暴露公司级列表和详情数据
系统 SHALL 暴露读 API，返回按公司归属隔离的采购申请列表和详情数据，并在审批实例存在时包含审批摘要。

#### Scenario: 列出一个公司的采购申请
- **WHEN** 调用方请求 `GET /api/purchase-requests?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的采购申请
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的采购申请
- **AND** 每个已有审批实例的已提交申请 MUST 包含其审批状态摘要

#### Scenario: 按状态筛选采购申请
- **WHEN** 调用方请求 `GET /api/purchase-requests?companyId=company-digital&status=SUBMITTED`
- **THEN** 系统 MUST 仅返回 `company-digital` 的 `SUBMITTED` 采购申请

#### Scenario: 查询采购申请详情
- **WHEN** 调用方对现有采购申请请求 `GET /api/purchase-requests/{requestId}`
- **THEN** 系统 MUST 返回申请头、状态、公司、申请人、部门、品类、预算科目、总金额、期望交付日期、字段快照和明细
- **AND** 如果该申请存在审批实例，响应 MUST 包含审批状态、当前节点、当前审批人、匹配规则和时间线摘要

#### Scenario: 未知公司列表请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求采购申请列表
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

### Requirement: 采购申请端点已文档化并可用于当前演示安全模型
系统 SHALL 在生成的 API 文档中暴露采购申请录入端点，并允许在 JWT 认证实现前进行本地演示调用。

#### Scenario: Swagger 记录采购申请端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含采购申请的草稿创建、草稿提交、列表和详情端点

#### Scenario: 演示前端可以调用采购申请 API
- **WHEN** 前端在当前 skeleton 环境中调用采购申请 GET 和 POST 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司和主数据归属

### Requirement: 前端提供采购申请录入流程
前端 SHALL 在采购工作台中提供真实采购申请页面，用于创建、提交、列表查看、查看采购申请，并展示其审批状态和统一审批进度摘要。

#### Scenario: 打开采购申请页面
- **WHEN** 用户在工作台导航中选择“采购申请”
- **THEN** 系统 MUST 打开 `/purchase-requests` 页面
- **AND** 页面 MUST 从后端 API 加载公司、申请人、品类和预算科目选项，而不是使用静态 mock 数据

#### Scenario: 活跃公司上下文约束表单选项
- **WHEN** 用户在活跃演示公司上下文下打开采购申请页面
- **THEN** 申请人和预算科目选项 MUST 仅展示属于该活跃公司的记录
- **AND** 采购申请页面 MUST NOT 在当前 MVP 切片中暴露公司切换器
- **AND** 供应商池和采购品类 MUST 保持集团级参考数据

#### Scenario: 从前端保存草稿
- **WHEN** 用户填写必填采购申请字段并保存草稿
- **THEN** 前端 MUST 调用草稿创建 API
- **AND** 新草稿 MUST 以其后端 `requestId` 和 `DRAFT` 状态出现在列表中

#### Scenario: 从前端提交采购申请
- **WHEN** 用户提交已保存草稿
- **THEN** 前端 MUST 调用提交 API
- **AND** 列表和详情视图 MUST 将该申请展示为 `SUBMITTED`
- **AND** 列表和详情视图 MUST 展示已创建审批实例的状态和当前审批节点

#### Scenario: 查看采购申请审批进度
- **WHEN** 用户打开带审批实例的已提交采购申请详情
- **THEN** 前端 MUST 展示来自后端 API 的审批状态、当前审批人和统一审批进度摘要
- **AND** 如果前端已加载完整审批详情，审批进度摘要 MUST 同时表达路径节点和审批记录
- **AND** 页面 MUST NOT 将审批路径和审批记录渲染为两个并列的主区域

### Requirement: 采购申请 Intake 不实现下游流程
系统 SHALL 将采购申请 Intake 聚焦在创建和提交上游申请记录以及移交审批流，并且 SHALL NOT 创建采购执行记录。

#### Scenario: 提交移交时创建审批流
- **WHEN** 审批流可用后采购申请被提交
- **THEN** 系统 MUST 根据审批流规则创建审批实例
- **AND** 系统 MUST NOT 创建 RFQ、PO、收货、发票、匹配记录或 AI 建议

#### Scenario: 前端不提供下游操作
- **WHEN** 用户查看本 change 后的采购申请页面
- **THEN** 页面 MAY 展示审批状态和到审批详情的导航
- **AND** 页面 MUST NOT 呈现可工作的 RFQ、PO、收货、发票、匹配、附件上传或 AI 草稿操作
