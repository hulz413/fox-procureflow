## 1. 工作台外壳和多公司上下文

- [x] 1.1 创建 `app`、`api`、`domain`、`features`、`i18n` 和 `shared` 目标前端模块目录，不改变运行时行为。
- [x] 1.2 将 app providers、router mounting、theme config、locale config 和 top-level app export 从单体 `App.tsx` 中移出，确保打开后仍是 Fox Procureflow 工作台而不是 landing page。
- [x] 1.3 抽取 workspace shell、sidebar/topbar navigation、notification entry、language toggle、demo reset entry、company selector 和 demo persona menu，保持当前 route visibility 和 primary action behavior。
- [x] 1.4 验证星河数字科技有限公司和星河智能制造有限公司选择仍驱动 company-scoped workbench data，星河控股集团共享上下文仍保持可见。

## 2. 真实后端数据和共享契约

- [x] 2.1 抽取 API client primitives、`ApiEnvelope` handling、API base URL behavior 和 common request error handling 到 `api` modules，不改变 endpoint paths 或 query parameters。
- [x] 2.2 将 health、master data、procurement、dashboard、global search、AI 和 attachment API functions 移入 typed modules，并由相关 workbenches 使用。
- [x] 2.3 将 shared company、user、supplier、category、budget、attachment 和 API/domain types 移入稳定的 `domain` 或 API modules，feature-only form state 留在对应 feature 附近。
- [x] 2.4 将 localization dictionaries 和 context localization helpers 抽入 `i18n`，保持中英文 language toggle behavior 和现有用户可见文案。
- [x] 2.5 确认采购 lists、details 和 drawers 仍根据 backend responses 渲染 loading、empty 和 error states，而不是使用 frontend static mock rows。

## 3. 采购申请到审批工作台闭环

- [x] 3.1 将 purchase request workbench、create/detail drawer、line-item helpers、AI draft/risk entry points 和 request-specific form state 移入 `features/purchase-requests`。
- [x] 3.2 保持 purchase request create、submit、submit-existing、delete-draft、detail open、route target、supplier/category/budget filtering 和 dirty drawer confirmation 行为。
- [x] 3.3 将 approval center views、approval path/timeline rendering、approver selection、action comment state 和 approval AI risk entry point 移入 `features/approvals`。
- [x] 3.4 保持 approval approve/reject/withdraw API calls、query invalidation、all-approver mode、disabled action reasons、route target handling 和 dirty comment confirmation。
- [x] 3.5 为抽取影响到的高风险 purchase request 和 approval dirty-close 或 action-disable 行为新增或更新聚焦前端测试。

## 4. RFQ 到采购订单工作台闭环

- [x] 4.1 将 RFQ list、create drawer、detail drawer、quote entry、comparison table、attachment display 和 RFQ AI explanation entry point 移入 `features/rfq`。
- [x] 4.2 保持 approved-request eligibility、supplier selection、quote upload/download behavior、metadata-only attachment disabled reasons、comparison ranking 和 route target handling。
- [x] 4.3 将 purchase order list、create drawer、detail drawer、publish/cancel actions、status timeline、delivery schedule 和 PO-specific form state 移入 `features/purchase-orders`。
- [x] 4.4 保持 RFQ-to-PO creation、publish/cancel mutation behavior、disabled action tooltips、detail route target handling 和 unsaved PO drawer confirmation。
- [x] 4.5 围绕 RFQ attachment actions 和 purchase order disabled/dirty states 新增或更新聚焦前端测试，覆盖抽取后 component boundaries 的变化。

## 5. 履约到三单匹配工作台闭环

- [x] 5.1 将 receipts/invoices fulfillment list、PO detail drawer、receipt creation、invoice creation、attachment fields、related tables 和 editable invoice line helpers 移入 `features/receipts-invoices`。
- [x] 5.2 保持 receipt 和 invoice creation API calls、PO fulfillment summaries、attachment upload/download behavior、fully received/invoiced disabled reasons、route target handling 和 dirty create drawer confirmation。
- [x] 5.3 将 three-way matching list、exception/resolved tabs、detail drawer、action note state、recalculate action、matching AI explanation entry point 和 difference formatting 移入 `features/three-way-matching`。
- [x] 5.4 保持 matching action 和 recalculation API calls、query refresh behavior、exception/resolved filtering、disabled action reasons、route target handling 和 dirty action-note confirmation。
- [x] 5.5 围绕 `shouldConfirmReceiptInvoiceDrawerClose`、matching action dirty confirmation 和 attachment download disabled reasons 新增或更新聚焦前端测试。

## 6. 管理、发现和共享 UI 表面

- [x] 6.1 将 procurement dashboard charts、metric formatting、exception navigation 和 dashboard-specific helpers 移入 `features/dashboard`，保持 group/company scope behavior。
- [x] 6.2 将 supplier pool 和 master data read-only views 移入 `features/supplier-pool` 和 `features/master-data`，保持 group-shared supplier presentation 和 company-scoped master data display。
- [x] 6.3 将 global search dialog、result icons、keyboard navigation、result metadata formatting 和 route opening behavior 移入 `features/global-search`。
- [x] 6.4 将 AI result panels 和 reusable AI result rendering helpers 移入 `features/ai-assistant`；只有多工作台复用的内容才进入 shared UI。
- [x] 6.5 将 pagination、status pills、truncated text、disabled-action tooltip、panel titles、attachment list/actions 和 shared formatting utilities 等确实复用的组件/工具移入 `shared` modules，避免创建未使用抽象。

## 7. 最终瘦身 App 和清理 imports

- [x] 7.1 从 `App.tsx` 移除 feature implementations、DTO collections、endpoint-specific API calls、完整 localization dictionaries 和 broad helper collections。
- [x] 7.2 确保 `App.tsx` 保持 thin composition entry；必要时通过稳定 module entry points 引入 features。
- [x] 7.3 清理 unused imports、duplicate helper code、circular imports 和抽取过程中引入的 accidental re-export chains。
- [x] 7.4 保持现有 `App.css` 和 `index.css` 视觉行为稳定；只有样式明确属于已迁移 feature 且视觉等价时才移动。

## 8. 验证和 demo readiness

- [x] 8.1 使用满足 Vite 要求的 Node.js 版本运行 frontend tests。
- [x] 8.2 运行 frontend lint 和 build，修复模块化引入的 TypeScript/import/CSS regressions。
- [x] 8.3 如果用户需要继续试用页面，运行 `./scripts/launch.sh --detach`，再运行 `./scripts/smoke-check.sh`。
- [x] 8.4 在两个 demo company contexts 下手工抽查 dashboard、supplier pool、master data、purchase requests、approvals、RFQ、purchase orders、receipts/invoices、three-way matching 和 global search sidebar routes。
- [x] 8.5 在 implementation notes 或最终回复中记录任何验证限制或后续 CSS modularization 决策。
