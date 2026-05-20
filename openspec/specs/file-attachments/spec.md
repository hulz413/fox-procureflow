# file-attachments 规格

## Purpose

定义采购流程共享的真实文件附件能力，覆盖 MinIO 对象存储、公司级 MySQL 元数据、列表/下载 API、业务关联校验，以及 RFQ 报价、收货和供应商发票场景中的前端上传/下载行为。

## Requirements

### Requirement: 附件上传到对象存储并带公司级元数据
系统 SHALL 允许采购用户将真实业务附件上传到 MinIO，同时在 MySQL 中持久化公司级元数据。

#### Scenario: 为数字公司上传 RFQ 报价附件
- **WHEN** 用户为 `company-digital` 上传 PDF 报价文件，目标类型为 `RFQ_QUOTE`，并提供目标 RFQ `RFQ-20260518-0301`、目标供应商、文件名、content type、文件大小和可选描述
- **THEN** 系统 MUST 校验该 RFQ 属于 `company-digital`，且供应商已被邀请到该 RFQ
- **AND** 系统 MUST 将文件字节存储到配置的 RFQ MinIO bucket
- **AND** 系统 MUST 持久化附件元数据，包括 `company-digital`、bucket、object key、原始文件名、content type、大小、用途、目标标识、上传人、状态 `READY` 和时间戳
- **AND** 响应 MUST 返回稳定的 `attachmentId`

#### Scenario: 为制造公司上传收货凭证
- **WHEN** 用户为 `company-manufacturing` 上传图片或 PDF 收货凭证，目标类型为 `RECEIPT`，并提供有效已发布 PO 上下文、文件名、content type、文件大小和可选描述
- **THEN** 系统 MUST 校验 PO 和未来收货上下文属于 `company-manufacturing`
- **AND** 系统 MUST 将文件字节存储到配置的 receipt/invoice MinIO bucket
- **AND** 附件元数据 MUST 仅在 `company-manufacturing` 范围读请求中可见

#### Scenario: 拒绝不支持的文件类型或过大文件
- **WHEN** 用户上传的文件 content type 不在配置 allowlist 内，或大小超过配置的附件大小限制
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝上传
- **AND** 系统 MUST NOT 持久化附件元数据或业务附件关联
- **AND** 系统 MUST NOT 为该失败上传暴露可下载对象

#### Scenario: 拒绝跨公司附件目标
- **WHEN** `company-digital` 用户尝试为属于 `company-manufacturing` 的 RFQ、收货、发票或 PO 上下文上传附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝上传
- **AND** 系统 MUST NOT 回退到活跃演示公司
- **AND** 系统 MUST NOT 将 MinIO object key 关联到 `company-digital`

#### Scenario: 对象存储失败不创建 ready 元数据
- **WHEN** MinIO 上传在请求校验成功后失败
- **THEN** 系统 MUST 返回客户端可见错误
- **AND** 系统 MUST NOT 创建 `READY` 附件元数据记录
- **AND** 目标 RFQ quote、收货或发票 MUST 保持不变

### Requirement: 附件 API 暴露公司级列表和下载操作
系统 SHALL 暴露 REST API，只有在明确公司归属校验后才允许列出和下载附件。

#### Scenario: 列出某个 RFQ quote 的附件
- **WHEN** 调用方请求 `companyId=company-digital` 的 RFQ quote 附件
- **THEN** 系统 MUST 仅返回元数据和目标 RFQ quote 都属于 `company-digital` 的附件
- **AND** 每个附件行 MUST 包含 `attachmentId`、原始文件名、描述、content type、大小、存储状态、可下载标记、上传用户和时间戳
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的附件

#### Scenario: 公司校验后下载附件
- **WHEN** 调用方请求 `GET /api/attachments/{attachmentId}/download?companyId=company-digital` 下载属于 `company-digital` 的 `READY` 附件
- **THEN** 系统 MUST 在读取 MinIO 前校验附件元数据、目标业务对象和公司归属
- **AND** 响应 MUST 使用已存储的 content type 和原始文件名流式返回对象字节

#### Scenario: 拒绝跨公司下载
- **WHEN** 调用方使用 `companyId=company-digital` 请求下载 `company-manufacturing` 附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 从 MinIO 读取对象字节

#### Scenario: 仅元数据附件不可下载
- **WHEN** 现有附件记录只有文件元数据但没有存储 object key
- **THEN** 系统 MUST 在业务详情响应中返回该附件，并设置 `downloadable=false`
- **AND** 系统 MUST 拒绝该附件的下载请求，并给出文件仅有元数据的客户端可见原因

### Requirement: 附件关联只能由匹配的业务流程接收
系统 SHALL 允许 RFQ quote、收货和发票流程只关联同一公司、目标类型和业务对象匹配的已上传附件。

#### Scenario: 将已上传附件关联到 RFQ quote
- **WHEN** 采购用户为受邀供应商保存 quote，并引用一个或多个已上传的 `RFQ_QUOTE` attachment ID
- **THEN** 系统 MUST 校验每个附件都是 `READY`，并且属于相同 `companyId`、RFQ 和供应商上下文
- **AND** quote 响应 MUST 包含已上传附件，并标记 `downloadable=true`

#### Scenario: 将已上传附件关联到收货
- **WHEN** 仓库或采购用户创建收货并引用已上传的 `RECEIPT` attachment ID
- **THEN** 系统 MUST 校验每个附件与收货属于相同 `companyId` 和 PO 上下文
- **AND** 收货响应 MUST 包含已上传附件，并标记 `downloadable=true`

#### Scenario: 将已上传附件关联到供应商发票
- **WHEN** 财务或采购用户创建供应商发票并引用已上传的 `INVOICE` attachment ID
- **THEN** 系统 MUST 校验每个附件与发票属于相同 `companyId`、PO 和供应商上下文
- **AND** 发票响应 MUST 包含已上传附件，并标记 `downloadable=true`

#### Scenario: 拒绝跨不兼容目标复用附件
- **WHEN** 用户在保存 RFQ quote 时引用 `RECEIPT` attachment ID，或引用已关联到另一个公司归属目标的附件
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝业务请求
- **AND** 现有附件关联 MUST 保持不变

### Requirement: 前端使用真实附件上传和下载控件
前端 SHALL 在 RFQ 和收货发票流程中提供真实上传和下载控件，而不是使用静态 mock 文件。

#### Scenario: 从 RFQ 详情上传并关联报价文件
- **WHEN** 采购用户打开 RFQ 详情、选择受邀供应商、上传报价文件并保存 quote 数据
- **THEN** 前端 MUST 在 quote upsert 前调用附件上传 API
- **AND** quote upsert 请求 MUST 引用返回的 `attachmentId`
- **AND** RFQ 详情和对比视图 MUST 刷新，以展示后端附件元数据和下载操作

#### Scenario: 上传并关联收货和发票文件
- **WHEN** 仓库或财务用户从收货发票工作台创建收货或供应商发票并上传文件
- **THEN** 前端 MUST 调用附件上传 API，并在业务表单中只提交后端 `attachmentId` 引用
- **AND** 收货或发票列表与详情抽屉 MUST 刷新，以展示后端附件状态

#### Scenario: 为仅元数据附件展示禁用下载原因
- **WHEN** 附件行仅有元数据或不可下载
- **THEN** 前端 MUST 禁用下载操作
- **AND** 禁用控件 MUST 提供 tooltip，解释具体原因

#### Scenario: 离开已上传但未保存附件前确认
- **WHEN** 用户在可编辑 RFQ quote、收货或发票表单中已上传附件但尚未保存业务对象，然后关闭、切换选中行或离开当前编辑对象
- **THEN** 前端 MUST 在丢弃当前编辑上下文前显示确认提示
