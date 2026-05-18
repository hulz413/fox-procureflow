## Context

`project-skeleton` 已经归档为正式 spec，当前系统具备 React 工作台外壳、Spring Boot 后端、Swagger、MySQL/MongoDB/Redis/RabbitMQ/MinIO 本地基础设施和 `GET /api/health`。骨架中已有 `DemoOrganizationService` 与 `demo_company_context` 占位表，用于展示星河控股集团和两家公司上下文，但还没有可复用的部门、用户、角色、供应商、采购品类和预算科目。

P0 后续业务切片会依次实现采购申请 Intake、审批流、RFQ、PO、收货、发票和三单匹配。它们都需要稳定的 `companyId`、`userId`、`supplierId`、`categoryId`、`budgetAccountId` 等引用数据。如果这些标识在各业务切片里重复硬编码，后续审批规则、RFQ 供应商选择和三单匹配演示数据会变得脆弱。

本 change 将基础组织与演示数据作为第一条业务底座切片：以 MySQL/Flyway 管理真实 seed data，以只读 API 和前端验证视图证明集团共享数据与公司级数据隔离边界。

## Goals / Non-Goals

**Goals:**

- 建立星河控股集团、星河数字科技有限公司、星河智能制造有限公司的稳定组织上下文。
- 建立部门、用户、角色、用户角色关联，覆盖申请人、审批人、采购员、财务人员、仓储人员、系统管理员和演示人员。
- 建立集团共享供应商池，包含 roadmap 中的 5 家演示供应商。
- 建立采购品类和公司级预算科目，为后续采购申请、审批规则、RFQ 和看板提供稳定引用。
- 提供只读基础数据 API，并在 Swagger/OpenAPI 中可见。
- 前端新增基础资料验证视图，从后端读取并展示公司上下文、供应商池、品类、预算科目和数据归属说明。
- 让 `GET /api/health` 或新的上下文 API 复用真实基础数据服务，避免演示上下文继续只由硬编码维护。

**Non-Goals:**

- 不实现真实登录、JWT 签发、权限矩阵或用户管理 CRUD。
- 不实现供应商门户、供应商自助维护、品类维护或预算科目维护表单。
- 不实现采购申请、审批、RFQ、PO、收货、发票、三单匹配或 AI 助手。
- 不使用 MongoDB、Redis、RabbitMQ 或 MinIO 承载本切片的核心行为；这些基础设施继续为后续业务切片预留。
- 不引入新的外部依赖或任务编排框架。

## Decisions

### 1. MySQL/Flyway 作为基础数据事实来源

新增 Flyway migration `V2__create_demo_master_data.sql`，创建规范化的演示基础数据表并写入稳定 seed data。核心表建议：

- `demo_groups`
- `demo_companies`
- `demo_departments`
- `demo_users`
- `demo_roles`
- `demo_user_roles`
- `demo_suppliers`
- `demo_procurement_categories`
- `demo_supplier_categories`
- `demo_budget_accounts`

所有表保留内部自增主键和稳定业务 ID。业务 ID 使用可读、可迁移的字符串，例如 `group-xinghe`、`company-digital`、`supplier-bluechip`、`category-it-hardware`、`budget-digital-it-equipment`。后续业务表应引用稳定业务 ID 或通过服务层解析到内部主键，避免测试和演示数据依赖数据库自增值。

替代方案：继续硬编码 Java/前端 demo data。这个方案短期最快，但会让后续业务切片各自维护基础数据，破坏三单匹配等端到端演示的一致性。

替代方案：用 JSON/YAML 文件作为 seed data。文件便于编辑，但后续 JPA 查询、Swagger API 和公司级隔离测试仍需要落库，最终还要迁移到 MySQL。

### 2. 不破坏骨架占位表，逐步替换读取路径

`V1__create_identity_placeholders.sql` 已创建 `demo_company_context`。本 change 不做破坏性删除或重写历史 migration，而是通过 `V2` 增加正式基础数据表。实现时可以保留 `demo_company_context` 作为骨架兼容表，但新的 `DemoOrganizationService` 应优先从 `demo_groups` 和 `demo_companies` 聚合上下文。

理由：Flyway migration 一旦存在就不应在后续 change 中重写；追加 migration 更适合本地多人协作和后续归档。

### 3. API 按只读 reference data 边界暴露

后端新增 `identity` 或 `masterdata` 模块内的 controller/service/repository，优先使用 Spring Data JPA。建议 API：

- `GET /api/master-data/context`：返回集团、当前默认公司、公司列表、数据归属说明。
- `GET /api/master-data/companies`：返回两家公司及业务范围。
- `GET /api/master-data/companies/{companyId}/departments`：返回指定公司部门。
- `GET /api/master-data/companies/{companyId}/users`：返回指定公司用户和角色摘要。
- `GET /api/master-data/suppliers`：返回集团共享供应商池，可按 `categoryId` 过滤。
- `GET /api/master-data/categories`：返回采购品类。
- `GET /api/master-data/companies/{companyId}/budget-accounts`：返回指定公司预算科目。

所有接口本切片只读，返回 `ApiEnvelope<T>`，并提供空结果或 404/400 的明确行为。不存在的 `companyId` 应返回客户端可理解的错误，而不是默默回退到默认公司。

替代方案：单个大接口返回所有基础数据。大接口适合演示，但后续 Intake、审批和 RFQ 会按上下文分别查询；拆分 API 更贴近后续业务复用。

### 4. 公司隔离与集团共享数据边界

基础数据按归属分层：

- 集团级共享：集团、供应商池、采购品类、供应商品类关联。
- 公司级隔离：部门、用户、预算科目、后续采购申请和业务单据。
- 跨层引用：用户属于公司和部门；预算科目属于公司；供应商可被两家公司共同选择，但后续 RFQ/PO 记录属于公司。

本 change 不做强权限过滤，但所有公司级 API 都必须显式接受 `companyId` 并只返回该公司的部门、用户和预算科目。后续 JWT change 可以把 `companyId` 从认证上下文解析出来，并复用同一服务边界。

### 5. 前端用“基础资料”视图验证数据闭环

前端保留现有工作台，不做营销页。新增一个运营工具式的基础资料视图，包含：

- 公司上下文和公司切换/筛选。
- 集团共享供应商池表格，展示供应商名称、服务范围、品类、风险等级或状态。
- 采购品类列表。
- 当前公司部门、用户角色和预算科目。
- 数据边界说明：集团共享供应商池 vs 公司级基础数据。

页面使用现有 Ant Design、TanStack Query、React Router 和 F「库采 SaaS」视觉 token。视图只读，不提供新增、编辑、删除按钮，避免误导为完整主数据管理系统。

### 6. 骨架阶段安全策略继续保持演示可访问

由于完整 JWT 登录不是本 change 范围，基础数据只读接口在本地演示阶段应与健康接口、Swagger 一样可访问，或通过当前骨架安全配置明确放行 `/api/master-data/**`。后续认证 change 必须重新收紧业务接口访问，并将公司上下文从认证信息或显式切换器中解析。

替代方案：现在就实现 JWT。它会把本切片从“基础数据闭环”扩大成认证/权限切片，影响后续垂直拆分节奏。

## Risks / Trade-offs

- [Risk] 基础数据表一次性建太多，可能拖慢第一条业务切片。→ Mitigation：只实现 roadmap P0 必须复用的字段，避免维护型 CRUD、审计流和复杂权限。
- [Risk] 放行只读基础数据接口会形成后续安全债。→ Mitigation：在 Security 配置和文档中标记为骨架/演示阶段放行，后续 JWT change 必须接管。
- [Risk] `demo_company_context` 与新 `demo_companies` 同时存在，容易造成数据来源混乱。→ Mitigation：服务层统一从新基础数据表读取，旧表只作为骨架历史兼容，不再扩展。
- [Risk] 供应商与品类 seed data 过少，后续 RFQ 比价不够丰富。→ Mitigation：本切片覆盖 5 家 roadmap 供应商和基础品类；RFQ change 可追加报价、评分和风险字段。
- [Risk] 后续业务切片如果直接复制 seed ID，会形成散落常量。→ Mitigation：集中提供后端 fixture/测试辅助和前端 API client 类型，业务切片通过 API 或测试 fixture 复用。

## Migration Plan

1. 新增 `V2__create_demo_master_data.sql`，只追加表和 seed data，不修改已发布的 V1 migration。
2. 新增 JPA entity/repository/service 聚合基础数据。
3. 将 `DemoOrganizationService` 改为读取新基础数据表；若数据库未初始化失败，应通过测试暴露问题，不做静默硬编码回退。
4. 新增只读 API 和 Swagger 描述。
5. 前端新增基础资料视图并接入 API。
6. 验证后端测试、前端构建、Docker Compose 环境下 health/API/Swagger/页面可用。

回滚策略：回滚本 change 新增代码与 `V2` migration；本地开发库可删除 volume 后重新执行 Flyway。由于当前没有线上环境，不涉及生产数据迁移。

## Open Questions

- 是否需要在本切片中把 `demo_company_context` 标记为 deprecated，还是留到后续清理 change 处理？
- 预算科目是否需要先预留年度、币种和冻结状态字段？建议本切片只保留后续 Intake 校验所需的最小字段。
