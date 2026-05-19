## Context

Fox Procureflow 当前已经具备 P0 采购闭环的上游数据：采购申请、审批、RFQ、PO、收货单和供应商发票。`purchase-orders` spec 将已发布 PO 作为收货、发票和三单匹配的稳定上游；`receipts-and-invoices` spec 目前只负责登记事实数据，并显式不创建 matching 记录。

本 change 补齐 P0「三单匹配」切片。核心参与角色是财务人员和采购员：财务人员需要识别 PO、收货和发票差异并处理异常；采购员需要看到采购执行异常并协助补单或沟通供应商。系统仍是集团内部多公司采购平台，供应商池集团共享，但 PO、收货、发票、匹配结果、差异项和处理记录都必须按公司归属隔离。

当前仓库已经有 `com.foxprocureflow.matching` 模块标记，可作为本能力的后端模块边界。实现仍遵循 roadmap 约束：MySQL 存储核心交易与匹配数据，同步服务调用刷新结果，不引入 RabbitMQ、Redis、MongoDB、MinIO、DeepSeek 或新的认证体系。

## Goals / Non-Goals

**Goals:**

- 为每个已发布 PO 生成公司隔离的当前三单匹配结果，并保存可审计的差异项。
- 基于 PO 明细、累计收货数量、累计发票数量和发票金额识别匹配正常、输入待补齐和异常状态。
- 在收货或发票创建成功后同步刷新对应 PO 的匹配结果，提供手动重算接口作为演示和恢复手段。
- 提供公司级匹配列表、异常队列、匹配详情和异常处理记录 API，并生成 Swagger 文档。
- 新增前端“三单匹配”工作台，加载后端真实数据，支持查看差异和记录处理动作。
- 准备多状态 demo 数据，覆盖两家公司、至少 3 条采购执行匹配记录和不同异常类型。

**Non-Goals:**

- 不实现付款、应付账款、供应商门户、退货、红冲、质检或库存入库。
- 不接入 RabbitMQ 事件触发；本阶段不做异步最终一致性。
- 不接入 DeepSeek 或 AI 异常解释，异常解释和处理建议留给 P1 AI 采购助手。
- 不实现真实附件上传、下载、预览或 MinIO object key 必填。
- 不引入 JWT 或复杂权限矩阵；继续使用显式 `companyId`、`actorId` 的 demo 安全模型并在服务层校验归属。

## Decisions

### 1. 三单匹配以 PO 为聚合锚点，保存一个当前结果和多条差异项

新增 matching 模块内的持久化模型，建议表结构：

- `three_way_match_results`: `match_id`、`company_id`、`po_id`、`supplier_id`、`status`、`po_total_amount`、`received_total_quantity`、`invoiced_total_quantity`、`invoice_total_amount`、`difference_count`、`last_calculated_at`、时间字段。
- `three_way_match_differences`: `difference_id`、`match_id`、`company_id`、`po_id`、nullable `po_line_id`、`difference_type`、`severity`、数量/金额字段、说明和时间字段。
- `three_way_match_actions`: `action_id`、`match_id`、`company_id`、`action_type`、`actor_id`、处理备注和时间字段。

`match_results` 对 `po_id` 建唯一约束，表示“当前匹配视图”。每次重算在事务内更新该结果，替换系统计算出的当前差异项；处理记录作为人工审计轨迹追加保存。

备选方案：每次重算都新增一版匹配快照。暂不采用，因为 MVP 更需要异常队列的当前状态，历史版本会扩大详情、归档和前端复杂度。处理记录已经能满足演示期的审计需求。

### 2. 状态流转区分系统计算状态和人工处理动作

匹配结果状态建议为：

```text
ISSUED PO
   |
   v
PENDING_INPUT --receipt/invoice--> MATCHED
      |                              |
      +--detected difference--------> EXCEPTION
                                      |
                                      +--resolve action--> RESOLVED
                                      |
                                      +--new source change/recalculate--> MATCHED or EXCEPTION
```

规则：

- `PENDING_INPUT`: PO 已发布，但缺少收货或发票等匹配输入，不进入异常队列。
- `MATCHED`: PO、累计收货和累计发票在数量与金额规则内一致。
- `EXCEPTION`: 至少存在一条当前差异项，需要财务或采购处理。
- `RESOLVED`: 人工处理关闭了当前异常；后续新增收货或发票会重新计算，如果仍有差异则回到 `EXCEPTION`。

备选方案：只保存 `MATCHED` / `EXCEPTION`。暂不采用，因为缺少收货或发票是常见执行过程状态，不应和真正异常混在一起。

### 3. 匹配算法使用确定性同步聚合，不做阈值配置

重算输入为同一公司、同一 PO 的：

- PO 头金额和 PO 明细订购数量。
- 已登记收货明细按 `poLineId` 的累计数量。
- 已登记发票明细按 `poLineId` 的累计数量、未税金额、税额和含税金额。

MVP 差异类型建议包括：

- `MISSING_RECEIPT`: 存在发票但没有对应收货。
- `MISSING_INVOICE`: 存在收货但没有对应发票。
- `RECEIPT_QUANTITY_SHORT`: 收货累计数量低于已开票数量或低于可判定的订单履约要求。
- `INVOICE_QUANTITY_OVER_RECEIPT`: 发票累计数量大于收货累计数量。
- `INVOICE_AMOUNT_MISMATCH`: 发票累计含税金额与 PO 含税总额不一致，例如 roadmap 演示的发票金额比 PO 多 2,300。

金额比较使用 `BigDecimal` 精确计算，币种沿用 PO 币种。MVP 不做公司级可配置容差；如果金额不一致即记录差异，后续可在 P1/P2 增加阈值或审批豁免。

备选方案：先只比较头金额，不按行比较数量。暂不采用，因为三单匹配的核心价值来自 PO 行、收货行、发票行之间的数量和金额差异识别。

### 4. 收货/发票创建后在同一业务事务末尾刷新匹配结果

`ReceiptInvoiceService` 成功保存收货或发票后调用 `ThreeWayMatchingService.recalculateForPo(companyId, poId, source)`。调用保持同步，异常处理遵循“源单据写入成功后，匹配刷新也应成功；如果刷新失败，整个创建事务回滚”，避免演示中出现发票已登记但异常队列未更新的半状态。

同时提供 `POST /api/three-way-matching/recalculate`，允许按 `companyId` + `poId` 手动重算，用于 seed 后初始化、演示恢复和后续运维动作。

备选方案：用 RabbitMQ 事件异步触发。暂不采用，因为 roadmap 明确 RabbitMQ 事件触发留给后段增强，P0 先用同步服务调用保证闭环可演示。

### 5. API 使用公司级列表、异常队列、详情和处理动作

建议 endpoints：

- `GET /api/three-way-matching?companyId=&status=`：公司级匹配结果列表。
- `GET /api/three-way-matching/exceptions?companyId=`：异常队列，默认返回 `EXCEPTION` 状态并按严重程度、更新时间排序。
- `GET /api/three-way-matching/{matchId}?companyId=`：匹配详情，包括 PO 摘要、收货/发票摘要、差异项和处理记录。
- `POST /api/three-way-matching/recalculate`：按 PO 手动重算。
- `POST /api/three-way-matching/{matchId}/actions`：追加 `ACKNOWLEDGE`、`MARK_IN_PROGRESS`、`RESOLVE` 或 `REOPEN` 处理记录。

服务层必须校验 `companyId` 存在、`actorId` 属于该公司、`matchId`/`poId` 属于该公司。所有跨公司读取、重算或处理动作都返回客户端可见的 4xx 错误，不回退到默认 demo 公司。

备选方案：只把匹配结果嵌入 `/api/receipts-invoices/purchase-orders`。暂不采用，因为财务异常队列需要独立筛选、处理和详情审计。

### 6. 前端新增独立“三单匹配”工作台

侧边栏新增“三单匹配”入口，路由为 `/three-way-matching`。页面从后端加载公司级匹配结果和异常队列，至少包含：

- 顶部概览：总匹配数、异常数、待补齐数、已处理数。
- 列表/标签切换：全部匹配、异常队列、已处理。
- 详情抽屉：PO 摘要、供应商、金额、收货/发票聚合、差异项、处理记录。
- 处理动作：确认异常、标记处理中、关闭异常、重新打开，禁用动作必须提供具体原因 tooltip。

处理备注输入属于可编辑内容；用户在未提交备注时关闭抽屉、切换行或离开当前处理对象，需要二次确认。列表和详情都必须来自后端 API，不用静态 mock 数据填充空列表。

备选方案：把 matching 嵌入“收货发票”页面。暂不采用，因为 roadmap 将三单匹配作为独立 P0 切片，且财务用户天然需要异常队列视角。

## Risks / Trade-offs

- [Risk] 同步刷新会让收货/发票创建事务变重。→ Mitigation: MVP 数据量小，重算只聚合同一 PO；保持查询按 `company_id`、`po_id`、`po_line_id` 建索引。
- [Risk] 人工 `RESOLVED` 状态可能被新发票刷新覆盖，引起演示疑惑。→ Mitigation: 详情展示最近一次计算时间和处理记录；新源单据变更后重新进入系统计算状态是预期行为。
- [Risk] 金额零容差可能把四舍五入差异标为异常。→ Mitigation: 当前 demo 金额由 seed 控制，使用两位小数精确比较；容差配置留给后续增强。
- [Risk] 修改 `receipts-and-invoices` 的边界可能影响既有测试。→ Mitigation: 更新原有“不创建 matching 记录”断言为“不会创建付款、上传、AI 或异步事件；会同步刷新 matching”，并新增匹配集成测试覆盖。
- [Risk] 前端 `App.tsx` 继续膨胀。→ Mitigation: 实现时优先抽出 matching API/types 和页面区块，避免把处理表单状态混入已有收货发票页面。

## Migration Plan

1. 新增 Flyway migration 创建 `three_way_match_results`、`three_way_match_differences`、`three_way_match_actions` 表和必要索引。
2. 新增或扩展 seed migration，在已有 PO、收货和发票数据基础上生成多状态 matching demo 数据，覆盖两家公司。
3. 新增 matching entity、repository、service、DTO、controller、状态/差异枚举，并在 `SecurityConfig` 放行 demo API。
4. 调整 `ReceiptInvoiceService`，在收货和发票创建成功后同步调用 matching 重算。
5. 新增前端 route、导航、API client、匹配工作台、详情抽屉和处理动作。
6. 增加后端集成测试、OpenAPI 测试、前端构建验证和本地浏览器演示验证。

Rollback: 新表和新 API 独立于既有 PO、收货和发票核心表。若需回滚，可移除 matching API/前端入口和同步刷新调用；收货与发票主数据仍可保留。

## Open Questions

- MVP 是否需要金额容差配置，例如 1 元以内自动匹配？当前建议不做，保持确定性演示。
- `RESOLVE` 是否必须填写处理备注？当前建议必须填写，便于演示处理记录。
- 异常关闭后是否允许源单据继续新增并重新打开？当前建议允许，因为收货/发票登记仍是事实数据入口。
