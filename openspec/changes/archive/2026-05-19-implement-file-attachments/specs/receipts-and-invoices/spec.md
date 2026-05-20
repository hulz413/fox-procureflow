## ADDED Requirements

### Requirement: 收货和发票在使用真实附件时保留匹配、付款和 AI 边界
系统 SHALL 将收货和发票登记聚焦在事实性收货/发票数据和已上传文件附件，同时允许三单匹配能力在收货或发票创建成功后同步刷新匹配结果；该流程 SHALL NOT 创建付款、异步消息或 AI 生成决策。

#### Scenario: 匹配可用后收货创建刷新匹配记录
- **WHEN** 三单匹配能力可用后，为已发布采购订单创建收货
- **THEN** 系统 MUST 为相同 `companyId` 和 `poId` 同步重算当前三单匹配结果
- **AND** 收货及其已上传附件 MUST 保持可作为匹配详情的来源输入
- **AND** 系统 MUST NOT 创建付款记录、RabbitMQ events 或 AI 建议

#### Scenario: 匹配可用后发票创建刷新匹配记录
- **WHEN** 三单匹配能力可用后，为已发布采购订单创建供应商发票
- **THEN** 系统 MUST 为相同 `companyId` 和 `poId` 同步重算当前三单匹配结果
- **AND** 发票及其已上传附件 MUST 保持可作为匹配详情的来源输入
- **AND** 系统 MUST NOT 创建付款记录、RabbitMQ events 或 AI 建议

#### Scenario: 匹配刷新失败时回滚收货和发票创建
- **WHEN** 收货或发票创建通过校验并成功，但同一采购订单的同步匹配刷新失败
- **THEN** 系统 MUST 回滚收货或发票创建事务
- **AND** 系统 MUST NOT 留下没有刷新匹配结果的来源收货/发票数据或业务附件关联

#### Scenario: 收货和发票流程只使用必需存储基础设施
- **WHEN** 开发者在 MVP 本地环境中用真实附件运行收货、发票和匹配刷新流程
- **THEN** 流程 MUST 使用 MySQL、同步 service 调用和 MinIO 对象存储
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek

## MODIFIED Requirements

### Requirement: 收货从已发布采购订单登记
系统 SHALL 允许仓库或采购用户从状态为 `ISSUED` 的采购订单创建公司级收货记录，并引用已上传的收货凭证附件。

#### Scenario: 为已发布数字公司 PO 创建部分收货
- **WHEN** `company-digital` 用户为 `ISSUED` 的 `company-digital` 采购订单创建收货，并提供一条或多条有效 PO 明细数量、收货日期、收货人、备注和已上传收货附件 ID
- **THEN** 系统 MUST 持久化带稳定 `receiptId` 的收货头
- **AND** 系统 MUST 持久化收货明细，引用来源 `poId`、`poLineId`、行号、物料快照、收货数量和单位
- **AND** 收货 MUST 持久化 `company-digital`、来源供应商、收货人、附件关联和时间戳
- **AND** 每个关联的已上传附件 MUST 带可下载元数据返回

#### Scenario: 拒绝草稿或已取消采购订单的收货
- **WHEN** 用户尝试为 `DRAFT` 或 `CANCELLED` 采购订单创建收货
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化收货、收货明细、收货附件、发票或匹配记录

#### Scenario: 拒绝超过 PO 明细数量的收货
- **WHEN** 用户提交的收货明细数量会导致累计收货数量大于来源 PO 明细数量
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 该 PO 的现有收货 MUST 保持不变

#### Scenario: 拒绝跨公司创建收货
- **WHEN** `company-digital` 用户尝试为 `company-manufacturing` 采购订单创建收货
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

#### Scenario: 拒绝带无效已上传附件的收货
- **WHEN** 用户创建收货时使用未知附件 ID、仅元数据附件、跨公司附件，或为不同 PO 上下文上传的附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 现有收货、发票、匹配和附件关联 MUST 保持不变

### Requirement: 供应商发票从已发布采购订单登记
系统 SHALL 允许财务或采购用户从状态为 `ISSUED` 的采购订单创建公司级供应商发票记录，并引用已上传的发票文件附件。

#### Scenario: 为已发布数字公司 PO 创建供应商发票
- **WHEN** `company-digital` 用户为 `ISSUED` 的 `company-digital` 采购订单创建供应商发票，并提供发票号、发票日期、登记人、明细数量、明细金额、税数据、备注和已上传发票附件 ID
- **THEN** 系统 MUST 持久化带稳定 `invoiceId` 的发票头
- **AND** 系统 MUST 持久化发票明细，引用来源 `poId`、`poLineId`、行号、物料快照、已开票数量、未税金额、税率、税额、总金额和币种
- **AND** 发票 MUST 持久化 `company-digital`、PO 供应商、发票号、登记人、附件关联和时间戳
- **AND** 每个关联的已上传附件 MUST 带可下载元数据返回

#### Scenario: 拒绝草稿或已取消采购订单的发票
- **WHEN** 用户尝试为 `DRAFT` 或 `CANCELLED` 采购订单创建发票
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化发票、发票明细、发票附件、收货或匹配记录

#### Scenario: 拒绝所选 PO 外的发票明细
- **WHEN** 用户提交的发票明细中 `poLineId` 不属于所选 `poId`
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化部分发票

#### Scenario: 拒绝超过 PO 明细数量的发票数量
- **WHEN** 用户提交的发票明细数量会导致累计开票数量大于来源 PO 明细数量
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 该 PO 的现有发票 MUST 保持不变

#### Scenario: 保留发票金额差异供后续匹配使用
- **WHEN** 用户创建总金额与来源 PO 总金额不同的发票
- **THEN** 系统 MUST 按输入持久化发票金额
- **AND** PO 履约摘要 MUST 暴露发票金额差异
- **AND** 系统 MUST NOT 在本 change 中创建三单匹配结果或匹配异常

#### Scenario: 拒绝同公司同供应商重复发票号
- **WHEN** 用户提交的发票号已存在于同一 `companyId` 和 PO 供应商下
- **THEN** 系统 MUST 以冲突语义的 4xx 错误拒绝请求
- **AND** 现有发票 MUST 保持不变

#### Scenario: 拒绝带无效已上传附件的发票
- **WHEN** 用户创建发票时使用未知附件 ID、仅元数据附件、跨公司附件，或为不同 PO 或供应商上下文上传的附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 现有收货、发票、匹配和附件关联 MUST 保持不变

### Requirement: 收货和发票 API 暴露公司级列表、详情、创建和 PO 履约摘要
系统 SHALL 暴露收货和发票 REST API，返回公司级数据、已上传和仅元数据附件数据，支持当前演示安全模型，并保持 service-layer 归属校验明确。

#### Scenario: 列出一个公司的收货
- **WHEN** 调用方请求 `GET /api/receipts?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的收货
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的收货

#### Scenario: 列出一个公司的发票
- **WHEN** 调用方请求 `GET /api/invoices?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的发票
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的发票

#### Scenario: 查询收货详情
- **WHEN** 调用方对现有收货请求 `GET /api/receipts/{receiptId}?companyId=company-digital`
- **THEN** 系统 MUST 返回收货头、来源 PO 摘要、供应商快照、收货明细、已上传和仅元数据附件元数据、备注、收货人、状态和时间戳

#### Scenario: 查询发票详情
- **WHEN** 调用方对现有发票请求 `GET /api/invoices/{invoiceId}?companyId=company-digital`
- **THEN** 系统 MUST 返回发票头、来源 PO 摘要、供应商快照、发票明细、已上传和仅元数据附件元数据、备注、登记人、金额合计、状态和时间戳

#### Scenario: 查询已发布 PO 履约摘要
- **WHEN** 调用方请求 `GET /api/receipts-invoices/purchase-orders?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的 `ISSUED` 采购订单
- **AND** 每行 MUST 包含 PO 金额、供应商、订购明细数量、累计收货数量、累计开票数量、累计发票总金额、收货状态摘要、发票状态摘要、发票金额差异和附件数量

#### Scenario: 未知公司列表请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求收货、发票或履约摘要数据
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

#### Scenario: Swagger 记录收货和发票端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含收货列表、收货详情、收货创建、发票列表、发票详情、发票创建、PO 履约摘要和附件引用结构

#### Scenario: 演示前端可以调用收货和发票 API
- **WHEN** 前端在当前 skeleton 环境中调用收货和发票 GET 与 POST 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司、操作者、收货人、登记人、采购订单、供应商、明细和附件归属或范围

### Requirement: 前端提供收货发票工作台
前端 SHALL 在采购工作台中提供真实收货发票页面，用于查看已发布 PO 履约、上传收货和发票附件、创建收货、创建发票，以及查看收货和发票详情。

#### Scenario: 打开收货发票页面
- **WHEN** 用户在工作台导航中选择“收货发票”
- **THEN** 系统 MUST 打开 `/receipts-invoices` 页面
- **AND** 页面 MUST 从后端 API 加载已发布 PO 履约摘要、收货、发票和附件数据，而不是静态 mock 数据

#### Scenario: 从前端创建收货
- **WHEN** 仓库或采购用户选择已发布 PO，输入有效 PO 明细的收货数量，上传收货凭证附件，填写收货人和收货元数据，并提交收货表单
- **THEN** 前端 MUST 按需调用附件上传 API，然后用已上传附件 ID 调用收货创建 API
- **AND** 收货列表和 PO 履约摘要 MUST 刷新，以展示后端 `receiptId`、更新后的收货数量和附件状态

#### Scenario: 从前端创建发票
- **WHEN** 财务或采购用户选择已发布 PO，输入发票号、发票日期、明细数量、明细金额、税数据、登记人，上传发票附件，并提交发票表单
- **THEN** 前端 MUST 按需调用附件上传 API，然后用已上传附件 ID 调用发票创建 API
- **AND** 发票列表和 PO 履约摘要 MUST 刷新，以展示后端 `invoiceId`、发票合计、存在时的发票金额差异和附件状态

#### Scenario: 查看 PO 履约详情
- **WHEN** 用户从收货发票工作台选择已发布 PO
- **THEN** 前端 MUST 展示 PO 供应商、PO 金额、订购明细、累计收货数量、累计开票数量、发票金额差异、相关收货、相关发票、附件元数据和下载可用性

#### Scenario: 前端防护不可用操作
- **WHEN** 所选公司没有已发布 PO、某个 PO 已经完全收货或完全开票、附件仅有元数据，或文件上传仍在等待
- **THEN** 前端 MUST 禁用无效创建或下载操作，并给出客户端可见原因
- **AND** 它 MUST 仍然依赖后端校验进行最终强制约束

## REMOVED Requirements

### Requirement: 收货和发票附件元数据无对象上传存储
**原因**: roadmap 中的真实附件上传切片用 MinIO-backed 文件和 MySQL 元数据替代仅占位的收货和发票附件行为。
**迁移**: 现有仅元数据收货和发票附件继续作为不可下载历史元数据可见；新的收货和发票附件必须在业务提交前通过文件附件 API 上传。

### Requirement: 收货和发票不实现匹配、付款、上传或 AI 流程
**原因**: 本 change 有意为收货和发票附件增加上传，同时保留付款、异步消息和 AI non-goals。
**迁移**: 匹配刷新行为移动到新 requirement “收货和发票在使用真实附件时保留匹配、付款和 AI 边界”。
