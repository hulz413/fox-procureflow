## Context

Fox Procureflow 已完成采购申请、审批、RFQ、PO、收货、发票、三单匹配、采购看板、供应商池、AI 采购助手和真实附件上传等 MVP 能力。当前仓库已有 `scripts/launch.sh`、`README.md`、`docs/dev/local-development.md` 和 `docs/dev/verification-notes.md`，但这些内容是在多个业务切片过程中逐步累积的，尚未形成完整 MVP 交付视角的稳定闭环。

本 change 面向开发者和演示人员：他们需要从 fresh checkout 或日常开发环境中快速判断“这个仓库今天是否能完整演示星河控股集团下两家公司采购闭环”。多公司组织边界保持不变：供应商池属于集团共享数据；采购申请、审批、RFQ、PO、收货、发票、三单匹配和公司视角看板属于公司级业务数据；集团视角看板只能做汇总展示，不改变公司归属。

## Goals / Non-Goals

**Goals:**

- 提供清晰的 MVP 演示运行手册，覆盖从环境准备、启动、验证到业务入口的最短路径。
- 补强启动和 smoke 验证，让演示人员能区分依赖缺失、服务未启动、API 不健康、前端不可达和 AI/附件依赖不可用等情况。
- 建立可重复的验收记录格式，覆盖后端测试、前端 lint/build、Compose 配置、健康接口、OpenAPI、前端首页和关键 MVP 入口。
- 保持业务数据真实性：列表和演示入口继续依赖 Flyway seed、后端 API、MinIO、MongoDB 和真实业务流程，不用前端静态 mock 掩盖空列表。

**Non-Goals:**

- 不新增采购业务状态、业务 API、数据库业务表或审批/PO/收货/发票/三单匹配处理逻辑。
- 不把 Redis/RabbitMQ 引入为当前 smoke check 的硬依赖，也不实现三单匹配事件化。
- 不引入 Prometheus、Grafana、Jaeger/Zipkin、Keycloak 或新的运维平台。
- 不提供 AI mock 作为最终演示行为；未配置 provider key 时只验证 AI 不可用状态和审计依赖提示。

## Decisions

1. 将启动和验证拆成两个层次。

   `scripts/launch.sh` 继续作为本地聚合启动入口，负责启动基础设施、后端、前端并输出访问地址。MVP smoke 验证使用独立命令或脚本表达，负责检查已启动环境是否达到可演示状态。这样启动脚本不会因为某个非核心检查失败而变得难以使用，验证脚本也可以用明确 exit code 支撑交付检查。

   备选方案是把所有 smoke check 都塞进 `launch.sh`。这会让一个日常开发脚本承担过多职责，也更难处理“只启动不验证”或“复用已有服务只验证”的场景。

2. Smoke check 采用 read-only 优先。

   MVP 交付验证优先检查 Compose 配置、服务端口、`/api/health`、OpenAPI JSON、前端首页和关键 API/页面可达性。对采购申请、审批、RFQ、PO、收货、发票和三单匹配的状态流转，只验证已有 seed/demo 数据和页面入口是否能支撑演示，不在 smoke check 中自动创建或推进业务单据。

   这样可以避免每次验证都污染演示数据，也能保持公司级数据归属稳定。业务状态一致性仍由现有后端测试和各业务切片的服务逻辑保障。

3. 演示运行手册按业务闭环组织，而不是按技术层组织。

   文档应从星河控股集团、多公司上下文和采购闭环出发，列出演示者应打开的工作台入口和关键观察点：供应商池、采购申请、审批中心、RFQ、PO、收货发票、三单匹配、采购看板、AI 建议和附件下载。技术命令放在支持章节中，避免演示人员在业务叙事和环境命令之间来回跳。

4. AI 和附件能力使用“可用性分层”表达。

   MinIO 是真实附件上传/下载的运行依赖，MongoDB 是 AI 审计运行依赖，AI provider key 是真实模型调用依赖。交付验证必须能说明：未配置 AI key 时，核心采购闭环仍可演示；配置 AI key 且 MongoDB 可用时，AI 入口可以调用真实 OpenAI-compatible provider；附件上传下载依赖 MinIO bucket 和后端文件校验。

5. 权限和数据隔离不在此 change 中新增机制。

   当前本地演示仍使用既有公司上下文和 API 参数表达公司边界。本 change 只要求文档和 smoke check 明确公司维度：星河数字科技有限公司与星河智能制造有限公司的采购交易数据不可混淆，集团共享供应商池可以被两家公司共同查看。不会新增登录、JWT、角色权限或企业自助注册。

## Risks / Trade-offs

- [Risk] Smoke check 过重导致每次本地验证耗时太长 → Mitigation: 区分快速 smoke、完整测试和人工演示检查，默认 smoke 只做可演示状态检查。
- [Risk] 文档和脚本随着业务入口变化而过期 → Mitigation: 在验证记录中列出更新时间、命令和已检查入口；后续业务 change 修改演示入口时同步更新 runbook。
- [Risk] 自动验证无法覆盖所有前端交互细节 → Mitigation: 自动 smoke 覆盖服务健康和入口可达性，人工 runbook 覆盖关键业务路径和视觉检查。
- [Risk] AI provider key 缺失被误判为 MVP 失败 → Mitigation: 文档和验证脚本明确区分核心采购闭环可用、AI 已禁用、AI 真实调用可用三种状态。
- [Risk] 本地端口已有旧服务导致演示数据不一致 → Mitigation: 启动说明保留停止旧 `8080`/`5173` listener 的行为，并在故障排查中提示端口和 Compose project 检查。
