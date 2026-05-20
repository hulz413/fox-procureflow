## Context

Fox Procureflow 前端已经把完整 MVP 采购闭环累积在 `frontend/src/App.tsx` 中：application providers、route shell、API calls、domain DTOs、本地化文案、dashboard charts、purchase request intake、approvals、RFQ、purchase orders、receipts/invoices、three-way matching、supplier pool、master data、global search、AI result rendering、attachment widgets 和 shared formatting helpers。

这种形态在快速证明垂直 MVP 时可以接受，但当前 MVP 已经完整到需要重视可维护性。现状让任何前端改动都默认变成跨模块改动，即使业务行为只属于一个工作台。本次重构必须保守：保留现有集团/公司采购演示，保持所有后端 API contract 不变，避免 UI 重设计，同时让代码按业务切片更容易演进。

## Goals / Non-Goals

**Goals:**

- 将 `App.tsx` 收敛为应用组合入口：providers、router entry、locale/theme wiring 和少量 shell handoff。
- 将 API functions 和 DTOs 移入明确模块，保持当前 request paths、query parameters、response envelopes 和 API base URL 行为。
- 将本地化内容移入专门的 `i18n` 模块，保持现有中英文文案和语言切换行为。
- 仅在确实被多个工作台复用时，将 shared UI 和 utilities 移入共享模块。
- 将采购工作台实现移入与现有 demo vertical slices 对齐的 feature folders。
- 保持当前多公司行为：company-scoped transactions 仍按 selected company 隔离，group-shared supplier pool 和 shared reference data 仍保持可见共享语义。
- 保持当前 mutation、drawer、disabled-action、search、AI、attachment 和 dashboard 行为。

**Non-Goals:**

- 不修改 backend API、database、Flyway、OpenAPI、seed data、infrastructure 或 delivery scripts。
- 不改变采购流程：approval、RFQ、PO、receipt、invoice 和 matching 状态流转仍由现有后端服务负责。
- 不做视觉重设计、不替换 design system、不新增 CSS framework、不引入新的 state-management pattern、不重做路由。
- 不为 lists 或 details 增加 mock data fallback。
- 不引入 Elasticsearch、Redis hard dependency、RabbitMQ hard dependency、Keycloak 或新增 AI provider 等外部服务。

## Decisions

### 1. 使用 feature-first 前端模块和轻量 app composition

目标源码结构：

```text
frontend/src/
├─ app/
│  ├─ App.tsx
│  ├─ AppProviders.tsx
│  ├─ routes.tsx
│  └─ workspace/
├─ api/
│  ├─ client.ts
│  ├─ attachments.ts
│  ├─ masterData.ts
│  ├─ procurement.ts
│  ├─ dashboard.ts
│  ├─ globalSearch.ts
│  └─ ai.ts
├─ domain/
├─ features/
│  ├─ dashboard/
│  ├─ purchase-requests/
│  ├─ approvals/
│  ├─ rfq/
│  ├─ purchase-orders/
│  ├─ receipts-invoices/
│  ├─ three-way-matching/
│  ├─ supplier-pool/
│  ├─ master-data/
│  ├─ global-search/
│  └─ ai-assistant/
├─ i18n/
└─ shared/
   ├─ ui/
   └─ utils/
```

理由：feature folders 能让采购垂直切片在代码中直接可见，和 roadmap 及 demo flow 保持一致。`app/` 只负责组合，不承载业务细节。

备选方案：只按技术类型拆成 `components/`、`hooks/`、`pages/`、`utils/`。这种方式能缩小 `App.tsx`，但仍会把同一个业务工作台散落到多个目录里，后续采购改动仍难以定位。

### 2. 路由和公司上下文集中留在 workspace shell

Workspace shell 继续负责：

- 当前 route awareness 和 sidebar/topbar rendering；
- selected company 和 demo persona；
- language toggle；
- notification 与 global search 入口；
- reset demo data action 和 top-level query invalidation。

Feature workbenches 通过显式 props 或小型 typed hooks 接收 selected company、active demo user/persona context、localized messages 和相关 data/query hooks。Company selection 必须继续控制 company-scoped transaction lists 的请求和渲染。

理由：公司上下文是跨工作台的 demo 边界。集中维护它，可以避免每个工作台发明略有不同的 company-selection semantics。

备选方案：为所有 workspace state 引入 global store。对行为保持型重构来说没有必要，而且会把迁移范围放大。

### 3. 先抽 API clients，再移动 feature components

API extraction 应先于大规模 feature move。抽取后的 API layer 必须保持：

- `ApiEnvelope<T>` response shape；
- `VITE_API_BASE_URL` fallback behavior；
- 现有 endpoint paths 和 query parameter names；
- 现有 attachment upload/download behavior；
- 现有 AI request payloads 和 result parsing。

理由：当业务视图已经依赖稳定 API functions 时，feature extraction 更安全；同时也更容易发现是否有人用 frontend mock data 绕过真实接口。

备选方案：把每个工作台连同本地 API helpers 整块搬走，再之后去重。短期改动较简单，但容易把单体文件变成多个隐藏小单体。

### 4. 采购状态流转仍以 backend boundary 为准

本 change 会触达 approval、PO、receipt、invoice 和 three-way matching 工作台，但不得改变状态语义：

- approval actions 仍调用现有 approval mutation APIs，并 invalidate 当前 approval/request queries；
- PO publish/cancel 仍调用现有 PO action APIs，并保留 disabled reason tooltips；
- receipt 和 invoice creation 仍调用现有 creation APIs，并保留 dirty close confirmation；
- three-way matching actions 和 recalculation 仍调用现有 matching APIs，并保留 action-note dirty confirmation；
- global search result navigation 仍打开相同 target workbench/detail，且不改变业务状态。

任何抽取后的组件都不应引入新的 optimistic status transitions 或 local-only state，让 UI 在后端 mutation 成功前表现得像状态已经改变。

理由：MVP 的可信度来自真实 backend-backed procurement loop。前端重构不能削弱这个一致性边界。

备选方案：借重构顺手清理 mutation flows 和 optimistic UI。这以后可能值得做，但混入架构 change 会让回归更难定位。

### 5. Domain types 按 ownership 拆分，而不是塞进一个 mega `types.ts`

只有被多个 feature 复用的类型才进入 `domain/`。Feature-specific DTOs 和 form state types 应留在对应 feature 附近。例如：

- shared organization、company、user、supplier、category、budget、API envelope 和 common attachment types 可以放在 domain/API modules；
- purchase request form state 留在 `features/purchase-requests`；
- RFQ quote form state 留在 `features/rfq`；
- matching action note state 留在 `features/three-way-matching`。

理由：把当前所有 types 搬到单个 `types.ts` 只是换一个文件名重建耦合。

备选方案：从 OpenAPI 生成 types。本 change 不需要引入新的生成工作流来解决单体文件问题。

### 6. CSS 行为稳定优先，允许安全的 scoped extraction

第一阶段既有视觉样式仍主要锚定在 `App.css` 和 `index.css`。Feature extraction 过程中，只有当移动样式能降低 feature coupling 且不改变视觉基线时才移动。任何被移动的 class names 必须保持当前 layout、responsive behavior、text fit、disabled states、drawer layouts 和 chart rendering。

理由：CSS 变化很容易意外变成视觉重设计。保守的第一步能降低 churn，同时先解开 TypeScript/component 单体。

备选方案：立即完全转换为 per-feature CSS files。这长期可能更好，但当前优先级是拆行为和 ownership，风险更高。

## Risks / Trade-offs

- [Risk] 大量 file moves 会造成 import churn，让 review 噪声变大。→ Mitigation: 按垂直切片迁移，并在有意义的批次后运行 tests/build。
- [Risk] 过度抽取 shared helpers 会制造 premature abstractions。→ Mitigation: 只有至少两个工作台已经需要的 helper 才进入 shared。
- [Risk] 如果 workbenches 各自维护 selected company state，公司上下文可能漂移。→ Mitigation: selected company 留在 workspace shell，并显式传给 feature workbenches。
- [Risk] 移动 create/detail drawers 时可能丢失 dirty-state confirmation。→ Mitigation: 移动前识别每个 dirty guard，并为高风险 drawer flow 添加聚焦测试。
- [Risk] 移动 API calls 后 mutation invalidation 可能不完整。→ Mitigation: 保持现有 TanStack Query keys 和 invalidation calls 在迁移中可见；只有重复模式被验证后再集中化。
- [Risk] 因为没有完全 CSS modularization，CSS class collision 仍会存在。→ Mitigation: 接受这是第一阶段权衡；除非正确性需要，不重命名大范围 CSS。

## Migration Plan

1. 建立目标目录，移动 app composition、provider setup、route constants、theme config 和 workspace shell。
2. 抽取 API client primitives 和 endpoint modules，保持当前 request/response 行为不变。
3. 抽取 localization content 和 context localization helpers。
4. 抽取已经跨多个工作台复用的 shared UI/utilities。
5. 按垂直切片逐个移动 feature workbenches，先从低风险只读视图开始，再移动 mutation-heavy drawers。
6. 每个主要切片后运行 TypeScript/build 或聚焦测试，尽早捕获 import 和行为回归。
7. 最后将 `App.tsx` 收敛为组合入口，并在需要保持 demo 服务可用时运行完整 frontend verification path 和 smoke check。

Rollback strategy：本 change 不涉及后端或数据迁移，回滚可通过正常 git revert 完成。如果某个 feature extraction 中途出现回归，保留已经安全抽出的模块，只回退受影响的垂直切片。

## Open Questions

- CSS modularization 是否完全留给后续 change，还是在明显 feature-local 且安全时随工作台一起移动？
- 测试应该在每个高风险抽取前先写 characterization tests，还是抽取后围绕变化边界补？保守默认是先为 dirty drawer 和 global search 行为补 characterization tests，再移动这些区域。
