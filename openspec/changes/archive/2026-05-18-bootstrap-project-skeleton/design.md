## Context

当前仓库只有 MVP roadmap 和 OpenSpec 配置，还没有前端、后端、本地基础设施或可运行演示入口。Roadmap 已经确定 Fox Procureflow 是集团内部采购协同平台，MVP 演示星河控股集团下的两家公司和共享供应商池，后续业务切片会覆盖采购申请、审批、RFQ、PO、收货、发票和三单匹配。

本设计把项目骨架作为第一条可演示业务底座：开发者能在本地启动基础设施、后端和前端；演示人员能看到带公司上下文的采购工作台外壳；后续 P0 切片能复用统一的目录结构、API 约定和视觉基线。

多公司边界在骨架阶段以“上下文和约定”落地，不实现完整租户权限：前端展示集团、公司切换和公司维度导航；后端包结构、配置和后续数据模型约定预留 `groupId` / `companyId`；共享供应商池属于集团级数据，采购申请、审批、PO、收货、发票和三单匹配属于公司级数据。

## Goals / Non-Goals

**Goals:**

- 建立 `frontend/`、`backend/`、`infra/` 和开发文档目录，形成清晰的前后端分离项目骨架。
- 前端提供 Fox Procureflow 工作台外壳，使用最终对齐的「F 库采 SaaS」视觉效果：现代 B2B SaaS 后台、固定左侧导航、浅灰主背景、白色面板、细边框、极少阴影、低饱和绿色品牌强调色。
- 后端提供可运行 Spring Boot 服务、健康接口、Swagger UI 和后续业务模块扩展的包结构。
- Docker Compose 提供 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO，用于后续核心交易、动态表单、缓存/待办、事件和附件能力。
- 前端通过 TanStack Query 调用后端健康接口，验证本机前后端联通。
- README 或开发文档说明本地启动路径、端口、环境变量和常见验证命令。

**Non-Goals:**

- 不实现真实登录、JWT 签发、用户权限矩阵或公司数据隔离查询逻辑。
- 不实现采购申请、审批、RFQ、PO、收货、发票、三单匹配的业务状态机和一致性逻辑。
- 不创建完整业务表结构，只保留 Flyway 和数据初始化位置。
- 不接入 DeepSeek API，不实现 AI 采购助手。
- 不加入 Prometheus、Grafana、Jaeger/Zipkin 或 Keycloak。

## Decisions

### 1. 采用前后端分离的三段目录结构

项目根目录使用：

- `frontend/`：React + TypeScript + Vite 前端应用。
- `backend/`：Java 21 + Spring Boot 后端服务。
- `infra/`：Docker Compose 和本地基础设施配置。
- `docs/dev/`：本地开发、端口和启动说明。
- `scripts/`：本地开发辅助脚本。

理由：Roadmap 明确本地运行策略是 Docker 跑数据库/中间件，本机跑 React 前端和 Java 后端。三段结构让业务切片后续可以独立演进，同时保持演示启动路径清楚。

根目录提供 `scripts/launch.sh` 作为轻量聚合启动入口，用于按顺序拉起 Docker 基础设施、后端和前端，并输出前端、健康接口和 Swagger UI 地址。`bootstrap.sh` 更适合表达一次性初始化或依赖安装，不作为日常开发启动脚本名称；如果后续需要首次环境准备，可另增 `scripts/bootstrap.sh`。

替代方案：单体目录或 monorepo workspace 聚合所有脚本。当前仓库还没有多包复杂度，先保持目录直观，只增加 `scripts/launch.sh` 这类轻量脚本，不引入复杂任务编排器。

### 2. 前端以 Vite React TS 建立应用壳

前端骨架使用 Vite React TypeScript，保留标准 `dev`、`build`、`preview` 脚本，并加入 Ant Design、React Router、TanStack Query、Zustand、React Hook Form、Zod 和 ECharts 作为 roadmap 指定依赖。

首屏不是营销页，而是采购运营工作台：固定左侧导航、顶部公司上下文、KPI、采购金额趋势、近期采购申请、采购流程、风险待办和供应商分布。页面数据可以先使用静态演示数据，健康状态来自后端接口。

理由：MVP 面向内部采购操作人员，首屏应支持扫描和重复处理业务，不做 landing page 或宣传型 hero。

### 3. 视觉基线采用最终「F 库采 SaaS」

前端主题使用低饱和绿色和克制后台界面语言：

- 品牌主色：`#2f7a4d`
- 主背景：`#f5f6f4`
- 面板：`#ffffff`
- 次级面板：`#f8f9f7`
- 边框：`#dde2dc`
- 正文：`#1e2723`
- 弱文本：`#707771`
- 导航激活背景：`#edf4ef`
- 警示色：`#8f7a45`
- 危险色：`#95605c`

布局和组件原则：

- 固定左侧导航，主区域浅灰背景，内容使用白色面板和细边框。
- 极少使用阴影，避免渐变、插画、营销装饰和高饱和大色块。
- 卡片圆角控制在 8px 以内，表格、状态标签、流程节点保持运营工具信息密度。
- Ant Design token 和自定义 CSS 变量应统一承载这些颜色，避免业务页面各自硬编码。

替代方案：标准蓝白或高密 ERP 风格。蓝白更通用但品牌识别弱，高密 ERP 信息密度更强但初期显得偏旧；F 风格在现代感、专业感和采购/库存语境之间更均衡。

### 4. 后端以 Spring Boot REST API 骨架启动

后端使用 Java 21 和 Spring Boot，采用 Gradle 构建，先包含 Web、Validation、Security、Spring Data JPA、Spring Data MongoDB、Flyway、AMQP、MapStruct、springdoc-openapi 和测试依赖。

骨架阶段默认使用 Spring Data JPA 作为 MySQL 数据访问层。为了保留可拓展性，业务模块通过领域服务和 repository 接口暴露数据访问意图，避免控制器或应用服务直接依赖复杂查询细节；后续如果采购看板、RFQ 比价或三单匹配出现 JPA 不适合表达的复杂查询，可以通过独立 change 引入 MyBatis Plus、专用 read model 或原生 SQL 查询，而不重写业务入口。

初始 API 范围：

- `GET /api/health`：返回服务状态、应用名、当前时间和演示上下文摘要。
- Swagger UI：用于验证 API 文档入口。

包结构建议：

- `config`：安全、CORS、OpenAPI、跨模块配置。
- `common`：通用响应、错误模型、时间和标识辅助类型。
- `identity`：集团、公司、用户、角色上下文占位。
- `procurement`：后续采购申请、RFQ、PO 等业务模块占位。
- `matching`：后三单匹配模块占位。

Spring Security 在骨架阶段只做安全链占位，允许健康接口和 Swagger UI 访问；完整 JWT 登录和权限过滤留给后续专门 change。

### 5. 本地基础设施按 MVP 终态提前对齐

`infra/docker-compose.yml` 提供：

- MySQL：核心交易、组织、供应商、品类和后续业务表。
- MongoDB：动态表单 schema、表单快照、审批上下文和 AI 审计记录。
- Redis：缓存、待办数量和看板指标缓存。
- RabbitMQ：采购申请、PO、收货、发票和三单匹配事件。
- MinIO：附件、报价文件、发票文件和收货凭证。

骨架阶段只要求容器可启动和配置可被后端读取，不要求所有服务已经被业务代码深度使用。

### 6. 多公司数据归属和权限影响

骨架阶段建立以下约定：

- 集团级共享数据：供应商池、采购品类模板、集团级看板汇总。
- 公司级隔离数据：采购申请、审批实例、RFQ、报价评审、PO、收货单、发票、三单匹配结果。
- 所有后续核心业务表必须预留公司隔离字段；后端 API 后续通过认证上下文或请求上下文解析 `companyId`。
- 前端应用壳必须在顶部或侧边明确显示当前公司，并为后续公司切换器保留交互位置。

权限影响：本 change 不做强鉴权，但不能把未来权限边界写死成单公司。所有示例数据和路由命名都应体现星河控股集团下两家公司语境。

## Risks / Trade-offs

- [Risk] 骨架一次性引入的依赖较多，初次配置可能增加搭建时间。→ Mitigation：只实现最小可运行路径，业务使用在后续切片中逐步打开。
- [Risk] 前端静态演示数据可能被误认为真实业务实现。→ Mitigation：页面文案和代码命名保持 `demo` / `mock` 语义，README 明确本 change 只提供工作台外壳。
- [Risk] Security 占位配置若过宽，后续容易遗留到业务接口。→ Mitigation：仅允许健康和文档入口，后续业务 change 必须补 JWT 和公司权限规格。
- [Risk] 本地 Docker 服务较多，机器资源占用偏高。→ Mitigation：README 说明按需启动和端口，Docker Compose 使用稳定服务名，后续可拆分 profile。
- [Risk] 视觉 token 若散落在多个文件，后续页面会走样。→ Mitigation：集中在前端主题文件和全局样式中定义 F 风格 token。

## Migration Plan

这是新仓库的首个工程骨架 change，不涉及线上迁移。实施时按顺序新增目录和配置；若启动验证失败，可回滚本 change 新增的 `frontend/`、`backend/`、`infra/` 和开发文档。

## Open Questions

- 无。
