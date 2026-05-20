## ADDED Requirements

### Requirement: 全局搜索暴露只读采购搜索 API
系统 SHALL 提供只读全局搜索 API，为当前演示公司上下文返回匹配的采购业务对象和共享参考数据。

#### Scenario: 搜索当前公司的采购对象
- **WHEN** 调用方请求 `GET /api/global-search?companyId=company-digital&query=PO-20260518`
- **THEN** 响应 MUST 包含 `company-digital` 下匹配的公司归属采购订单、收货、发票和三单匹配记录
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的采购交易记录

#### Scenario: 搜索集团共享供应商池
- **WHEN** 调用方搜索供应商名称，例如 `上海云舟`
- **THEN** 响应 MUST 包含来自集团共享供应商池的匹配供应商
- **AND** 供应商结果 MUST 标记为集团共享参考数据，而不是公司归属交易数据

#### Scenario: 搜索没有有效查询词
- **WHEN** 调用方提交空查询或过短而无法可靠搜索的查询
- **THEN** API MUST 返回成功的空结果集，并包含规范化查询和生成时间戳
- **AND** API MUST NOT 返回前端静态演示结果或变更任何业务记录

#### Scenario: 拒绝未知公司上下文
- **WHEN** 调用方使用未知 `companyId` 请求全局搜索
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

### Requirement: 搜索结果按业务查找需要分组、带上下文并排序
全局搜索响应 SHALL 按业务类型分组结果，并提供足够上下文，帮助用户区分相似采购对象。

#### Scenario: 返回分组结果载荷
- **WHEN** 全局搜索在采购申请、RFQ、采购订单和供应商中找到结果
- **THEN** 响应 MUST 按稳定结果类型分组结果
- **AND** 每个结果 MUST 包含稳定标识、展示标题、结果类型、可用时的状态或阶段标签、匹配字段和导航目标

#### Scenario: 交易结果包含业务上下文
- **WHEN** 返回采购申请、RFQ、采购订单、收货、发票或匹配记录的交易结果
- **THEN** 结果 MUST 包含归属公司标识和公司名称
- **AND** 当这些字段存在时，结果 SHOULD 包含供应商、金额、币种、状态和相关来源单据标识

#### Scenario: 精确标识匹配优先排序
- **WHEN** 查询精确匹配或强前缀匹配业务标识，例如 `PR-`、`RFQ-`、`PO-`、发票号或匹配标识
- **THEN** 在同一结果类型内，精确或前缀标识匹配 MUST 排在更宽泛的标题、供应商或备注匹配之前

### Requirement: 全局搜索遵守公司隔离和共享数据边界
系统 SHALL 在跨模块搜索时保留现有 Fox Procureflow 数据归属模型。

#### Scenario: 交易结果保持公司级隔离
- **WHEN** 当前搜索公司是 `company-digital`
- **THEN** 采购申请、审批、RFQ、采购订单、收货、发票和三单匹配结果 MUST 限定为 `companyId` 为 `company-digital` 的记录
- **AND** 响应 MUST NOT 泄露 `company-manufacturing` 交易记录的标题、标识、金额、供应商或状态

#### Scenario: 公司级主数据保持公司级隔离
- **WHEN** 全局搜索返回部门、用户或预算科目
- **THEN** 对底层主数据归属公司的对象，结果 MUST 限定在所选公司内
- **AND** 采购品类和供应商 MAY 作为集团共享参考数据返回

#### Scenario: 搜索不改变采购状态
- **WHEN** 用户执行全局搜索或打开搜索结果
- **THEN** 系统 MUST NOT 创建、更新、通过、驳回、发布、取消、收货、开票、重算、解决、上传或删除任何采购业务记录

### Requirement: 前端提供 command-palette 风格全局搜索体验
前端 SHALL 将 topbar 搜索图标变成 command-palette 风格的全局搜索对话框，用于快速查找采购对象。

#### Scenario: 从 topbar 打开搜索
- **WHEN** 用户点击 topbar 搜索按钮
- **THEN** 前端 MUST 打开带聚焦搜索输入框的搜索对话框
- **AND** 对话框 MUST 可从现有 Fox Procureflow 工作台外壳打开，且不打断当前页面

#### Scenario: 使用键盘快捷键打开搜索
- **WHEN** 用户在工作台聚焦时按下 macOS 上的 `Cmd+K` 或 Windows/Linux 上的 `Ctrl+K`
- **THEN** 前端 MUST 打开同一个全局搜索对话框
- **AND** 按下 `Esc` MUST 关闭对话框且不改变当前路由

#### Scenario: 搜索并展示后端结果
- **WHEN** 用户输入已知 `PR`、`RFQ`、`PO`、供应商、发票号或匹配异常的查询
- **THEN** 前端 MUST 使用当前公司上下文调用全局搜索 API
- **AND** 它 MUST 渲染 loading、results、empty 和 error 状态，且不使用静态 mock 搜索数据

#### Scenario: 用键盘导航搜索结果
- **WHEN** 搜索结果可见
- **THEN** 用户 MUST 能够用键盘在结果中移动选择，并用 Enter 打开选中结果
- **AND** 选中结果 MUST 与其他结果有清晰视觉区分

### Requirement: 搜索结果导航到归属工作台和目标详情
前端 SHALL 将每个搜索结果路由到合适的现有工作台，并尽可能打开或定位匹配业务对象。

#### Scenario: 打开采购申请结果
- **WHEN** 用户从全局搜索打开采购申请结果
- **THEN** 前端 MUST 导航到 `/purchase-requests`，并携带所选申请的稳定 target 参数
- **AND** 当记录可用时，采购申请工作台 MUST 打开或选中匹配申请详情

#### Scenario: 打开 RFQ 或采购订单结果
- **WHEN** 用户从全局搜索打开 RFQ 或采购订单结果
- **THEN** 前端 MUST 导航到 `/rfqs` 或 `/purchase-orders`，并携带稳定 target 参数
- **AND** 当记录可用时，目标工作台 MUST 打开或选中匹配详情

#### Scenario: 打开收货、发票或匹配结果
- **WHEN** 用户从全局搜索打开收货、发票、PO 履约或三单匹配结果
- **THEN** 前端 MUST 导航到 `/receipts-invoices` 或 `/three-way-matching`，并携带稳定 target 参数
- **AND** 当记录可用时，目标工作台 MUST 打开或选中相关 PO 或匹配详情

#### Scenario: 打开供应商或主数据结果
- **WHEN** 用户从全局搜索打开供应商或主数据结果
- **THEN** 前端 MUST 按需导航到 `/suppliers` 或 `/master-data`
- **AND** 当供应商可用时，供应商结果 MUST 打开或选中匹配的只读供应商详情

### Requirement: 全局搜索已文档化并避免延期基础设施
全局搜索能力 SHALL 被文档化，并可在 MVP 本地环境中运行，无需延期基础设施或 AI 服务。

#### Scenario: Swagger 记录全局搜索端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含全局搜索端点、查询参数、公司上下文、结果类型和响应结构

#### Scenario: 搜索不依赖外部搜索基础设施
- **WHEN** 开发者在 MVP 本地环境中运行全局搜索
- **THEN** 搜索能力 MUST 使用现有 MySQL-backed 数据和同步请求处理
- **AND** 它 MUST NOT 需要 Elasticsearch、Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak、DeepSeek 或其他 AI 服务
