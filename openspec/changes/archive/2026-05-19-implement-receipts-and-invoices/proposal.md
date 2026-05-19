## Why

Fox Procureflow 已经完成从采购申请、审批、RFQ 到 PO 发布的 P0 前半段闭环，但已发布 PO 之后还没有可录入的收货和发票数据。收货与发票是三单匹配的直接上游，需要现在补齐，让集团内部两家公司都能演示订单履约、到票和后续差异识别的数据基础。

## What Changes

- 新增以已发布 PO 为入口的收货登记能力，支持按 PO 明细录入部分或完整收货数量、收货日期、仓储经办人、收货备注和附件元数据占位。
- 新增以已发布 PO 为入口的供应商发票登记能力，支持按 PO 明细录入开票数量、未税/税额/含税金额、发票号、发票日期、财务经办人、付款提示备注和附件元数据占位。
- 新增公司级收货与发票列表、PO 维度详情查询、创建 API 和 Swagger 文档，继续使用当前 demo 安全模型，但服务层必须校验公司、PO、明细、供应商和经办人边界。
- 新增前端“收货发票”工作台页面，从后端加载已发布 PO、收货单和发票数据，支持创建收货/发票、查看 PO 履约进度、查看附件元数据和关键状态。
- 准备多状态 demo 数据，至少覆盖未收货、部分收货、已收货、未开票、部分开票和已开票/金额异常提示的演示场景。
- 非目标：不实现三单匹配结果、异常队列、付款、供应商门户、真实附件上传、RabbitMQ 事件发布、MinIO 对象存储、AI 异常解释、JWT 登录或复杂权限矩阵。
- 验收标准：已发布 PO 可以生成公司隔离的收货单和发票；取消或草稿 PO 不能生成下游单据；数量和金额不能无声越界；前端能完成核心演示；本 change 不创建 matching 记录或依赖后段基础设施。

## Capabilities

### New Capabilities

- `receipts-and-invoices`: Covers PO-based receiving and invoice registration, company-scoped receipt/invoice APIs, attachment metadata placeholders, frontend workspace behavior, and the downstream boundary before three-way matching.

### Modified Capabilities

- None.

## Impact

- Backend: new procurement receiving/invoice domain model, Flyway tables, repositories, services, validation, REST controllers, DTOs, OpenAPI documentation, and integration tests.
- Frontend: new `/receipts-invoices` workspace route/view connected to backend APIs, plus navigation and localized UI copy for PO fulfillment, receipt, and invoice workflows.
- Data: MySQL stores receipt headers, receipt lines, invoice headers, invoice lines, and attachment metadata placeholders with company ownership; demo data extends existing issued PO scenarios.
- APIs: likely new endpoints under `/api/receipts`, `/api/invoices`, and PO-scoped read helpers for eligible issued POs and fulfillment summaries.
- Dependencies and infrastructure: no new runtime infrastructure; continue using MySQL and synchronous service calls only.
