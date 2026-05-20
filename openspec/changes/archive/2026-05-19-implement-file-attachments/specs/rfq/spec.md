## MODIFIED Requirements

### Requirement: 采集受邀供应商 quote
系统 SHALL 允许采购用户为每个受邀供应商记录当前有效 quote，包括金额、税、交付、评分、风险备注和已上传报价附件引用。

#### Scenario: 记录受邀供应商 quote
- **WHEN** 采购用户在 `ISSUED` RFQ 上为受邀供应商记录 quote，并提供 quote 金额、税率、交付日期、供应商评分、风险备注和已上传报价附件 ID
- **THEN** 系统 MUST 为该 `rfqId` 和 `supplierId` 持久化 quote
- **AND** RFQ 状态 MUST 变为 `QUOTING`
- **AND** 响应 MUST 包含 quote 金额、税额、总额、交付日期、供应商评分、风险备注、附件元数据、可下载标记和更新时间戳

#### Scenario: 更新现有供应商 quote
- **WHEN** 采购用户为同一 RFQ 上已有 quote 的供应商记录新的 quote payload
- **THEN** 系统 MUST 更新当前有效 quote，而不是创建重复有效 quote
- **AND** RFQ 对比响应 MUST 使用更新后的 quote 值
- **AND** quote 的已上传附件关联 MUST 替换为更新请求中提供的有效已上传附件 ID

#### Scenario: 拒绝非受邀供应商 quote
- **WHEN** 采购用户尝试为未受邀到 RFQ 的供应商记录 quote
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化 quote 或附件元数据

#### Scenario: 关联已上传报价附件
- **WHEN** 采购用户在记录 quote 时包含已上传附件 ID
- **THEN** 系统 MUST 校验每个附件都是 `READY`、用途为 `RFQ_QUOTE`、属于相同 `companyId`、`rfqId` 和 `supplierId`，且未链接到其他不兼容目标
- **AND** 系统 MUST 使用已上传对象的元数据和 storage key 持久化 quote 附件关联

#### Scenario: 拒绝无效报价附件引用
- **WHEN** 采购用户记录 quote 时使用未知附件 ID、仅元数据附件、跨公司附件，或为其他 RFQ 或供应商上传的附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝 quote 请求
- **AND** 现有 quote 和附件关联 MUST 保持不变

#### Scenario: 为现有演示数据保留仅元数据报价附件
- **WHEN** RFQ quote 已经存在没有 MinIO object key 的附件元数据
- **THEN** 系统 MUST 在 quote 详情和对比响应中继续返回该元数据
- **AND** 附件 MUST 标记为不可下载

### Requirement: RFQ API 暴露公司级列表、详情和对比数据
系统 SHALL 暴露 RFQ REST API，返回按公司归属隔离且可用于当前演示安全模型的 RFQ 列表、详情、quote、附件和对比数据。

#### Scenario: 列出一个公司的 RFQ
- **WHEN** 调用方请求 `GET /api/rfqs?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的 RFQ
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的 RFQ

#### Scenario: 查询 RFQ 详情
- **WHEN** 调用方请求现有 RFQ 的 `GET /api/rfqs/{rfqId}`
- **THEN** 系统 MUST 返回 RFQ 头、来源采购申请摘要、审批摘要、受邀供应商、当前 quote、已上传和仅元数据附件元数据、状态和时间戳

#### Scenario: 比较供应商 quote
- **WHEN** 调用方对至少有两个有效 quote 的 RFQ 请求 `GET /api/rfqs/{rfqId}/comparison`
- **THEN** 系统 MUST 返回按确定性推荐排序排列的 quote 对比行
- **AND** 每行 MUST 包含供应商、quote 金额、税额、总额、交付日期、供应商评分、风险等级、风险备注、排序，以及带可下载标记的附件元数据

#### Scenario: 未知公司列表请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求 RFQ 列表
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

#### Scenario: Swagger 记录 RFQ 端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含 RFQ 创建、列表、详情、quote upsert、对比和 RFQ 附件引用结构

#### Scenario: 演示前端可以调用 RFQ API
- **WHEN** 前端在当前 skeleton 环境中调用 RFQ GET、POST 和 PUT 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司、采购用户、采购申请、审批、RFQ、供应商和附件归属或范围

### Requirement: 前端提供 RFQ 流程
前端 SHALL 在采购工作台中提供真实 RFQ 页面，用于从已审批采购申请创建 RFQ、选择供应商、上传报价附件、记录 quote 和对比供应商响应。

#### Scenario: 打开 RFQ 页面
- **WHEN** 用户在工作台导航中选择“询报价”
- **THEN** 系统 MUST 打开 `/rfqs` 页面
- **AND** 页面 MUST 从后端 API 加载 RFQ、已审批采购申请、供应商、quote 和附件数据，而不是静态 mock 数据

#### Scenario: 从前端基于已审批申请创建 RFQ
- **WHEN** 采购用户选择已审批采购申请、选择有效供应商并提交 RFQ 表单
- **THEN** 前端 MUST 调用 RFQ 创建 API
- **AND** 新 RFQ MUST 出现在 RFQ 列表中，并展示其后端 `rfqId`、来源 `requestId`、供应商数量和 `ISSUED` 状态

#### Scenario: 从前端记录 quote
- **WHEN** 采购用户打开 RFQ 详情、为受邀供应商上传或选择有效报价附件并记录 quote 数据
- **THEN** 前端 MUST 按需调用附件上传 API，然后用已上传附件 ID 调用 quote upsert API
- **AND** RFQ 详情和对比视图 MUST 刷新，以展示已保存 quote 和后端附件元数据

#### Scenario: 查看对比和推荐
- **WHEN** RFQ 至少有两个有效供应商 quote
- **THEN** 前端 MUST 展示对比表，包含价格、税、交付日期、供应商评分、风险等级、风险备注、附件元数据、下载可用性和推荐排序
- **AND** 排名最高的 quote MUST 能被视觉识别，且不创建采购订单

#### Scenario: 在 RFQ 详情中防护不可用附件操作
- **WHEN** 附件仅有元数据、属于另一个供应商上下文，或仍在上传
- **THEN** 前端 MUST 禁用无效下载或保存操作，并给出客户端可见原因
- **AND** 它 MUST 仍然依赖后端校验进行最终强制约束

### Requirement: RFQ 不实现下游采购或 AI 流程
系统 SHALL 将 RFQ 聚焦在询价、已上传报价附件和 quote 对比，并且 SHALL NOT 创建下游采购执行记录或 AI 生成决策。

#### Scenario: RFQ 对比不创建采购订单
- **WHEN** RFQ 到达 `COMPARISON_READY` 或返回排名最高 quote
- **THEN** 系统 MUST NOT 创建采购订单、收货、发票、匹配记录、供应商门户任务或 AI 建议
- **AND** RFQ 对比结果 MUST 保持为现有 PO 切片的输入

#### Scenario: RFQ 上传流程只使用必需存储基础设施
- **WHEN** 开发者在 MVP 本地环境中用真实报价附件运行 RFQ 流程
- **THEN** 流程 MUST 使用 MySQL、同步 service 调用和 MinIO 对象存储
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek
