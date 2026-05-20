# three-way-matching 规格

## Purpose

定义基于 PO 的三单匹配能力，覆盖 Fox Procureflow 的公司级匹配结果、确定性差异检测、异常处理审计记录、API、前端工作台行为，以及排除延期基础设施、付款、上传和 AI 流程的边界。

## Requirements

### Requirement: 三单匹配结果从已发布采购订单计算
系统 SHALL 基于已发布采购订单、累计收货明细和累计供应商发票明细计算公司级三单匹配结果。

#### Scenario: 为输入不完整的已发布 PO 创建待输入匹配结果
- **WHEN** 匹配服务重新计算一个没有收货或发票数据的 `ISSUED` `company-digital` 采购订单
- **THEN** 系统 MUST 为该 `poId` 持久化或更新一个当前匹配结果
- **AND** 匹配结果 MUST 状态为 `PENDING_INPUT`
- **AND** 匹配结果 MUST 引用 `company-digital`、来源 `poId`、供应商、PO 金额和最后计算时间戳

#### Scenario: 为完全收货和开票的 PO 计算匹配成功结果
- **WHEN** 匹配服务重新计算 `ISSUED` 采购订单，且其 PO 明细数量等于累计收货数量和累计开票数量，并且发票总金额等于 PO 总金额
- **THEN** 匹配结果 MUST 状态为 `MATCHED`
- **AND** 匹配结果 MUST 没有当前差异项
- **AND** 结果 MUST 继续隔离在来源采购订单公司范围内

#### Scenario: 匹配时忽略草稿或已取消 PO
- **WHEN** 调用方尝试为 `DRAFT` 或 `CANCELLED` 采购订单重算匹配
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 为该采购订单创建或更新匹配结果、差异项或处理记录

#### Scenario: 幂等重算匹配
- **WHEN** 匹配服务在来源 PO、收货或发票未变化的情况下两次重新计算同一个 `company-digital` 采购订单
- **THEN** 系统 MUST 为该 `poId` 保持正好一个当前匹配结果
- **AND** 系统 MUST NOT 复制当前差异项
- **AND** 现有手工处理记录 MUST 仍在匹配详情中可用

### Requirement: 匹配差异识别数量和金额异常
系统 SHALL 在 PO、收货和发票数据不一致时持久化当前差异项。

#### Scenario: 检测发票金额高于 PO
- **WHEN** `company-digital` 供应商发票总额在重算后比来源采购订单总额高 2,300
- **THEN** 匹配结果 MUST 状态为 `EXCEPTION`
- **AND** 系统 MUST 持久化 `INVOICE_AMOUNT_MISMATCH` 差异项，包含 PO 金额、发票金额、差异金额、币种和严重程度
- **AND** 匹配结果 MUST 出现在公司异常队列中

#### Scenario: 检测发票数量大于收货数量
- **WHEN** 采购订单明细的累计开票数量大于累计收货数量
- **THEN** 匹配结果 MUST 状态为 `EXCEPTION`
- **AND** 系统 MUST 持久化引用来源 `poLineId` 的 `INVOICE_QUANTITY_OVER_RECEIPT` 差异项
- **AND** 差异项 MUST 包含订购数量、收货数量、开票数量、单位和明细快照

#### Scenario: 检测有发票但无收货
- **WHEN** 已发布采购订单有供应商发票明细但没有对应收货明细
- **THEN** 匹配结果 MUST 状态为 `EXCEPTION`
- **AND** 系统 MUST 持久化 `MISSING_RECEIPT` 差异项
- **AND** 异常队列 MUST 展示采购订单供应商和发票摘要，供财务复核

#### Scenario: 已收货但未开票 PO 保持待输入
- **WHEN** 已发布采购订单有收货明细但没有供应商发票明细
- **THEN** 匹配结果 MUST 状态为 `PENDING_INPUT`
- **AND** 系统 MUST NOT 将该结果包含在默认异常队列中
- **AND** 匹配详情 MUST 暴露缺少发票状态以便跟进

### Requirement: 匹配 API 暴露公司级列表、异常、详情、重算和操作
系统 SHALL 暴露三单匹配 REST API，返回公司级数据，支持当前演示安全模型，并在 service layer 校验归属。

#### Scenario: 列出一个公司的匹配结果
- **WHEN** 调用方请求 `GET /api/three-way-matching?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的匹配结果
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的匹配结果

#### Scenario: 列出一个公司的匹配异常
- **WHEN** 调用方请求 `GET /api/three-way-matching/exceptions?companyId=company-digital`
- **THEN** 系统 MUST 仅返回属于 `company-digital` 的 `EXCEPTION` 匹配结果
- **AND** 每个结果 MUST 包含 PO 摘要、供应商、差异数量、最高严重程度、发票差异和最后计算时间戳

#### Scenario: 查询匹配详情
- **WHEN** 调用方对现有公司归属结果请求 `GET /api/three-way-matching/{matchId}?companyId=company-digital`
- **THEN** 系统 MUST 返回匹配结果、来源 PO 摘要、收货摘要、发票摘要、当前差异项、处理记录、状态和时间戳

#### Scenario: 通过 API 重算匹配
- **WHEN** 调用方提交 `POST /api/three-way-matching/recalculate`，包含有效 `companyId`、`poId` 和同公司操作者
- **THEN** 系统 MUST 为该已发布采购订单重新计算当前匹配结果
- **AND** 响应 MUST 返回更新后的匹配详情

#### Scenario: 拒绝跨公司匹配访问
- **WHEN** `company-digital` 的调用方请求、重算或处理属于 `company-manufacturing` 的匹配结果
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

#### Scenario: Swagger 记录匹配端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含匹配列表、异常列表、详情、重算和操作端点及其请求/响应结构

### Requirement: 匹配异常可通过可审计操作处理
系统 SHALL 允许归属公司内的财务或采购操作者向匹配异常追加处理动作，而不变更来源 PO、收货或发票记录。

#### Scenario: 确认匹配异常
- **WHEN** 来自匹配结果所属公司的有效操作者为 `EXCEPTION` 结果提交带处理备注的 `ACKNOWLEDGE` 动作
- **THEN** 系统 MUST 追加包含操作者、动作类型、备注和时间戳的处理记录
- **AND** 匹配详情 MUST 展示该处理记录

#### Scenario: 解决匹配异常
- **WHEN** 来自匹配结果所属公司的有效操作者为 `EXCEPTION` 结果提交带必填解决备注的 `RESOLVE` 动作
- **THEN** 匹配结果状态 MUST 变为 `RESOLVED`
- **AND** 系统 MUST 追加包含解决备注的处理记录
- **AND** 系统 MUST NOT 修改来源采购订单、收货、发票或附件元数据记录

#### Scenario: 来源数据变化后重新打开已解决异常
- **WHEN** `RESOLVED` 匹配结果在新收货或发票数据产生当前差异后被重算
- **THEN** 匹配结果状态 MUST 变为 `EXCEPTION`
- **AND** 先前处理记录 MUST 按时间顺序保持可见

#### Scenario: 拒绝没有公司归属操作者的处理动作
- **WHEN** 调用方提交匹配处理动作，但操作者未知或来自另一公司
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 追加处理记录

### Requirement: 前端提供三单匹配工作台
前端 SHALL 在采购工作台中提供真实三单匹配页面，用于查看匹配状态、分诊异常、查看详情和记录处理动作。

#### Scenario: 打开三单匹配页面
- **WHEN** 用户在工作台导航中选择“三单匹配”
- **THEN** 系统 MUST 打开 `/three-way-matching` 页面
- **AND** 页面 MUST 从后端 API 加载匹配结果和异常数据，而不是静态 mock 数据

#### Scenario: 查看匹配总览和异常队列
- **WHEN** 三单匹配页面为 `company-digital` 加载
- **THEN** 页面 MUST 展示公司级已匹配、待输入、异常和已解决结果总数
- **AND** 异常队列 MUST 至少为每个后端结果展示 PO 编号、供应商、状态、最高严重程度、差异数量、发票差异和最后计算时间戳

#### Scenario: 查看匹配详情
- **WHEN** 用户从列表选择匹配结果
- **THEN** 前端 MUST 展示来自后端 API 的 PO 摘要、供应商、订购数量、收货数量、开票数量、PO 金额、发票金额、差异项和处理记录

#### Scenario: 从前端处理异常
- **WHEN** 用户从详情视图提交允许的处理动作和有效备注
- **THEN** 前端 MUST 调用匹配操作 API
- **AND** 匹配列表和详情视图 MUST 刷新，以展示更新后的状态和处理记录

#### Scenario: 前端防护不可用处理动作
- **WHEN** 匹配结果为 `MATCHED`、`PENDING_INPUT` 或已经 `RESOLVED`
- **THEN** 前端 MUST 禁用无效处理动作，并提供解释原因的客户端可见 tooltip
- **AND** 它 MUST 仍然依赖后端校验进行最终强制约束

#### Scenario: 丢弃未保存处理备注前确认
- **WHEN** 用户已输入未保存处理备注并关闭详情抽屉、切换选中行或离开当前处理对象
- **THEN** 前端 MUST 在丢弃未保存输入前显示确认

### Requirement: 三单匹配不实现延期基础设施、付款、上传或 AI 流程
系统 SHALL 将本 change 聚焦在确定性三单匹配，并且 SHALL NOT 创建付款、对象存储、异步消息或 AI 生成决策。

#### Scenario: 匹配流程不需要延期基础设施
- **WHEN** 开发者在 MVP 本地环境中运行三单匹配流程
- **THEN** 流程 MUST 使用 MySQL 和同步 service 调用
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek

#### Scenario: 匹配异常处理不创建付款或 AI 决策
- **WHEN** 用户解决匹配异常
- **THEN** 系统 MUST NOT 创建付款记录、供应商门户任务、RabbitMQ events、已上传文件或 AI 建议
- **AND** 匹配处理记录 MUST 保持为审计备注，而不是自动财务结算
