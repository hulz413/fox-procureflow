## Context

Fox Procureflow 已完成采购申请、审批、RFQ、PO、收货、发票、三单匹配和采购看板的 MVP 闭环。当前系统的决策支持主要来自确定性规则和列表/详情数据：审批流按规则生成，RFQ 比价按确定性排序展示，三单匹配按 PO、收货和发票差异识别异常。

本 change 引入 P1「AI 采购助手」，面向申请人、采购员和财务人员，在已有业务上下文上提供草稿、风险提示和解释建议。AI 能力必须服务集团内部多公司采购协同：供应商池可作为集团共享上下文，采购申请、RFQ、PO、收货、发票和三单匹配仍按公司归属隔离。AI 输出不直接改变正式业务状态，也不替代后端校验、审批规则、RFQ 推荐排序或三单匹配状态机。

实现遵循 roadmap：使用真实 OpenAI-compatible provider，默认连接 DeepSeek API；使用 MongoDB 存储 AI 会话、输入输出和审计；MySQL 继续作为正式业务事实来源；不引入 Keycloak、Redis、RabbitMQ、MinIO、Prometheus、Grafana、Jaeger/Zipkin 或 mock AI 最终行为。

## Goals / Non-Goals

**Goals:**

- 提供四个可演示 AI 场景：自然语言生成采购申请草稿、提交/审批前风险提示、RFQ 报价解释、三单匹配异常解释和处理建议。
- 封装 OpenAI-compatible provider 调用，支持环境变量配置 API key、base URL、model、timeout 和启用状态。
- 约束 AI 输出为结构化 JSON，并在服务端做 schema/字段级校验后再返回前端。
- 记录 AI 调用审计，包括公司、用户、场景、输入摘要、上下文引用、输出、状态、耗时和错误。
- 在服务层强制公司维度数据隔离，避免跨公司业务记录进入 Prompt 或响应。
- 在前端提供可确认的 AI 建议交互，尤其是采购申请草稿必须经用户确认后才调用现有正式创建流程。

**Non-Goals:**

- 不做 AI 自动审批、自动提交采购申请、自动选择中标供应商、自动创建 PO、自动处理三单匹配异常或自动付款。
- 不改变现有审批规则、RFQ 排序算法、PO 状态流转、收货/发票登记规则或三单匹配计算规则。
- 不实现长对话、多轮记忆、向量检索、RAG、模型微调、多模型路由、流式输出或供应商门户 AI。
- 不在生产路径使用 mock AI；自动化测试可以通过 provider interface 使用 test double。
- 不引入新的认证体系或复杂权限矩阵；当前 demo security model 下仍由服务层做显式公司/用户校验。

## Decisions

### 1. AI assistant 作为独立应用服务层，不嵌入业务状态机

新增 `ai` 或 `assistant` 模块边界，包含 controller、service、provider client、prompt builder、response validator、context builder 和 audit repository。AI 服务通过现有 repository/service 读取业务上下文，但不直接写入采购申请、审批、RFQ、PO、收货、发票或三单匹配表。

状态一致性边界：

- 采购申请草稿生成只返回 `draftPreview`；用户确认后，前端或后端显式调用现有采购申请创建能力，正式记录进入 `DRAFT`。
- 风险提示只读采购申请、审批规则和审批摘要，不阻塞 `SUBMITTED`、`APPROVED`、`REJECTED` 或 `WITHDRAWN` 状态变化。
- RFQ 解释只读 RFQ、供应商和报价比较数据，不改变确定性推荐 rank，也不创建 PO。
- 三单匹配解释只读匹配结果和差异项，不追加 handling record，不改变 `PENDING_INPUT`、`MATCHED`、`EXCEPTION` 或 `RESOLVED` 状态。

备选方案：把 AI 调用直接放入每个业务 service。暂不采用，因为 AI 是横跨多个工作台的建议层，嵌入状态机会让业务事务依赖外部模型稳定性。

### 2. 使用真实 OpenAI-compatible provider，生产缺配置时显式失败

通过 `OPENAI_COMPATIBLE_*` 配置项提供 API key、base URL、model 和 timeout，默认 base URL 指向 DeepSeek。后端使用 Spring HTTP client 封装 OpenAI-compatible chat completion 调用，避免新增重量 SDK；所有 provider 调用集中在一个 adapter 中，便于测试和后续替换。

生产路径不提供 mock provider。缺少 API key、配置关闭、超时、限流或 provider 错误时，AI endpoint 返回 client-visible error，前端展示不可用状态和重试入口；系统不得生成假 AI 内容填充页面。

备选方案：先用 mock 内容完成 UI。暂不采用，因为 roadmap 明确 AI 应使用真实 DeepSeek API，mock AI 不应作为最终行为。

### 3. 结构化 JSON 是 AI 与业务 UI 的唯一契约

每个场景定义独立 response shape，例如：

- 采购申请草稿：标题、用途、公司、申请人、品类、预算科目候选、行项目、金额、交付日期、缺失字段、置信度、解释。
- 风险提示：风险等级、风险项、触发依据、建议动作、是否建议继续提交。
- RFQ 解释：推荐摘要、主要差异、供应商优劣、风险说明、需要人工确认的问题。
- 三单匹配解释：异常摘要、差异解释、可能原因、建议处理动作、需要补充的数据。

服务端必须校验 JSON 可解析、必填字段存在、枚举值合法、金额/数量格式安全、引用 ID 属于当前上下文。校验失败时不返回部分可信内容，而是记录审计并返回 AI 输出无效错误。

备选方案：把自然语言 Markdown 直接展示给用户。暂不采用，因为采购工作台需要稳定字段、状态和确认动作，纯文本不利于测试和前端安全展示。

### 4. Prompt context 由服务端裁剪和脱敏

前端只提交意图或目标业务 ID；服务端基于公司、用户和场景构建 Prompt context。上下文中允许包含公司名称、部门、品类、预算科目、供应商名称、报价、PO、收货、发票和差异项等业务字段；默认排除手机号、邮箱、无关内部备注、系统错误堆栈、API key、数据库主键以外的敏感配置，以及跨公司记录。

多公司边界：

- 请求必须带显式 `companyId` 和 actor/user identifier。
- company-scoped 业务记录必须属于该 company。
- 供应商主数据可来自集团共享供应商池，但交易金额、报价、PO、收货、发票和匹配结果必须按公司过滤。
- 未知公司、跨公司 actor 或跨公司业务 ID 必须返回 4xx，不回退到 active demo company。

备选方案：由前端拼接完整 Prompt。暂不采用，因为前端无法可靠执行脱敏、权限和上下文一致性校验。

### 5. MongoDB 存储 AI 审计，MySQL 继续存正式业务事实

新增 MongoDB collection，例如 `ai_assistant_sessions` 或 `ai_invocations`，记录：

- `invocationId`, `scenario`, `companyId`, `groupId`, `actorId`
- `sourceReferences`: request/rfq/quote/po/match identifiers
- `inputSummary`, `sanitizedPromptContext`, `model`, `provider`
- `structuredOutput`, `status`, `errorCode`, `errorMessage`
- `startedAt`, `completedAt`, `latencyMs`

AI 调用没有跨 MySQL/MongoDB 的分布式事务。AI 建议记录和正式业务创建保持松耦合：采购申请确认后通过现有 MySQL 流程创建 `DRAFT`，可在请求中携带 `invocationId` 作为可选来源引用，但 MySQL 业务成功不依赖 AI 审计更新成功。若 MongoDB 在调用前不可用，AI endpoint 应失败并避免调用外部 provider，保证已发生的 AI 调用可审计。

备选方案：把审计放 MySQL。暂不采用，因为 roadmap 已将 AI 会话、输入输出和审计放在 MongoDB，且该数据更接近文档型上下文快照。

### 6. 前端采用场景化入口和确认式工作流

前端不做一个脱离业务页面的泛聊天框。AI 入口应出现在自然上下文中：

- 采购申请页：从自然语言生成草稿预览，用户编辑/确认后保存为正式 `DRAFT`。
- 采购申请详情或审批中心：对待提交或待审批申请生成风险提示。
- RFQ 详情/比价：生成报价解释，不替代现有排序。
- 三单匹配详情：解释异常和处理建议，不替代处理动作。

AI 输出面板需要 loading、error、empty、retry、copy/引用、确认/应用动作和禁用原因提示。若用户在 AI 生成的可编辑草稿中有未保存输入，关闭抽屉、切换对象或离开前必须确认。

备选方案：只提供一个全局 AI 浮窗。暂不采用，因为 MVP 演示需要 AI 紧贴采购业务闭环，泛聊天难以验证公司隔离和正式流程确认。

## Risks / Trade-offs

- [Risk] OpenAI-compatible provider 不稳定、超时或 key 缺失导致演示中断。→ Mitigation: 前端提供清晰不可用状态；后端超时和错误可审计；AI 不阻塞核心采购闭环。
- [Risk] AI 输出幻觉，生成不存在的供应商、品类或业务 ID。→ Mitigation: 服务端按当前公司和主数据校验结构化输出；非法引用不允许进入正式创建流程。
- [Risk] Prompt 泄露跨公司数据或敏感字段。→ Mitigation: 服务端统一 context builder 和脱敏规则；所有场景必须显式校验 companyId、actor 和业务记录归属。
- [Risk] MongoDB 审计增加本地启动依赖。→ Mitigation: AI 能力属于 P1 后段；缺 MongoDB 时 AI endpoint 显式不可用，但 P0 闭环仍可运行。
- [Risk] AI 建议和确定性业务规则冲突。→ Mitigation: UI 标注 AI 为建议；正式提交、审批、RFQ 排序和三单匹配处理仍调用既有后端校验和状态机。
- [Risk] OpenAI-compatible API 的响应细节可能随 provider 变化。→ Mitigation: provider adapter 集中封装；配置化 model/base URL；服务端只向上层暴露内部结构化契约。

## Migration Plan

1. 新增 AI 配置项和 provider adapter，支持真实 OpenAI-compatible provider 调用、超时和错误映射。
2. 新增 MongoDB AI 审计 document、repository 和审计写入流程。
3. 新增四个场景的 Prompt builder、context builder、response schema 和 validator。
4. 新增 AI assistant REST endpoints，并在当前 demo security model 下放行，同时保留服务层显式公司/用户校验。
5. 在采购申请、审批/RFQ/三单匹配前端工作台加入场景化 AI 入口、结果面板和确认式应用流程。
6. 补充后端 provider adapter 测试、context 隔离测试、结构化输出校验测试、OpenAPI 测试、前端构建和交互 smoke 验证。

Rollback: AI assistant 是独立建议层。若需回滚，可移除前端 AI 入口和 AI endpoints；现有采购申请、审批、RFQ、PO、收货、发票、三单匹配和看板数据不需要迁移或回滚。

## Open Questions

- 默认模型名是否固定在 `.env.example` 中，还是只保留 `OPENAI_COMPATIBLE_MODEL` 占位由演示者选择？当前建议配置化，不在代码里硬编码具体模型。
- AI 调用审计是否需要前端可见的历史列表？当前建议首版只在后端存审计并在当前结果中返回 `invocationId`，不新增独立审计 UI。
- 采购申请草稿确认时是否在 MySQL 记录 `aiInvocationId` 来源字段？当前建议作为可选来源引用，如果实现成本高，可先只在 MongoDB 记录创建后的业务 `requestId`。
