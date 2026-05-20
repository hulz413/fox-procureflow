# purchase-orders 规格

## Purpose

定义 MVP 采购订单能力，使采购用户可以从可对比 RFQ quote 创建公司级 PO，快照上游供应商、quote 和申请数据，带审计轨迹发布或取消 PO，并为后续收货、发票和三单匹配切片提供稳定上游单据。

## Requirements

### Requirement: 采购订单从可对比 RFQ quote 创建
系统 SHALL 允许采购用户从状态为 `COMPARISON_READY` 的 RFQ 上的有效供应商 quote 创建正好一个公司级采购订单。

#### Scenario: 从排名最高的数字公司 IT 硬件 RFQ quote 创建 PO
- **WHEN** `company-digital` 的采购用户从 `company-digital` 且状态为 `COMPARISON_READY` 的 RFQ 上的有效 quote 创建采购订单
- **THEN** 系统 MUST 持久化状态为 `DRAFT` 的采购订单
- **AND** 采购订单 MUST 引用来源 `rfqId`、`quoteId`、`requestId`、`approvalId`、`companyId`、采购用户、供应商、品类、预算科目、币种、quote 金额、税率、税额、总金额、期望交付日期和明细快照
- **AND** 响应 MUST 返回稳定的 `poId`

#### Scenario: RFQ 对比就绪前拒绝创建 PO
- **WHEN** 采购用户尝试从状态为 `ISSUED` 或 `QUOTING` 的 RFQ 创建采购订单
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化采购订单、采购订单明细、交付计划、状态记录、收货、发票或匹配记录

#### Scenario: 拒绝为跨公司 RFQ 创建 PO
- **WHEN** `company-digital` 的采购用户尝试从属于 `company-manufacturing` 的 RFQ 创建采购订单
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

#### Scenario: 拒绝同一 RFQ 重复创建 PO
- **WHEN** 某个 RFQ 已经存在采购订单
- **THEN** 同一 `rfqId` 的第二次创建请求 MUST 以冲突语义的 4xx 错误被拒绝
- **AND** 现有采购订单 MUST 保持不变

#### Scenario: 拒绝 RFQ 范围外 quote
- **WHEN** 采购用户提交的采购订单创建请求包含不属于所选 `rfqId` 的 `quoteId`
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化部分采购订单

### Requirement: 采购订单快照供应商、quote、申请和交付数据
系统 SHALL 将采购订单头、明细、供应商、金额、税和交付计划数据存储为稳定快照，供下游收货、发票和三单匹配流程使用。

#### Scenario: 快照所选供应商和 quote 金额
- **WHEN** 采购订单从所选 RFQ quote 创建
- **THEN** 采购订单 MUST 快照供应商标识、供应商名称、服务范围、风险等级、quote 金额、税率、税额、总金额、币种、交付日期和 quote 更新时间戳
- **AND** 后续 RFQ quote 更新 MUST NOT 变更已持久化的采购订单快照

#### Scenario: 快照来源申请明细
- **WHEN** 采购订单从来源于带明细采购申请的 RFQ 创建
- **THEN** 采购订单 MUST 为每条来源申请明细持久化一条采购订单明细
- **AND** 每条采购订单明细 MUST 包含行号、物料名称、规格、数量、单位、品类和金额快照字段，供未来收货流程使用

#### Scenario: 记录交付计划
- **WHEN** 采购用户创建采购订单并提供计划交付日期、交付地点、联系人、联系电话和交付备注
- **THEN** 系统 MUST 持久化与 `poId` 关联的交付计划
- **AND** 采购订单详情响应 MUST 包含交付计划数据

#### Scenario: 保留公司归属边界
- **WHEN** 为 `company-digital` 创建采购订单
- **THEN** 采购订单、明细、交付计划和状态记录 MUST 直接或通过采购订单头持久化 `company-digital` 归属
- **AND** `company-manufacturing` 的公司级查询 MUST NOT 返回该采购订单

### Requirement: 采购订单状态流支持草稿、发布和取消
系统 SHALL 维护一个小型 MVP 采购订单状态流，并带可审计状态记录。

#### Scenario: 发布草稿 PO
- **WHEN** 采购用户发布同公司归属的 `DRAFT` 采购订单
- **THEN** 采购订单状态 MUST 变为 `ISSUED`
- **AND** 系统 MUST 追加一条包含发布动作、操作者、可选备注和时间戳的状态记录

#### Scenario: 拒绝发布非草稿 PO
- **WHEN** 调用方尝试发布状态为 `ISSUED` 或 `CANCELLED` 的采购订单
- **THEN** 系统 MUST 以冲突语义的 4xx 错误拒绝操作
- **AND** 采购订单状态和状态记录 MUST 保持不变

#### Scenario: 取消草稿或已发布 PO
- **WHEN** 授权操作者带取消原因取消状态为 `DRAFT` 或 `ISSUED` 的采购订单
- **THEN** 采购订单状态 MUST 变为 `CANCELLED`
- **AND** 系统 MUST 追加一条包含取消动作、操作者、原因和时间戳的状态记录

#### Scenario: 拒绝重复取消
- **WHEN** 调用方尝试取消状态已经是 `CANCELLED` 的采购订单
- **THEN** 系统 MUST 以冲突语义的 4xx 错误拒绝操作
- **AND** 系统 MUST NOT 创建重复取消记录

### Requirement: 采购订单 API 暴露公司级列表、详情、创建和状态操作
系统 SHALL 暴露采购订单 REST API，返回公司级 PO 数据，并支持当前演示安全模型。

#### Scenario: 列出一个公司的采购订单
- **WHEN** 调用方请求 `GET /api/purchase-orders?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的采购订单
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的采购订单

#### Scenario: 查询采购订单详情
- **WHEN** 调用方请求现有采购订单的 `GET /api/purchase-orders/{poId}`
- **THEN** 系统 MUST 返回采购订单头、来源 RFQ 摘要、来源申请摘要、所选供应商、quote 快照、明细、交付计划、状态记录、当前状态和时间戳

#### Scenario: 通过 API 创建采购订单
- **WHEN** 调用方提交 `POST /api/purchase-orders`，包含有效 `companyId`、`rfqId`、`quoteId`、采购用户和交付计划数据
- **THEN** 系统 MUST 创建 `DRAFT` 采购订单并返回其详情响应

#### Scenario: 通过 API 发布采购订单
- **WHEN** 调用方提交 `POST /api/purchase-orders/{poId}/publish`，并带有来自采购订单所属公司的有效操作者
- **THEN** 系统 MUST 发布采购订单并返回更新后的详情响应

#### Scenario: 通过 API 取消采购订单
- **WHEN** 调用方提交 `POST /api/purchase-orders/{poId}/cancel`，并带有来自采购订单所属公司的有效操作者和原因
- **THEN** 系统 MUST 取消采购订单并返回更新后的详情响应

#### Scenario: 未知公司列表请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求采购订单列表
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

#### Scenario: Swagger 记录采购订单端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含采购订单列表、详情、创建、发布和取消端点及其请求/响应结构

#### Scenario: 演示前端可以调用采购订单 API
- **WHEN** 前端在当前 skeleton 环境中调用采购订单 GET 和 POST 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司、操作者、采购用户、RFQ、quote、供应商和采购订单归属或范围

### Requirement: 前端提供采购订单工作台
前端 SHALL 在采购工作台中提供真实采购订单页面，用于从可对比 RFQ quote 创建 PO、查看 PO 详情和执行 MVP 状态操作。

#### Scenario: 打开采购订单页面
- **WHEN** 用户在工作台导航中选择“采购订单”
- **THEN** 系统 MUST 打开 `/purchase-orders` 页面
- **AND** 页面 MUST 从后端 API 加载采购订单和符合条件的 RFQ quote 数据，而不是静态 mock 数据

#### Scenario: 从前端基于合格 RFQ quote 创建 PO
- **WHEN** 采购用户选择合格的 `COMPARISON_READY` RFQ quote，填写交付计划字段并提交 PO 表单
- **THEN** 前端 MUST 调用采购订单创建 API
- **AND** 新采购订单 MUST 出现在采购订单列表中，并展示其后端 `poId`、来源 `rfqId`、供应商、总金额和 `DRAFT` 状态

#### Scenario: 查看采购订单详情
- **WHEN** 用户从列表选择采购订单
- **THEN** 前端 MUST 展示来源 RFQ 信息、所选供应商、quote 金额、税额、总金额、明细快照、交付计划、状态记录和当前状态

#### Scenario: 从前端发布 PO
- **WHEN** 采购用户从详情视图发布 `DRAFT` 采购订单
- **THEN** 前端 MUST 调用采购订单发布 API
- **AND** 采购订单列表和详情视图 MUST 刷新，以展示 `ISSUED` 状态和发布记录

#### Scenario: 从前端取消 PO
- **WHEN** 有效操作者从详情视图带原因取消 `DRAFT` 或 `ISSUED` 采购订单
- **THEN** 前端 MUST 调用采购订单取消 API
- **AND** 采购订单列表和详情视图 MUST 刷新，以展示 `CANCELLED` 状态和取消记录

### Requirement: 采购订单不实现下游收货、发票、匹配或 AI 流程
系统 SHALL 将本 change 聚焦在采购订单创建和状态管理，并且 SHALL NOT 创建下游执行记录或 AI 生成决策。

#### Scenario: PO 发布不创建下游记录
- **WHEN** 采购订单到达 `ISSUED`
- **THEN** 系统 MUST NOT 创建收货、发票、三单匹配结果、供应商门户任务、RabbitMQ events、付款记录或 AI 建议
- **AND** 采购订单 MUST 保持为后续收货和发票切片的输入

#### Scenario: PO 流程不需要延期基础设施
- **WHEN** 开发者在 MVP 本地环境中运行采购订单流程
- **THEN** 流程 MUST 使用 MySQL 和同步 service 调用
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek
