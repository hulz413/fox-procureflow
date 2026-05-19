# Fox Procureflow MVP Roadmap

本文档记录 Fox Procureflow 的 MVP 产品边界、演示上下文和业务垂直切片拆分，作为后续逐一创建 OpenSpec change、实现功能和同步进度的需求总览。

## 产品定位

Fox Procureflow 是面向集团内部采购场景的多公司采购协同平台。MVP 聚焦一个集团下两个公司主体的采购业务闭环，展示从采购申请到审批、询报价、采购订单、收货、发票和三单匹配的完整流程。

命名约定：产品展示名称使用 `Fox Procureflow`，项目 slug / 仓库名使用 `fox-procureflow`。

## 固定产品边界

- 集团内部采购系统，不做对外 SaaS。
- MVP 演示一个集团下两个公司主体，具体名称以“演示基础数据”为准。
- 支持集团共享供应商池。
- 支持公司维度的数据隔离、审批规则和业务看板。
- MVP 必须包含三单匹配。
- MVP 核心业务闭环优先使用 MySQL 和同步服务调用实现；Redis、RabbitMQ 和 MinIO 不作为前中期 P0 切片的硬依赖。
- 真实附件上传放到 MVP 后段统一支持，在此之前 RFQ、收货和发票先记录附件意图、文件名或备注，不要求对象存储落地。
- MVP 暂不包含 Prometheus、Grafana、Jaeger/Zipkin、Keycloak。
- MVP 不做对外企业自助注册、套餐计费、订阅和多集团运营能力。

## 当前进度

更新时间：2026-05-19

- 已完成并归档 `bootstrap-project-skeleton`，主 spec 为 `project-skeleton`。当前工程具备本地基础设施、Spring Boot 后端、Swagger、React 工作台外壳、健康接口和 F「库采 SaaS」视觉基线。
- 已完成并归档 `establish-demo-master-data`，主 spec 为 `demo-master-data`。当前系统已具备星河集团演示主数据、只读 `/api/master-data/**` API、Swagger 文档、后端测试和前端“组织与主数据”视图。
- 已完成并归档 `implement-purchase-request-intake`，主 spec 为 `purchase-request-intake`。当前系统已具备公司级采购申请草稿创建、提交、列表、详情、明细行表格、主数据校验、Swagger 文档、后端测试和前端“采购申请”视图。
- 已完成并归档 `implement-approval-workflow`，主 spec 为 `approval-workflow`。当前系统已具备按公司、品类、金额匹配审批规则，提交申请后创建审批实例，审批中心待办、详情抽屉、通过、驳回、撤回、时间线和申请详情审批摘要。
- 已完成并归档 `implement-purchase-orders`，主 spec 为 `purchase-orders`。当前系统已具备从可比价 RFQ 报价创建 PO、发布/取消、公司级列表、详情抽屉、状态记录、交付计划和多状态 demo PO 数据。
- 当前 active OpenSpec change：暂无。
- 当前推荐实施切片：`收货与发票`。它应以已发布 PO 为上游入口，继续复用 MySQL 和同步服务调用；暂不要求 RabbitMQ 事件发布或真实附件上传。

## 演示基础数据

本节数据已经通过 Flyway/JPA 落库，并由只读主数据 API 暴露给前端。后续采购申请、审批、RFQ、PO、收货、发票和三单匹配切片应复用这些稳定业务 ID。

| 类型 | 名称 | 说明 |
|---|---|---|
| 集团 | 星河控股集团 | 演示用集团主体 |
| 公司 | 星河数字科技有限公司 | 覆盖 IT 设备、软件订阅、办公采购场景 |
| 公司 | 星河智能制造有限公司 | 覆盖生产耗材、设备备件、物流服务场景 |
| 供应商 | 上海云舟信息技术有限公司 | 软件订阅 / IT 服务 |
| 供应商 | 深圳蓝芯电子科技有限公司 | 笔记本 / 显示器 / 配件 |
| 供应商 | 苏州恒润工业设备有限公司 | 设备备件 / 维修服务 |
| 供应商 | 杭州诚采办公用品有限公司 | 办公用品 |
| 供应商 | 宁波安捷物流有限公司 | 物流服务 |

## 技术栈

| 分层 | 技术选型 | 用途 |
|---|---|---|
| Frontend | React、TypeScript、Vite | 构建前端应用、类型约束和本地开发构建 |
| UI / 交互 | Ant Design、React Router、TanStack Query、Zustand、React Hook Form、Zod、ECharts | 复杂表单、路由、服务端状态、轻量全局状态、表单校验和采购看板 |
| Backend | Java 21、Spring Boot、Spring Web、Spring Validation | 构建后端业务服务、REST API 和参数校验 |
| Security | Spring Security；JWT 后续专门切片引入 | 当前骨架放行健康、Swagger 和只读主数据接口；后续实现登录认证、接口鉴权和用户身份传递 |
| Data Access | Spring Data JPA 或 MyBatis Plus、Flyway、MapStruct；Spring Data MongoDB 后段引入 | 关系型数据访问、MySQL schema 迁移和 DTO 转换；MongoDB 留给动态表单、AI 审计和富上下文快照 |
| API Docs | `springdoc-openapi` + Swagger UI | 生成和查看接口文档 |
| Messaging | Spring AMQP、RabbitMQ 后段引入 | MVP 前中期优先同步触发；三单匹配稳定后再事件化 PO、收货和发票变化 |
| Storage | MySQL 为核心；MongoDB、Redis、MinIO 后段引入 | MySQL 存储核心交易数据；Redis 留给缓存和看板指标；MinIO 留给最终真实附件上传 |
| AI | DeepSeek API、OpenAI-compatible protocol | 采购申请草稿生成、风险提示、报价解释和三单匹配异常解释 |
| Local Development | Docker Compose | 本地至少启动 MySQL；MongoDB、Redis、RabbitMQ、MinIO 可作为已配置但后段才使用的预留服务 |
| Testing | JUnit 5、Mockito、Testcontainers、React Testing Library | 后端单元测试、集成测试和前端组件测试 |

## Roadmap

| 优先级 | 业务切片 | 业务目标 | 主要用户 | 演示场景 | 核心能力 | 后端 / 数据范围 | AI 范围 | OpenSpec 状态 |
|---|---|---|---|---|---|---|---|---|
| P0 | 基础组织与演示数据 | 建立集团、多公司、部门、用户、供应商基础上下文 | 系统管理员、演示人员 | 星河控股下两家公司使用共享供应商池 | 集团、公司、部门、用户、角色、供应商、采购品类、预算科目基础数据 | MySQL 存储组织、用户、供应商和品类；所有核心业务表预留公司隔离字段；准备稳定演示数据 | 暂不涉及 | 已完成并归档：`establish-demo-master-data` |
| P0 | 采购申请 Intake | 申请人能创建真实采购需求 | 申请人、采购员 | 星河数字科技采购 20 台笔记本；办公区会议用品补充采购草稿 | 采购申请草稿创建、提交、公司级列表、详情抽屉、明细行表格、预算科目、金额和交付日期校验 | MySQL 存储申请主数据、明细和字段快照；复用主数据中的公司、用户、部门、供应商、品类和预算科目 ID；当前切片不实现附件和下游流程 | P1 接入自然语言生成申请草稿 | 已完成并归档：`implement-purchase-request-intake` |
| P0 | 审批流 | 按公司、金额、品类生成审批路径 | 申请人、审批人、采购员 | IT 设备大额采购进入部门负责人 + 财务审批；设备备件采购进入生产负责人审批 | 提交、审批通过、驳回、撤回、审批时间线、审批规则匹配、审批详情抽屉 | MySQL 存储审批实例、节点、记录和上下文快照；待办直接按 MySQL 查询，暂不依赖 Redis | P1 接入审批前风险提示 | 已完成并归档：`implement-approval-workflow` |
| P0 | RFQ 询报价 | 采购员对已审批申请发起询价并比较报价 | 采购员、供应商管理员 | 三家供应商报价，系统展示价格、交期、评分、风险 | RFQ 创建、供应商选择、报价录入、报价对比、推荐排序；附件先记录文件名/说明，暂不做真实上传 | MySQL 存储 RFQ、报价、供应商评分和附件元数据占位；MinIO 后段统一接入真实报价附件 | P1 接入报价推荐解释 | 已完成并归档：`implement-rfq` |
| P0 | PO 采购订单 | 从中标报价生成采购订单 | 采购员、供应商管理员、财务人员 | 选择供应商后生成 PO 并发布 | PO 创建、发布、取消、状态记录、金额和税率记录、交付计划；详情禁用态提示原因，未提交操作输入关闭前二次确认 | MySQL 存储 PO 主数据、明细、税率和状态；暂不要求 RabbitMQ 事件发布；提供多状态 demo PO 数据 | 暂不涉及 | 已完成并归档：`implement-purchase-orders` |
| P0 | 收货与发票 | 支持 PO 后续收货、发票录入 | 采购员、仓储人员、财务人员 | 录入部分收货与供应商发票 | 收货登记、发票登记、附件信息记录、数量和金额记录 | MySQL 存储收货单、发票、明细和附件元数据占位；MinIO 后段统一接入发票文件和收货凭证真实上传；暂不要求 RabbitMQ 事件发布 | 暂不涉及 | 建议下一步 |
| P0 | 三单匹配 | 对 PO、收货、发票做差异识别 | 财务人员、采购员 | 发票金额比 PO 多 2,300，进入异常队列 | PO、收货单、发票三方数量和金额匹配；异常识别；异常队列；处理记录 | MySQL 存储匹配结果、差异项和处理记录；前期由业务服务同步触发匹配，RabbitMQ 事件触发后段增强 | P1 接入异常解释和处理建议 | 未开始 |
| P1 | 采购看板 | 展示集团和公司视角的采购状态 | 管理者、采购负责人、财务人员 | 查看待审批、采购金额、异常匹配、供应商分布 | 集团总览、公司筛选、采购金额趋势、待审批数量、异常匹配数量、供应商报价分布 | MySQL 聚合业务数据；Redis 指标缓存作为性能增强后段引入 | P1 可生成自然语言经营摘要 | 未开始 |
| P1 | AI 采购助手 | 用真实 DeepSeek API 提升申请和决策效率 | 申请人、采购员、财务人员 | 自然语言生成采购草稿、风险提示、报价解释、三单匹配异常解释 | DeepSeek 接入、Prompt 模板、结构化 JSON 输出、调用审计、脱敏处理、用户确认后进入正式业务流程 | ai-service 封装 OpenAI-compatible client；MongoDB 存储 AI 会话、输入输出和审计记录；环境变量注入 API key | 使用真实 DeepSeek API，不以 mock 作为最终方案 | 未开始 |
| P1 | 真实附件上传 | 在业务闭环稳定后支持报价、收货和发票文件上传 | 采购员、供应商管理员、仓储人员、财务人员 | 上传报价单、收货凭证和发票文件，并在对应业务单据中查看附件 | MinIO bucket、对象 key、文件元数据、上传/下载接口、大小和类型校验、业务单据附件关联 | MinIO 存储真实文件；MySQL 存储附件元数据和业务关联；覆盖 RFQ、收货和发票附件，不回补采购申请 Intake 附件 | 暂不涉及 | 未开始，放到核心业务闭环之后 |
| P2 | 工程化完善 | 提升本地开发、测试和交付体验 | 开发者、面试演示者 | Docker 启动基础设施，Swagger 查看接口，本机启动前后端完成演示 | Docker Compose、Swagger UI、基础测试、数据初始化、README 启动说明 | MySQL 为必需基础设施；MongoDB、Redis、RabbitMQ、MinIO 作为后段能力按切片接入；Flyway 管理 MySQL schema；JUnit 5、Mockito、Testcontainers 覆盖关键后端场景 | 暂不涉及 | 基础已完成并归档：`bootstrap-project-skeleton`；后续随业务切片持续补强 |

## 后续使用方式

- 每个业务切片应拆成一个或多个 OpenSpec change。
- 每个 change 应从真实演示场景出发，补充 `proposal.md`、`design.md`、`tasks.md` 和相关 `spec.md`。
- `OpenSpec 状态` 用于人工同步进度。已完成切片应标记归档 change；未启动切片标记 `未开始`；下一条推荐切片可标记 `建议下一步`。
- Roadmap 是需求总览，不替代正式 OpenSpec artifacts。
