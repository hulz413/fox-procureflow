# ai-procurement-assistant 规格

## Purpose

AI 采购助手为集团内部采购闭环提供上下文内建议能力：从采购申请草稿、风险提示、RFQ 报价解释到三单匹配异常解释。AI 输出必须保持为可审查建议，不替代正式后端校验、审批规则、确定性排序或业务状态机。

## Requirements

### Requirement: AI 助手使用真实 provider 调用并返回结构化输出
系统 SHALL 提供由已配置 OpenAI-compatible provider 支撑的 AI 采购助手，MVP 默认使用 DeepSeek，并且 SHALL 仅向前端返回经过 service 校验的结构化 JSON。

#### Scenario: 从已配置 provider 生成结构化结果
- **WHEN** 调用方在 provider 配置可用时，使用有效公司、操作者和业务上下文请求 AI 助手场景
- **THEN** 系统 MUST 调用已配置的 OpenAI-compatible provider
- **AND** 响应 MUST 包含稳定的 `invocationId`、场景标识、模型标识、结构化结果、置信度或风险指标，以及生成时间戳

#### Scenario: AI 服务商不可用时拒绝且不返回 mock 内容
- **WHEN** AI 助手请求缺少 provider API key、base URL、model、enabled 状态或 provider 可用性
- **THEN** 系统 MUST 返回客户端可见错误，说明 AI 不可用
- **AND** 系统 MUST NOT 将硬编码 mock AI 内容作为最终行为返回
- **AND** 系统 MUST NOT 创建、更新或提交任何采购业务记录

#### Scenario: 拒绝无效 AI 输出
- **WHEN** provider 返回格式错误的 JSON、缺少必填字段、enum 值无效、金额格式不安全，或包含请求上下文之外的业务标识
- **THEN** 系统 MUST 以客户端可见错误拒绝 AI 输出
- **AND** 系统 MUST 记录失败 invocation 用于审计
- **AND** 系统 MUST NOT 将无效输出暴露为可用采购建议

### Requirement: AI 助手强制公司级且已清洗上下文
系统 SHALL 在服务端基于已清洗、公司级采购上下文构建 AI prompt，并 SHALL 防止跨公司数据进入 AI 请求或响应。

#### Scenario: 为单一公司构建 prompt 上下文
- **WHEN** 调用方为 `company-digital` 请求 AI 助手场景，且操作者属于 `company-digital`
- **THEN** 系统 MUST 仅包含 `company-digital` 拥有的业务记录，以及允许的集团共享供应商主数据
- **AND** 系统 MUST 排除属于 `company-manufacturing` 的采购交易

#### Scenario: 拒绝跨公司业务引用
- **WHEN** `company-digital` 的调用方请求解释属于 `company-manufacturing` 的 RFQ、采购订单、发票或匹配结果
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 调用 AI provider
- **AND** 系统 MUST NOT 回退到活跃演示公司

#### Scenario: 排除敏感和无关字段
- **WHEN** 系统为任意 AI 助手场景构造 prompt 上下文
- **THEN** 上下文 MUST 排除 API keys、系统配置 secrets、stack traces、电话号码、email 地址和无关内部备注
- **AND** 上下文 MUST 仅包含满足所请求采购场景所需的字段

### Requirement: AI 助手可以生成采购申请草稿预览
系统 SHALL 允许申请人将自然语言采购意图转为可审查的采购申请草稿预览，并在正式采购申请持久化前供用户复核。

#### Scenario: 从自然语言生成草稿预览
- **WHEN** `company-digital` 申请人要求 AI 助手起草类似 "采购 20 台研发笔记本，下月交付" 的申请
- **THEN** 系统 MUST 返回草稿预览，包含标题、业务用途、候选申请人、部门、品类、预算科目、明细、数量、估算金额、期望交付日期、缺失字段和置信度备注
- **AND** 系统 MUST NOT 仅因生成预览就持久化采购申请

#### Scenario: 确认 AI 草稿为正式采购申请草稿
- **WHEN** 申请人复核 AI 草稿预览、补齐必填缺失字段并确认保存
- **THEN** 系统 MUST 通过现有采购申请草稿创建行为创建正式采购申请
- **AND** 已持久化申请 MUST 状态为 `DRAFT`
- **AND** 现有主数据、公司归属、金额、明细、品类、预算科目和申请人校验 MUST 仍然适用

#### Scenario: 使用无效主数据确认 AI 草稿时拒绝
- **WHEN** AI 草稿预览引用的预算科目、申请人、品类或明细值对所选公司无效
- **THEN** 正式草稿确认 MUST 以客户端可见的 4xx 错误被拒绝
- **AND** 系统 MUST NOT 持久化采购申请
- **AND** 用户 MUST 能够修正草稿预览后重试

### Requirement: AI 助手在提交或审批前提供风险提示
系统 SHALL 在提交采购申请前或审批复核期间提供 AI 生成风险提示，但不替代审批规则或审批决策。

#### Scenario: 复核采购申请草稿风险
- **WHEN** 调用方请求复核属于 `company-digital` 的 `DRAFT` 采购申请风险
- **THEN** 系统 MUST 返回结构化风险提示，包含风险等级、风险项、支撑事实、建议用户动作，以及提交前是否建议补充更多信息
- **AND** 采购申请状态 MUST 保持 `DRAFT`

#### Scenario: 复核活跃审批风险
- **WHEN** 审批人请求复核同公司内带活跃审批实例的 `SUBMITTED` 采购申请风险
- **THEN** 系统 MUST 在 AI 上下文中包含申请摘要、金额、品类、预算科目、明细、匹配审批规则和当前审批节点
- **AND** 响应 MUST 将建议呈现为仅供参考的信息
- **AND** 审批动作 MUST 仍然通过现有审批流端点执行

#### Scenario: AI 风险复核不阻塞确定性流程
- **WHEN** AI 风险复核失败、超时或没有返回可用建议
- **THEN** 用户 MUST 仍然能够使用正常采购申请提交和审批动作
- **AND** 系统 MUST NOT 因失败的 AI 调用改变审批实例状态、审批节点状态或审批记录

### Requirement: AI 助手解释 RFQ quote 对比
系统 SHALL 使用当前 RFQ、供应商和 quote 数据解释 RFQ quote 对比结果，同时保留确定性对比排序和采购订单创建边界。

#### Scenario: 解释可对比 RFQ quote
- **WHEN** 采购用户请求解释同公司内至少有两个有效供应商 quote 的 RFQ
- **THEN** 系统 MUST 提供结构化解释，说明价格、税、交付日期、供应商评分、风险等级、风险备注、附件元数据和推荐排序差异
- **AND** 解释 MUST 仅引用受邀到该 RFQ 的供应商

#### Scenario: 保留确定性 RFQ 排序
- **WHEN** AI 助手解释 RFQ 对比数据
- **THEN** 系统 MUST NOT 改变已持久化 quote 值、供应商邀请状态、RFQ 状态或确定性推荐排序
- **AND** 系统 MUST NOT 从 AI 解释创建采购订单

#### Scenario: quote 不足时拒绝 RFQ 解释
- **WHEN** 采购用户请求解释有效供应商 quote 少于两个的 RFQ
- **THEN** 系统 MUST 返回客户端可见的 unavailable-state 响应
- **AND** 系统 MUST NOT 在对比上下文不完整时调用 provider，除非响应明确是 missing-data 解释

### Requirement: AI 助手解释三单匹配异常
系统 SHALL 解释三单匹配异常并建议处理下一步，但不变更匹配状态或来源 PO、收货、发票记录。

#### Scenario: 解释匹配异常
- **WHEN** 财务用户请求解释公司归属且状态为 `EXCEPTION` 的匹配结果
- **THEN** 系统 MUST 返回结构化解释，包含异常摘要、差异解读、可能原因、建议处理动作、所需跟进数据和置信度备注
- **AND** 解释 MUST 引用用于生成解释的当前 PO、收货、发票、差异项和处理记录上下文

#### Scenario: 匹配处理保持手工且可审计
- **WHEN** AI 助手建议确认、解决或重新打开匹配异常
- **THEN** 系统 MUST NOT 自动追加匹配处理记录
- **AND** 用户 MUST 仍然通过现有三单匹配 action workflow 提交处理动作
- **AND** 匹配结果状态 MUST 在该 workflow 成功前保持不变

#### Scenario: 处理非异常匹配状态
- **WHEN** 用户请求解释状态为 `MATCHED`、`PENDING_INPUT` 或 `RESOLVED` 的匹配结果
- **THEN** 系统 MUST 返回适配状态的解释或客户端可见的 unavailable-state 响应
- **AND** 它 MUST NOT 创建新的差异项、处理记录、收货记录、发票记录或付款记录

### Requirement: AI 助手记录可审计 invocation 历史
系统 SHALL 在 MongoDB 中为每次尝试的 provider 调用，以及每次与 AI governance 相关且跳过 provider 的校验失败，持久化 AI invocation 审计记录。

#### Scenario: 记录成功 invocation 审计
- **WHEN** AI 助手请求成功完成
- **THEN** 系统 MUST 持久化审计记录，包含 invocation 标识、公司标识、操作者标识、场景、来源引用、已清洗输入摘要、模型、provider、结构化输出、状态、延迟和时间戳
- **AND** 审计记录 MUST 可由后端代码按公司和 invocation 标识查询

#### Scenario: 记录失败 invocation 审计
- **WHEN** AI 助手请求因 provider 错误、超时、provider 输出无效，或 provider 调用开始后审计存储缺失而失败
- **THEN** 当存储可用时，系统 MUST 持久化或更新审计记录，包含失败状态、错误码、错误摘要、场景、公司标识和时间戳
- **AND** 前端响应 MUST 包含适合用户可见消息的稳定错误码

#### Scenario: 避免未审计 provider 调用
- **WHEN** AI provider 调用开始前 MongoDB 审计存储不可用
- **THEN** 系统 MUST 在调用已配置 provider 前使 AI 助手请求失败
- **AND** 系统 MUST 返回客户端可见的 service unavailable 错误

### Requirement: 前端暴露上下文化 AI 助手流程
前端 SHALL 在相关采购工作台中暴露 AI 助手入口，并 SHALL 将 AI 输出呈现为可审查建议，包含 loading、error、unavailable 和 confirmation 状态。

#### Scenario: 在采购申请页面使用 AI 助手
- **WHEN** 用户打开采购申请工作台
- **THEN** 前端 MUST 提供可接收自然语言采购意图的 AI 草稿入口
- **AND** 生成字段 MUST 可在用户保存正式采购申请草稿前编辑

#### Scenario: 在 RFQ 和匹配详情中使用 AI 助手
- **WHEN** 用户打开具备足够后端上下文的 RFQ 对比详情或三单匹配详情
- **THEN** 前端 MUST 提供 AI 解释操作
- **AND** 可见解释 MUST 展示场景、生成时间戳、置信度或风险等级、结构化章节和 invocation 标识

#### Scenario: 解释禁用的 AI 操作
- **WHEN** AI 操作因缺少 provider 配置、对比数据不足、非异常匹配状态、缺少公司上下文或 loading 状态而不可用
- **THEN** 前端 MUST 禁用该操作，并通过 tooltip 或 inline reason 解释具体不可用条件

#### Scenario: 丢弃未保存 AI 草稿编辑前确认
- **WHEN** 用户编辑 AI 生成的采购申请草稿字段，然后在保存前关闭抽屉、切换选中对象或离开当前草稿流程
- **THEN** 前端 MUST 在丢弃未保存输入前显示确认
