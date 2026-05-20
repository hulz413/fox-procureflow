## ADDED Requirements

### Requirement: 前端应用组合与采购工作台实现分离
系统 SHALL 将 React 应用组合职责与采购 feature workbench 实现分离，同时保持现有 Fox Procureflow 工作台行为。

#### Scenario: App entry 保持组合职责
- **WHEN** 开发者在模块化后检查 `frontend/src/App.tsx`
- **THEN** 该文件 MUST 只保留 providers、router mounting、theme/locale setup 和 top-level app export 等应用组合职责
- **AND** 该文件 MUST NOT 包含完整 feature workbench 实现、endpoint-specific API functions、domain DTO collections 或完整 localization dictionaries

#### Scenario: Feature workbenches 位于明确模块
- **WHEN** 开发者检查前端源码树
- **THEN** dashboard、purchase requests、approvals、RFQ、purchase orders、receipts/invoices、three-way matching、supplier pool、master data、global search、AI assistant 和 attachment UI MUST 被组织进明确的 feature、shared、API、domain、i18n 或 app modules
- **AND** 现有 sidebar 中的每个 route MUST 仍渲染与模块化前相同的用户可见工作台

### Requirement: 模块化保持多公司采购上下文
前端 SHALL 在代码迁移到模块后保持当前集团和公司上下文语义。

#### Scenario: 公司级工作台使用 selected company context
- **WHEN** selected company 是星河数字科技有限公司或星河智能制造有限公司
- **THEN** purchase requests、approvals、RFQ、purchase orders、receipts/invoices、three-way matching 和 company-scoped dashboard views MUST 继续为该 selected company context 请求并渲染数据
- **AND** 这些工作台 MUST NOT 回退到跨公司的 frontend mock data

#### Scenario: 集团共享供应商上下文保持可见
- **WHEN** 用户打开 supplier pool 或搜索共享供应商
- **THEN** 前端 MUST 在既有行为需要时继续将 suppliers 呈现为 group-shared reference data
- **AND** company-scoped procurement transactions MUST 继续与 group-shared reference data 在视觉和上下文上可区分

#### Scenario: Demo persona 权限行为保持稳定
- **WHEN** active demo persona 在 applicant、approver、procurement、warehouse、finance 和 admin 之间切换
- **THEN** visible navigation、primary actions、reset action availability 和 disabled action states MUST 与模块化前行为等价

### Requirement: 前端 API 访问继续由真实后端支撑
模块化后的前端 SHALL 保持现有 API contracts，并 MUST 使用真实 backend-backed data 支撑采购工作台。

#### Scenario: API module 保持 endpoint 行为
- **WHEN** feature workbench 请求 health、master data、purchase requests、approvals、RFQ、purchase orders、receipts、invoices、matching、dashboard、search、AI 或 attachments
- **THEN** 该请求 MUST 使用与模块化前相同的 backend API path、query semantics、payload shape、response envelope handling 和 API base URL behavior

#### Scenario: 采购列表不使用静态 mock data
- **WHEN** company-scoped procurement list 为空或 loading
- **THEN** 前端 MUST 根据后端响应展示相应 loading、empty 或 error state
- **AND** 前端 MUST NOT 注入 static frontend mock rows 来掩盖缺失的 backend data

#### Scenario: Attachments 保持上传和下载行为
- **WHEN** RFQ quote attachments、receipt attachments 或 supplier invoice attachments 被展示或上传
- **THEN** 前端 MUST 继续使用现有 attachment APIs 和 download URL behavior
- **AND** metadata-only historical attachments MUST 继续暴露现有 disabled download reason

### Requirement: 采购流程交互保持后端状态边界
模块化后的前端 SHALL 保持现有采购流程 mutations 和一致性边界。

#### Scenario: Approval actions 保持状态流
- **WHEN** approver 在 approval workbench 或相关 detail view 中 approve、reject 或 withdraw approval
- **THEN** 前端 MUST 调用现有 approval action API，并刷新相同受影响的 approval 和 purchase request data
- **AND** 前端 MUST NOT 在后端响应确认前本地制造最终 approval status

#### Scenario: Purchase order actions 保持状态流
- **WHEN** procurement user 发布或取消 purchase order
- **THEN** 前端 MUST 调用现有 purchase order action API，并保留当前 unavailable actions 的 disabled reason tooltips
- **AND** 前端 MUST NOT 在 frontend-only logic 中改变 PO status transition rules

#### Scenario: Receipt、invoice 和 matching actions 保持状态流
- **WHEN** 用户创建 receipt、创建 invoice、recalculate matching 或记录 three-way matching action
- **THEN** 前端 MUST 调用现有 backend APIs，并刷新相同 receipt、invoice、fulfillment 和 matching query data
- **AND** 前端 MUST NOT 在没有 backend confirmation 的情况下 create、resolve 或 reopen matching state

### Requirement: Drawer、disabled-action、search 和 AI 行为保持等价
模块化后的前端 SHALL 保持关键工作台交互行为，防止用户误改状态或无法理解操作不可用原因。

#### Scenario: Dirty editable drawers 必须确认
- **WHEN** 用户在 create、quote、purchase order、receipt/invoice、approval comment 或 matching action drawer 中存在未保存输入
- **THEN** 关闭 drawer、切换 selected row 或离开当前 editing object 时 MUST 继续在现有行为会提示的场景提示确认

#### Scenario: Disabled actions 解释具体原因
- **WHEN** detail view 或 drawer 渲染 disabled business action
- **THEN** disabled control MUST 继续暴露具体 tooltip reason，而不是只有泛化 disabled state

#### Scenario: Global search 保持键盘和路由感知
- **WHEN** 用户通过 topbar button 或 keyboard shortcut 打开 global search 并选择结果
- **THEN** dialog MUST 继续使用 backend search results、keyboard navigation 和现有 target routes 或 query parameters 打开匹配 workbench detail

#### Scenario: AI result panels 保持建议属性
- **WHEN** AI draft、risk、RFQ explanation 或 matching explanation results 被展示
- **THEN** 前端 MUST 继续将 AI output 呈现为 advisory preview 或 explanation content
- **AND** 前端 MUST NOT 绕过正式 business validation、approval、matching 或 persistence flows

### Requirement: 模块化无需新增基础设施即可验证
前端模块化 SHALL 能通过现有本地开发和 MVP demo tooling 验证。

#### Scenario: Frontend verification 成功
- **WHEN** 开发者使用项目支持的 Node.js 版本运行 frontend lint、test 和 build commands
- **THEN** 这些 commands MUST 成功，且不需要新的 frontend framework dependencies、backend API changes 或当前 MVP 环境之外的 external services

#### Scenario: Demo smoke check 保持有效
- **WHEN** 本地 demo services 被启动并运行 smoke check
- **THEN** smoke check MUST 仍确认 frontend workbench 可访问且由 backend-backed data 支撑
- **AND** smoke check MUST NOT 要求 Redis、RabbitMQ、Elasticsearch、Keycloak、Prometheus、Grafana、Jaeger、Zipkin 或任何新服务成为 hard dependency
