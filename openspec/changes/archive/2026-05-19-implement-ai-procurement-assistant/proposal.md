## Why

Fox Procureflow 已具备从采购申请、审批、RFQ、PO、收货、发票到三单匹配和看板的 MVP 闭环，下一步需要用 AI 帮助申请人、采购员和财务人员更快理解和推进已有业务数据。该 change 引入真实 OpenAI-compatible provider 能力，默认连接 DeepSeek API，让 AI 提供草稿、风险提示和解释建议，但不替代正式校验、审批或落库决策。

## What Changes

- 新增 AI 采购助手能力，覆盖自然语言生成采购申请草稿、提交/审批前风险提示、RFQ 报价对比解释、三单匹配异常解释和处理建议。
- 接入真实 OpenAI-compatible AI provider，默认使用 DeepSeek API，不以 mock AI 作为最终行为。
- 新增服务端 AI 调用封装、Prompt 模板、结构化 JSON 输出校验、错误处理和超时控制。
- 新增 AI 调用审计，记录公司、用户、场景、输入摘要、输出、状态和错误信息，供演示和排查使用。
- 新增脱敏和上下文裁剪边界，仅向 AI 发送完成任务所需的业务字段。
- 新增前端 AI 助手入口和确认式工作流，AI 生成内容必须经用户确认后才能进入正式采购申请或业务操作。
- 非目标：不实现 AI 自动审批、自动选择中标供应商、自动处理三单匹配异常、自动创建正式单据、模型训练、向量检索、流式对话、多模型路由或离线 mock 替代真实调用。

## Capabilities

### New Capabilities

- `ai-procurement-assistant`: 覆盖集团内部多公司采购场景下的 AI 草稿生成、风险提示、业务解释、结构化输出、用户确认、审计和数据隔离要求。

### Modified Capabilities

- None.

## Impact

- 后端：新增 AI service、OpenAI-compatible provider 配置、Prompt 模板、结构化响应 DTO、审计持久化和 AI API endpoint；读取采购申请、RFQ、报价、PO、收货、发票、三单匹配等现有业务上下文。
- 前端：新增 AI 助手交互入口，在采购申请、RFQ、三单匹配等工作台展示 AI 建议、置信度、引用上下文和确认动作。
- 数据：MongoDB 存储 AI 会话、调用审计和输入输出快照；MySQL 仍作为正式业务单据和交易数据来源。
- 配置：新增 `OPENAI_COMPATIBLE_*` API key、base URL、model、timeout 和开关类环境变量；本地文档需说明 key 由使用者自行配置。
- 安全与边界：AI endpoint 必须遵守公司维度数据隔离；AI 输出仅为建议，不绕过现有后端校验、审批规则或业务状态机。
