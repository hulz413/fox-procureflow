## Context

Fox Procureflow 当前已经具备 P0 前半段：采购申请、审批、RFQ、PO 创建与发布。`purchase-orders` spec 明确把已发布 PO 作为后续收货、发票和三单匹配的稳定上游，但 PO 发布本身不创建下游记录。

本 change 补齐 PO 后续履约数据。核心约束保持不变：集团共享供应商池，采购执行数据按公司隔离；MVP 前中期继续使用 MySQL 和同步服务调用；RFQ、收货和发票的附件只记录元数据占位，不接入 MinIO；三单匹配和 AI 异常解释留给后续切片。

主要参与角色：

- 采购员：查看已发布 PO 和履约进度，协同收货/发票录入。
- 仓储人员：按 PO 明细登记实际收货数量、日期和凭证元数据。
- 财务人员：按 PO 明细登记供应商发票数量、金额、税额和附件元数据。

## Goals / Non-Goals

**Goals:**

- 为 `ISSUED` PO 创建公司隔离的收货单和供应商发票记录。
- 支持部分收货、部分开票和多次登记，并按 PO 明细聚合已收货数量、已开票数量和已开票金额。
- 在 API 和前端显示 PO 履约摘要，给后续三单匹配提供可查询的上游数据。
- 复用现有 demo 安全模型，同时在服务层校验公司、PO、明细、供应商和经办人归属。
- 提供多状态 demo 数据，让演示能看到未收货、部分收货、已收货、部分开票和金额异常提示。

**Non-Goals:**

- 不创建三单匹配结果、差异项、异常队列或处理记录。
- 不实现真实附件上传、MinIO object key 必填、文件下载或预览。
- 不实现付款、发票认证、供应商门户、库存入库、质检、退货或红冲。
- 不引入 RabbitMQ、Redis、MongoDB、DeepSeek、JWT 或复杂权限矩阵。
- 不修改 PO 的核心状态流；PO 仍只有当前的 DRAFT、ISSUED、CANCELLED。

## Decisions

1. **新增独立 receiving/invoice 模块，读取 PO 作为上游，不反写 PO 状态。**

   收货和发票数据放在新的采购执行模块中，依赖 `purchase_orders` 和 `purchase_order_lines` 的稳定快照。PO 履约进度通过查询聚合得出，而不是把 `PARTIALLY_RECEIVED`、`FULLY_INVOICED` 等状态写回 PO。

   Alternative considered: 扩展 `purchase_orders.status`。这个方案会把订单生命周期和履约汇总混在一起，后续三单匹配、取消和异常处理会更难表达。

2. **MySQL 表按单据头、明细、附件元数据拆分。**

   建议新增：

   - `purchase_receipts`: `receipt_id`、`company_id`、`po_id`、`supplier_id`、`received_by`、`received_date`、`status`、备注和时间字段。
   - `purchase_receipt_lines`: `receipt_line_id`、`receipt_id`、`po_id`、`po_line_id`、`line_no`、`received_quantity`、单位、备注。
   - `purchase_receipt_attachments`: `attachment_id`、`receipt_id`、文件名、说明、content type、size、nullable `storage_object_key`。
   - `supplier_invoices`: `invoice_id`、`company_id`、`po_id`、`supplier_id`、`invoice_number`、`invoice_date`、`registered_by`、金额合计、币种、状态、备注和时间字段。
   - `supplier_invoice_lines`: `invoice_line_id`、`invoice_id`、`po_id`、`po_line_id`、`line_no`、`invoiced_quantity`、未税金额、税率、税额、含税金额。
   - `supplier_invoice_attachments`: 与收货附件同样的元数据占位结构。

   Alternative considered: 单表 JSON 保存明细。这个方案短期快，但三单匹配需要按 PO 行聚合数量和金额，关系型明细表更适合后续查询与测试。

3. **只允许对已发布且同公司的 PO 登记收货和发票。**

   创建请求必须包含显式 `companyId`、`poId`、经办人和明细行。服务层校验：

   - `companyId` 存在。
   - PO 存在且 `purchaseOrder.companyId == companyId`。
   - PO 状态为 `ISSUED`。
   - 每个 `poLineId` 属于该 PO。
   - `receivedBy` 或 `registeredBy` 是该公司的 active demo user。
   - 发票 supplier 必须来自 PO 快照的 `supplierId`。

   Alternative considered: 前端只展示可选 PO 即可。这个不能保护 API 调用边界，也不符合当前 purchase request / RFQ / PO 的服务层校验风格。

4. **数量做累计上限校验，金额保留可解释偏差。**

   收货累计数量不得超过对应 PO 行数量。发票累计数量也不得超过 PO 行数量。发票金额允许与 PO 金额不完全一致，但服务层必须返回 PO 汇总中的 `invoiceVarianceAmount` 和 `invoiceAmountStatus`，用于演示“发票金额偏差”而不提前创建三单匹配异常。

   Alternative considered: 发票金额也强制等于 PO。这样会失去后续三单匹配的核心演示数据；MVP 需要能录入异常事实，再由匹配切片识别和处理。

5. **API 保持公司级列表 + 单据详情 + PO 履约摘要三类读写面。**

   建议 endpoints：

   - `GET /api/receipts?companyId=&poId=`：公司级或 PO 级收货列表。
   - `GET /api/receipts/{receiptId}?companyId=`：收货详情。
   - `POST /api/receipts`：创建收货单。
   - `GET /api/invoices?companyId=&poId=`：公司级或 PO 级发票列表。
   - `GET /api/invoices/{invoiceId}?companyId=`：发票详情。
   - `POST /api/invoices`：创建供应商发票。
   - `GET /api/receipts-invoices/purchase-orders?companyId=`：返回已发布 PO 及收货/开票汇总，供前端工作台选择和展示。

   Alternative considered: 将所有读写挂到 `/api/purchase-orders/{poId}/...`。PO-scoped URL 很直观，但公司级财务/仓储列表会变弱；独立资源 endpoints 更适合列表、筛选和后续 matching 消费。

6. **前端新建真实“收货发票”工作台，而不是继续占位。**

   导航项应指向 `/receipts-invoices`。页面加载后端 PO 履约摘要、收货列表和发票列表。详情抽屉可查看 PO 明细、累计收货/开票进度、收货单、发票、附件元数据；创建抽屉支持两种模式：登记收货、登记发票。表单使用 PO 行作为稳定输入，避免用户手填不存在的行号。

   Alternative considered: 把收货和发票操作塞进 PO 详情页。这样短期少一个页面，但会让 PO 页面承载过多下游职责；roadmap 已经把“收货发票”作为独立导航节点。

## Risks / Trade-offs

- [Risk] 同一 PO 多次收货或开票时，累计数量校验容易漏算并发提交。→ Mitigation: 创建操作在事务中重新查询该 PO 行已登记累计值，按行校验后再保存；集成测试覆盖重复登记和越界。
- [Risk] 允许发票金额偏差可能被误认为已经完成三单匹配。→ Mitigation: API 和前端只展示 `amountVariance` 提示，不创建 matching 表记录、异常队列或处理动作。
- [Risk] 附件元数据字段后续接入 MinIO 时需要迁移。→ Mitigation: 现在预留 nullable `storage_object_key`，文件名、content type、size 和说明保持与 RFQ attachment 风格一致。
- [Risk] 发票号唯一性边界不清。→ Mitigation: MVP 按 `company_id + supplier_id + invoice_number` 做唯一约束，符合集团共享供应商池和公司隔离执行数据的演示语境。
- [Risk] 前端单文件 `App.tsx` 已经较大。→ Mitigation: 本 change 可先沿用现有结构完成演示闭环；若实现时拆分组件，应只做与新页面相关的局部提取。

## Migration Plan

1. 添加 Flyway migration 创建收货、发票和附件元数据表，不修改既有 PO 表结构。
2. 添加 demo seed，复用现有已发布 PO，并补充至少一条部分收货、完整收货、部分开票和金额偏差发票场景。
3. 新增后端实体、仓储、服务、DTO 和控制器，并在 `SecurityConfig` 中临时放行 demo GET/POST 路径。
4. 新增前端 route、导航链接、API client、工作台列表、详情抽屉和创建表单。
5. 用 Testcontainers / MockMvc 覆盖 migration、公司隔离、PO 状态校验、累计数量校验、金额偏差汇总、OpenAPI 路径和非 matching 边界。

Rollback: 新表与新 API 独立于现有 PO、RFQ 和申请数据；如需回滚，可移除本 change 的 migration/API/frontend 路由，不影响已归档能力的核心表。

## Open Questions

- MVP 是否需要“作废收货单/发票”的操作？当前建议不做，避免在三单匹配前扩大状态机。
- 发票金额偏差阈值是否需要可配置？当前建议只计算差额，不做阈值判断，阈值留给三单匹配切片。
