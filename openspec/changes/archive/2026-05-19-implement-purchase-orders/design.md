## Context

Fox Procureflow 当前已完成采购申请 Intake、审批流和 RFQ 询报价。RFQ 能从已审批申请创建，邀请集团共享供应商，录入多家供应商报价，并在 `COMPARISON_READY` 状态下返回确定性推荐排序。但系统尚未把选定报价转化为采购订单，后续收货、发票和三单匹配也缺少稳定的 PO 上游单据。

PO 采购订单是 P0 闭环的执行起点：它不再只是采购内部评估记录，而是面向供应商、财务和后续履约环节的正式公司级交易单据。它必须继续遵守现有集团共享供应商池与公司隔离边界：供应商来自集团共享主数据，但 PO、金额、税率、明细和状态归属于发起采购的公司。

## Goals / Non-Goals

**Goals:**

- 新增 PO 主数据、明细、交付计划和状态历史的 MySQL 表、后端领域模型、REST API 和 Swagger 文档。
- 允许采购员从 `COMPARISON_READY` RFQ 的有效报价创建一个公司级 PO，并在创建时快照 RFQ、报价、采购申请、审批和供应商关键信息。
- 支持 PO 草稿查询、详情、发布和取消等 MVP 状态流转，为后续收货与发票切片提供稳定入口。
- 支持两个 roadmap 演示公司使用同一集团共享供应商池生成各自公司隔离的 PO。
- 前端新增“采购订单”工作台页面，覆盖从可下单 RFQ 选择报价、创建 PO、查看详情到发布 PO 的演示流程。

**Non-Goals:**

- 不创建收货单、发票、三单匹配结果、预算冻结、付款记录或供应商门户任务。
- 不引入 RabbitMQ 事件发布；PO 发布后暂不向下游异步广播。
- 不实现真实附件上传、电子合同、用印、供应商确认、邮件/短信通知或外部账号体系。
- 不接入 DeepSeek 或其他 AI 能力，不做自动选标、风险解释或异常处理建议。
- 不引入 JWT 鉴权；继续沿用当前 demo 安全模型，并通过服务层校验 actor 和公司归属。

## Decisions

### 1. PO 是独立交易聚合，引用并快照 RFQ 中标报价

新增 `purchase_orders`、`purchase_order_lines`、`purchase_order_delivery_schedules` 和 `purchase_order_status_records` 表。`purchase_orders` 存储 `po_id`、`company_id`、`rfq_id`、`quote_id`、`supplier_id`、采购员、状态、币种、税前金额、税额、含税总额、标题、交付计划摘要和上游快照；明细表存储从采购申请/RFQ 继承的物料行；交付计划表存储计划交付日期、地点、联系人和备注；状态记录表保存创建、发布、取消等操作轨迹。

理由：PO 是后续收货、发票和三单匹配共同引用的正式单据，不能只作为 RFQ 上的一个字段。独立聚合能保证后续切片用清晰的 `poId` 作为上游锚点，同时保留 RFQ 和报价的可审计关联。

备选方案：在 RFQ 或 quote 上增加 `poCreated` 字段。暂不采用，因为会把询报价和订单履约职责混在一起，也会让后续收货/发票依赖 RFQ 内部结构。

### 2. 创建 PO 时只接受 `COMPARISON_READY` RFQ 的有效报价

PO 创建在一个数据库事务内完成：

1. 校验 `companyId` 存在，采购员属于该公司。
2. 读取 RFQ 并校验 RFQ 属于同一公司且状态为 `COMPARISON_READY`。
3. 读取 quote 并校验 quote 属于该 RFQ 的已邀请供应商。
4. 校验该 RFQ 尚未创建 PO，避免一个 RFQ 生成多个正式订单。
5. 快照 RFQ 头、源采购申请、审批结果、供应商、报价、税率、金额和明细行。
6. 创建 `DRAFT` PO、明细、交付计划和状态记录。

理由：MVP 采购闭环需要确定、可演示的“一次询价生成一个订单”路径。`COMPARISON_READY` 表示已有足够报价完成比较，能防止采购员从未完成报价的 RFQ 下单。

备选方案：允许从任意 RFQ quote 创建 PO。暂不采用，因为这会绕过报价比较阶段，削弱 roadmap 中 RFQ 切片的业务意义，也增加重复下单风险。

### 3. 状态流转保持小而明确

PO 初始状态为 `DRAFT`，发布后进入 `ISSUED`，取消后进入 `CANCELLED`。MVP 暂不引入收货相关的 `PARTIALLY_RECEIVED`、`RECEIVED` 或发票相关状态；这些由后续收货与发票切片在 PO 基础上扩展。

```text
COMPARISON_READY RFQ quote
          |
          v
      PO DRAFT --publish--> ISSUED
          |
          +--cancel--------> CANCELLED
```

规则：

- 只有 `DRAFT` PO 可以发布。
- `DRAFT` 或 `ISSUED` PO 可以取消；取消必须记录 actor、原因和时间。
- 终态 `CANCELLED` 不能再次发布或取消。
- 本 change 不修改 RFQ 状态；PO 通过唯一约束和查询能力防止重复创建。

理由：当前阶段的目标是生成正式订单并为履约建立入口，状态过多会提前引入收货、发票和关闭规则。

备选方案：新增 `PO_CREATED` 或 `AWARDED` RFQ 状态。暂不采用，因为现有 RFQ spec 明确将 RFQ 保持在报价比较职责内；重复下单可以由 PO 聚合唯一约束处理。

### 4. 金额和税率以报价为准，明细以申请快照为准

PO 头金额来自选定 quote 的 `quoteAmount`、`taxRate`、`taxAmount` 和 `totalAmount`。PO 明细从 RFQ 的申请快照或源采购申请明细复制 item、规格、数量、单位、品类和估算金额，并允许在 PO 中记录采购员确认后的单价/金额快照。若 quote 是供应商总价报价，PO 明细金额可以按申请估算比例分摊或保留原估算金额，并在 PO 头保留正式 quote 总额。

理由：RFQ 当前只保存供应商总报价，不保存逐行报价。PO 头必须尊重供应商有效报价，明细则应保持采购申请业务语义，供后续收货按数量执行。

备选方案：要求 RFQ 先实现逐行报价后再做 PO。暂不采用，因为 roadmap P0 只要求 RFQ 展示价格、交期、评分和风险；逐行报价会扩大 RFQ scope。

### 5. API 继续使用显式 company/actor 字段和 demo 放行策略

新增 API 示例：

- `GET /api/purchase-orders?companyId=...&status=...`
- `POST /api/purchase-orders`
- `GET /api/purchase-orders/{poId}`
- `POST /api/purchase-orders/{poId}/publish`
- `POST /api/purchase-orders/{poId}/cancel`

当前没有 JWT，因此 `SecurityConfig` 临时放行 `/api/purchase-orders/**` 的本地 demo GET/POST 调用。服务层仍要求写入请求携带 `companyId`、`procurementUserId` 或 `actorId`，并校验用户、RFQ、报价、供应商和 PO 均属于同一公司边界。跨公司读取或写入必须返回客户端可见的 4xx 错误。

理由：这延续采购申请、审批和 RFQ 的 demo 安全模型，让业务切片先贯通，同时保留后续 JWT 替换 actor 来源的空间。

备选方案：等待认证切片完成后再实现 PO。暂不采用，因为 P0 核心闭环优先，且现有服务层归属校验已经覆盖演示边界。

### 6. 前端新增 PO 页面而不是把下单动作塞回 RFQ 页面

侧边栏新增“采购订单”入口，路由为 `/purchase-orders`。页面加载公司级 PO 列表、可下单 RFQ/报价候选、PO 详情和状态记录。创建抽屉让采购员选择 `COMPARISON_READY` RFQ 的一个报价，填写交付地点、联系人和备注后创建 PO；详情页提供发布和取消动作。

理由：PO 是独立工作台对象，后续收货、发票和三单匹配都会围绕它展开。独立页面也避免改变 RFQ 页面“比较报价但不自动生成订单”的现有语义。

备选方案：在 RFQ 详情中直接增加“生成 PO”按钮作为唯一入口。暂不采用，因为它会让 PO 管理缺少列表、详情和状态流转承载面。

## Risks / Trade-offs

- [Risk] 一个 RFQ 只允许生成一个 PO，暂不覆盖分拆下单或多供应商联合供货。→ Mitigation: MVP 先保证闭环清晰，后续可以在 PO 层增加拆单或多 PO 规则。
- [Risk] RFQ 当前没有逐行供应商报价，PO 明细金额只能从申请明细和总报价组合快照。→ Mitigation: PO 头使用正式 quote 总额，明细保留数量和物料语义；后续逐行报价可以增强明细金额来源。
- [Risk] 不更新 RFQ 状态可能让用户难以看出某 RFQ 已下单。→ Mitigation: PO 列表和可下单候选查询排除已有 PO 的 RFQ，并在 PO 详情中展示上游 `rfqId` 和 `quoteId`。
- [Risk] 当前 demo 安全模型依赖前端传 actor 字段。→ Mitigation: 所有写入由服务层校验 actor 公司归属；JWT 切片上线后将 actor 来源替换为 token。
- [Risk] 前端 `App.tsx` 已较大，继续集中实现会增加维护成本。→ Mitigation: 实现时优先抽出 PO 类型、API 函数和页面级组件，至少避免把全部表单逻辑混入已有 RFQ 区块。

## Migration Plan

1. 新增 Flyway `V10__create_purchase_orders.sql`，只创建 PO 相关新表、唯一约束和公司/RFQ/quote/status 索引。
2. 新增 PO JPA entity、repository、service、controller、DTO 和状态枚举，复用现有 `ApiEnvelope` 与异常响应。
3. 扩展或复用 RFQ repository/service 查询，获取 `COMPARISON_READY` RFQ、quote、supplier 和申请快照。
4. 扩展 `SecurityConfig` 临时放行 `/api/purchase-orders/**` demo API。
5. 新增前端 PO API、query/mutation hooks、路由、页面、创建抽屉、发布/取消动作和详情视图。
6. 增加后端集成测试、前端构建验证和本地浏览器演示验证。

回滚策略：本 change 只新增 PO 表和代码路径。回滚时移除 PO API/前端入口并清理 PO 表数据，不影响已有主数据、采购申请、审批和 RFQ 数据。

## Open Questions

- PO 编号是否采用 `PO-YYYYMMDD-NNNN`，还是加入公司短码便于演示识别。
- 取消 `ISSUED` PO 是否需要限制为“未收货前可取消”，还是留给后续收货切片补规则。
- PO 明细金额在没有逐行报价时是否需要按申请明细比例分摊 quote 总额，还是保留申请估算金额并只以 PO 头 quote 总额作为正式金额。
