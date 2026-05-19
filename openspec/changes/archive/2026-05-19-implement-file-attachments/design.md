## Context

Fox Procureflow 已经完成采购申请、审批、RFQ、PO、收货、发票、三单匹配、看板、AI 助手和供应商池。当前 RFQ 报价、收货单和供应商发票都可以记录附件文件名、说明、content type、size 和 nullable `storage_object_key`，但没有真实上传、下载或对象存储校验。

本 change 把 roadmap 后段的真实附件上传落地到三个演示对象：

- RFQ 供应商报价单。
- PO 收货凭证。
- 供应商发票文件。

多公司边界仍然是核心约束：供应商池是集团共享主数据，RFQ、PO、收货、发票和附件元数据都归属具体 `companyId`。本地基础设施已经预留 MinIO，并由 `infra/docker-compose.yml` 创建 `rfq-attachments` 和 `invoice-files` bucket。

## Goals / Non-Goals

**Goals:**

- 使用 MinIO 存储真实文件字节，使用 MySQL 存储附件元数据和业务关联。
- 为 RFQ 报价、收货单和供应商发票提供上传、列表和下载能力。
- 保持公司级数据隔离：上传、关联、列表和下载都必须验证显式 `companyId` 与目标业务对象归属。
- 在现有 RFQ 和 收货发票工作台中替换“手填附件文件名”为真实上传控件，同时继续展示历史 metadata-only demo 附件。
- 在 Swagger、后端测试和前端测试中覆盖大小、类型、业务目标、对象存储失败和跨公司访问边界。

**Non-Goals:**

- 不给采购申请 Intake 回补真实附件上传。
- 不实现供应商门户、外部匿名上传、直接前端 presigned PUT、对象版本管理、文件预览、病毒扫描、OCR 或发票验真。
- 不新增付款、库存入库、质检、退货、红冲、RabbitMQ 事件、Redis 缓存、Prometheus/Grafana/Jaeger/Zipkin/Keycloak。
- 不让 AI 读取附件正文或基于附件内容自动决策。

## Decisions

1. **新增统一 file attachment capability，业务模块只持有附件引用。**

   新增 `file-attachments` 后端模块，负责 MinIO client、bucket 初始化校验、上传、下载、元数据校验和通用 API。RFQ、收货和发票模块继续保留自己的业务附件表，用于表达业务上下文和现有 DTO，但真实文件元数据统一落在新的 attachment 记录中，并通过 `attachment_id` 或 `storage_object_key` 与业务表关联。

   Alternative considered: 分别在 RFQ、receipt、invoice service 内各自接 MinIO。这个方案改动局部更少，但会重复文件校验、对象 key 生成、下载鉴权和错误处理，后续如果要加删除/审计会变散。

2. **复用现有 bucket 约定，按业务对象生成不可猜测 object key。**

   RFQ 报价附件使用 `rfq-attachments`，收货凭证和发票文件使用 `invoice-files`。`procurement-attachments` 保持预留，不在本 change 中用于采购申请。

   object key 建议格式：

   - `companies/{companyId}/rfqs/{rfqId}/quotes/{quoteId}/{attachmentId}-{safeFileName}`
   - `companies/{companyId}/receipts/{receiptId}/{attachmentId}-{safeFileName}`
   - `companies/{companyId}/invoices/{invoiceId}/{attachmentId}-{safeFileName}`

   `attachmentId` 由后端生成，文件名只做安全化后的展示辅助，不作为权限边界。

   Alternative considered: 直接使用原始文件名作为 object key。这个容易冲突，也会泄露业务语义；带 company 和业务对象路径的 key 更利于排查，同时 attachmentId 保证唯一。

3. **后端接收 multipart 上传并流式写入 MinIO，下载由后端鉴权后流式返回。**

   上传 API 使用 `multipart/form-data`，请求包含 `companyId`、`targetType`、目标 ID、可选说明和文件。服务层先验证公司与目标业务对象，再用 MinIO Java SDK `putObject` 写入对象，并把 bucket、object key、original filename、content type、size、etag/status 和 uploader 快照写入 MySQL。

   下载走 `GET /api/attachments/{attachmentId}/download?companyId=`。后端先按 metadata 校验 company，再用 MinIO `getObject` 读取流并返回文件响应。这样比直接把 MinIO presigned URL 暴露给前端更符合当前 demo security model，也便于统一跨公司访问控制。

   Alternative considered: 前端直接拿 presigned PUT/GET URL。它更接近大文件生产架构，但当前 MVP 没有 JWT 和细粒度权限；先由后端代理能更清楚地展示业务鉴权边界。

4. **上传与业务单据保存采用“先上传、后引用”的一致性边界。**

   RFQ 报价、收货和发票表单先上传文件，得到 `attachmentId`，再在 quote/receipt/invoice 创建或更新请求中引用。业务 service 只接受属于同一 company、同一 target/purpose 且状态为 `READY` 的附件。

   如果 MinIO 上传失败，不创建 attachment metadata。若 metadata 保存失败，则尝试删除刚上传的对象；删除失败时记录 `ORPHANED` 状态供后续人工清理，但不把附件暴露给业务单据。业务单据事务失败时，未关联附件保持可见但状态为 `UPLOADED_UNLINKED` 或可被下一次保存引用；本 change 不做自动后台清理。

   Alternative considered: 在 quote/receipt/invoice 创建请求里同时上传文件和保存单据。这样前端步骤少，但会把 multipart、业务校验和下游 matching refresh 混在一个事务边界里，失败路径更难解释。

5. **保留历史 metadata-only 附件的只读展示，不提供下载。**

   现有 seed 数据和已创建记录可能只有 `file_name`、`content_type`、`size_bytes`，没有 `storage_object_key` 或统一 attachment metadata。API 响应继续返回这些记录，但标记为 `downloadable=false` 或 `storageStatus=METADATA_ONLY`。前端显示文件名和说明，下载按钮禁用并给出 tooltip 原因。

   Alternative considered: 迁移时为历史附件生成空对象。空对象会让演示误以为文件真实存在，不如明确展示“历史元数据”。

6. **文件校验先做 MVP 白名单。**

   默认允许 `application/pdf`、常见 Office 文档、图片和纯文本，默认单文件上限建议 10 MB。实际值通过 `FOX_ATTACHMENT_MAX_SIZE_BYTES` 和 `FOX_ATTACHMENT_ALLOWED_CONTENT_TYPES` 配置覆盖。服务层同时校验文件非空、文件名长度、content type、target type、target ID 和 company ownership。

   Alternative considered: 完整 MIME sniffing 和病毒扫描。它们更适合生产文件治理，但超出 MVP；当前只做明确白名单和大小限制。

7. **前端在现有工作台内引入真实上传状态，不新增独立文件中心。**

   RFQ 报价录入区展示上传控件、上传进度、已上传附件列表、下载按钮和不可下载原因。收货/发票创建表单同样先上传，再随业务提交引用。详情与列表显示真实附件数量、文件名、大小、状态和下载动作。

   Alternative considered: 新增“附件管理”页面。MVP 演示更关注业务闭环中的单据附件，独立文件中心会把用户从采购流程里带走。

## Risks / Trade-offs

- [Risk] MinIO 对象写入成功但 MySQL metadata 保存失败会留下孤儿对象。 -> Mitigation: 保存失败后同步尝试删除对象；删除失败时记录可追踪状态和 object key，测试覆盖失败路径。
- [Risk] 后端代理下载会占用应用连接和内存。 -> Mitigation: 使用流式响应，不把文件读入内存；MVP 文件大小限制在较小范围内，后续生产可切换为鉴权后的短期 presigned GET。
- [Risk] 现有附件表分散在 RFQ、receipt、invoice 模块，统一 metadata 可能造成双写。 -> Mitigation: 新表作为真实文件事实源，业务表只保存业务关联和兼容字段；DTO 由服务层组合返回。
- [Risk] 跨公司下载泄露是高风险边界。 -> Mitigation: 所有 attachment APIs 必须显式传入 `companyId` 并以 metadata + 目标业务对象双重校验，不允许按 attachmentId 裸下载。
- [Risk] 前端上传后未保存业务单据会留下未关联附件。 -> Mitigation: UI 明确显示“已上传待保存”，关闭或切换编辑对象前沿用未保存确认；后端只让同一公司、同一 target 的待关联附件被后续请求引用。

## Migration Plan

1. 添加 MinIO Java SDK 依赖、`fox.procureflow.attachments` 配置、MinIO client bean 和 bucket startup 校验。
2. 添加 Flyway migration 创建统一 `file_attachments` 表，并给现有业务附件表补充必要的统一 `file_attachment_id` / status 关联字段，保持现有 nullable `storage_object_key` 兼容。
3. 新增 attachment service/controller/repository/DTO，提供 upload/list/download API 和 Swagger 文档。
4. 改造 RFQ quote upsert：接受已上传 attachment IDs，校验 quote/company/supplier/purpose 后关联并返回 downloadable 状态。
5. 改造 receipt/invoice 创建：接受已上传 attachment IDs，保持 matching refresh 的同步事务边界，失败时不留下业务关联。
6. 改造前端 RFQ 和 收货发票工作台上传、下载、禁用 tooltip、未保存确认和列表/详情显示。
7. 补充后端集成测试、OpenAPI 测试、前端组件/交互测试和 README/.env.example 的附件配置说明。

Rollback: 本 change 的 API、表和 object key 前缀独立于核心采购数据；回滚时停止前端上传入口和 attachment API，保留已有业务附件 metadata 只读显示，不删除已经上传到 MinIO 的对象。

## Open Questions

- 是否需要在 demo seed 中放入真实小样例文件并上传到 MinIO？建议实现阶段只 seed metadata，由手动演示上传真实文件，避免 migration 依赖对象存储。
- 下载接口返回后端流还是短期 presigned URL？本设计选择后端流；如果文件尺寸上限提高，可在后续 change 切到 presigned GET。
