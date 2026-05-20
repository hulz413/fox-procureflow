## Why

`frontend/src/App.tsx` 已经膨胀到 11k+ 行，同时混合 API 调用、DTO、国际化文案、工作台外壳、各业务工作台、共享 UI 组件和格式化工具。Fox Procureflow 的 MVP 采购闭环已经完成，继续把采购申请、审批、RFQ、采购订单、收货、发票、三单匹配、搜索、AI 或看板变更都挤在同一个文件里，会显著增加多公司采购演示的维护和回归风险。

## What Changes

- 围绕现有 Fox Procureflow 工作台体验做 React 前端模块化，保持当前用户可见 MVP 行为不变。
- 将应用组合、providers、路由、工作台外壳、API client、domain types、i18n、shared UI 和 feature workbenches 从 `App.tsx` 拆入清晰的 `src/` 边界。
- 按采购业务垂直切片组织 feature 代码，包括 dashboard、purchase requests、approvals、RFQ、purchase orders、receipts/invoices、three-way matching、supplier pool、master data、global search、AI result panels 和 attachments。
- 保留星河控股集团、星河数字科技有限公司、星河智能制造有限公司的集团/公司上下文行为。
- 保留当前前端约束：采购执行类列表不使用前端静态 mock 数据掩盖空列表，禁用按钮提供具体原因 tooltip，可编辑抽屉有未保存内容时关闭或切换前必须确认。
- 保持现有 API contract 和后端行为不变；本 change 是前端架构与可维护性改进。
- 围绕被抽取的 shared components、global search、attachment UI 和关键 dirty-close 行为补充或调整聚焦测试。
- 不引入新的状态管理框架、CSS 框架、后端 endpoint、认证模型、外部服务或新的采购流程行为。

## Capabilities

### New Capabilities

- `frontend-modularization`: 定义 Fox Procureflow 采购工作台的前端模块化架构要求和行为保持契约。

### Modified Capabilities

- None.

## Impact

- `frontend/src/` 源码结构会变化，`App.tsx` 收敛为应用组合和 provider wiring。
- 现有 React Router routes、Ant Design UI、TanStack Query 用法、本地化中英文内容、API base URL 处理和工作台导航保持功能等价。
- 不预期修改后端 Java 代码、数据库迁移、API 路由、基础设施服务或 OpenAPI contract。
- 验证应包含 frontend lint/build/tests，以及确认两个公司上下文中采购工作台仍由真实后端数据支撑的 demo smoke check。

## Non-Goals

- 不重新设计 Fox Procureflow UI，也不替换既有 “F 库采 SaaS” 视觉基线。
- 不改变采购业务行为、状态流转、审批规则、三单匹配逻辑、搜索语义、AI provider 行为、附件存储或 seeded demo data。
- 不引入 Redux、Zustand adoption、React Hook Form 迁移、Zod 校验迁移、代码生成、micro-frontends 或 package/workspace restructuring；除非某个极小步骤是保持既有行为所必需。
- 不使用前端静态 mock 数据补齐缺失后端数据。
- 不改变本地开发契约、端口、Docker services 或交付脚本。

## Acceptance Criteria

- `frontend/src/App.tsx` 不再包含 feature workbench 实现、domain DTO 定义、API client functions、完整本地化内容或大范围 shared utility/helper 集合。
- 新源码树有明确的 app composition、API access、i18n、shared UI/utilities 和 feature workbench 模块边界。
- 现有 sidebar/topbar routes 仍能在当前 demo persona 和 company context 下渲染对应工作台。
- Purchase request、approval、RFQ、purchase order、receipts/invoices、three-way matching、supplier pool、dashboard、global search、AI 和 attachment UI 行为仍由现有 API 与 seeded data 支撑。
- 详情或抽屉里的禁用操作仍暴露具体原因 tooltip；可编辑抽屉有未保存内容时仍在关闭或切换前确认。
- 使用支持的 Node.js 版本运行 frontend verification path 成功，MVP smoke check 仍能确认本地工作台 demo-ready，且不新增基础设施依赖。
