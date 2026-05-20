## ADDED Requirements

### Requirement: RFQ 从已审批采购申请创建
系统 SHALL 只允许采购用户在相关审批实例到达 `APPROVED` 后，从采购申请创建正好一个公司级 RFQ。

#### Scenario: 从已审批数字公司 IT 硬件申请创建 RFQ
- **WHEN** `company-digital` 的采购用户为一个已审批的 `company-digital` 采购申请创建 RFQ，且品类为 `category-it-hardware`
- **THEN** 系统 MUST 持久化状态为 `ISSUED` 的 RFQ
- **AND** RFQ MUST 引用来源 `requestId`、`approvalId`、`companyId`、申请人、采购用户、品类、预算科目、总金额、币种、期望交付日期和明细快照
- **AND** 响应 MUST 返回稳定的 `rfqId`

#### Scenario: 审批完成前拒绝创建 RFQ
- **WHEN** 采购用户尝试为审批实例为 `IN_PROGRESS`、`REJECTED` 或 `WITHDRAWN` 的采购申请创建 RFQ
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化 RFQ、RFQ 供应商邀请、quote、采购订单、收货、发票或匹配记录

#### Scenario: 拒绝为跨公司申请创建 RFQ
- **WHEN** `company-digital` 的采购用户尝试为属于 `company-manufacturing` 的采购申请创建 RFQ
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

#### Scenario: 拒绝同一采购申请重复创建 RFQ
- **WHEN** 已审批采购申请已经存在 RFQ
- **THEN** 同一 `requestId` 的第二次创建请求 MUST 以冲突语义的 4xx 错误被拒绝
- **AND** 现有 RFQ MUST 保持不变

### Requirement: RFQ 邀请集团共享供应商池中的供应商
系统 SHALL 允许 RFQ 包含来自集团级共享供应商池的候选供应商，同时保持 RFQ 本身归属于来源采购申请公司。

#### Scenario: 为数字公司 IT 硬件 RFQ 邀请三家供应商
- **WHEN** 采购用户为 `category-it-hardware` 采购申请创建 RFQ，并从集团共享供应商池选择三个有效供应商标识
- **THEN** 系统 MUST 为每个所选供应商持久化一条邀请行
- **AND** 每条邀请 MUST 快照用于对比的供应商名称、风险等级、服务范围和品类覆盖

#### Scenario: 拒绝不覆盖申请品类的供应商
- **WHEN** 采购用户选择的供应商品类覆盖不包含采购申请品类
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝 RFQ 创建请求
- **AND** 系统 MUST NOT 持久化部分 RFQ

#### Scenario: 拒绝重复供应商选择
- **WHEN** 采购用户提交的 RFQ 创建请求中同一个 `supplierId` 出现多次
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 错误 MUST 指明供应商选择必须唯一

### Requirement: 采集受邀供应商 quote
系统 SHALL 允许采购用户为每个受邀供应商记录当前有效 quote，包括金额、税、交付、评分、风险备注和附件元数据占位。

#### Scenario: 记录受邀供应商 quote
- **WHEN** 采购用户在 `ISSUED` RFQ 上为受邀供应商记录 quote，并提供 quote 金额、税率、交付日期、供应商评分、风险备注和附件文件元数据
- **THEN** 系统 MUST 为该 `rfqId` 和 `supplierId` 持久化 quote
- **AND** RFQ 状态 MUST 变为 `QUOTING`
- **AND** 响应 MUST 包含 quote 金额、税额、总额、交付日期、供应商评分、风险备注、附件元数据和更新时间戳

#### Scenario: 更新现有供应商 quote
- **WHEN** 采购用户为同一 RFQ 上已有 quote 的供应商记录新的 quote payload
- **THEN** 系统 MUST 更新当前有效 quote，而不是创建重复有效 quote
- **AND** RFQ 对比响应 MUST 使用更新后的 quote 值

#### Scenario: 拒绝非受邀供应商 quote
- **WHEN** 采购用户尝试为未受邀到 RFQ 的供应商记录 quote
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 持久化 quote 或附件元数据

#### Scenario: 存储附件元数据但不上传对象
- **WHEN** 采购用户在 quote 中包含附件文件名、描述、content type 和大小元数据
- **THEN** 系统 MUST 将元数据与 quote 一起存储
- **AND** 系统 MUST NOT 在本 change 中要求 MinIO object key 或上传文件字节

### Requirement: RFQ API 暴露公司级列表、详情和对比数据
系统 SHALL 暴露 RFQ REST API，返回按公司归属隔离且可用于当前演示安全模型的 RFQ 列表、详情、quote 和对比数据。

#### Scenario: 列出一个公司的 RFQ
- **WHEN** 调用方请求 `GET /api/rfqs?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的 RFQ
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的 RFQ

#### Scenario: 查询 RFQ 详情
- **WHEN** 调用方请求现有 RFQ 的 `GET /api/rfqs/{rfqId}`
- **THEN** 系统 MUST 返回 RFQ 头、来源采购申请摘要、审批摘要、受邀供应商、当前 quote、附件元数据占位、状态和时间戳

#### Scenario: 比较供应商 quote
- **WHEN** 调用方对至少有两个有效 quote 的 RFQ 请求 `GET /api/rfqs/{rfqId}/comparison`
- **THEN** 系统 MUST 返回按确定性推荐排序排列的 quote 对比行
- **AND** 每行 MUST 包含供应商、quote 金额、税额、总额、交付日期、供应商评分、风险等级、风险备注和排序

#### Scenario: 未知公司列表请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求 RFQ 列表
- **THEN** 系统 MUST 返回客户端可见错误，而不是回退到默认公司

#### Scenario: Swagger 记录 RFQ 端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含 RFQ 创建、列表、详情、quote upsert 和对比端点

#### Scenario: 演示前端可以调用 RFQ API
- **WHEN** 前端在当前 skeleton 环境中调用 RFQ GET、POST 和 PUT 端点
- **THEN** Spring Security MUST 允许不带 JWT 调用
- **AND** service layer MUST 仍然校验明确的公司、采购用户、采购申请、审批、RFQ 和供应商归属或范围

### Requirement: 前端提供 RFQ 流程
前端 SHALL 在采购工作台中提供真实 RFQ 页面，用于从已审批采购申请创建 RFQ、选择供应商、记录 quote 和对比供应商响应。

#### Scenario: 打开 RFQ 页面
- **WHEN** 用户在工作台导航中选择“询报价”
- **THEN** 系统 MUST 打开 `/rfqs` 页面
- **AND** 页面 MUST 从后端 API 加载 RFQ、已审批采购申请、供应商和 quote 数据，而不是静态 mock 数据

#### Scenario: 从前端基于已审批申请创建 RFQ
- **WHEN** 采购用户选择已审批采购申请、选择有效供应商并提交 RFQ 表单
- **THEN** 前端 MUST 调用 RFQ 创建 API
- **AND** 新 RFQ MUST 出现在 RFQ 列表中，并展示其后端 `rfqId`、来源 `requestId`、供应商数量和 `ISSUED` 状态

#### Scenario: 从前端记录 quote
- **WHEN** 采购用户打开 RFQ 详情并为受邀供应商记录 quote 数据
- **THEN** 前端 MUST 调用 quote upsert API
- **AND** RFQ 详情和对比视图 MUST 刷新，以展示已保存 quote

#### Scenario: 查看对比和推荐
- **WHEN** RFQ 至少有两个有效供应商 quote
- **THEN** 前端 MUST 展示对比表，包含价格、税、交付日期、供应商评分、风险等级、风险备注、附件元数据和推荐排序
- **AND** 排名最高的 quote MUST 能被视觉识别，且不创建采购订单

### Requirement: RFQ 不实现下游采购或 AI 流程
系统 SHALL 将 RFQ 聚焦在询价和 quote 对比，并且 SHALL NOT 创建下游采购执行记录或 AI 生成决策。

#### Scenario: RFQ 对比不创建采购订单
- **WHEN** RFQ 到达 `COMPARISON_READY` 或返回排名最高 quote
- **THEN** 系统 MUST NOT 创建采购订单、收货、发票、匹配记录、供应商门户任务或 AI 建议
- **AND** RFQ 对比结果 MUST 保持为后续 PO 切片的输入

#### Scenario: RFQ 不需要延期基础设施
- **WHEN** 开发者在 MVP 本地环境中运行 RFQ 流程
- **THEN** 流程 MUST 使用 MySQL 和同步 service 调用
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin 或 Keycloak
