## ADDED Requirements

### Requirement: MVP 演示 runbook 记录完整交付路径
系统 SHALL 提供面向人的 MVP 演示 runbook，说明如何准备、启动、验证和演示作为集团内部多公司采购平台的 Fox Procureflow。

#### Scenario: 按全新 checkout 演示路径操作
- **WHEN** 开发者或演示操作员从全新 checkout 按文档中的 MVP 演示路径操作
- **THEN** 文档 MUST 引导他们完成环境前置条件、`.env` 设置、基础设施启动、后端启动、前端启动，以及演示所需的本地 URL

#### Scenario: 演示集团和公司上下文
- **WHEN** 演示操作员使用 runbook 呈现 MVP
- **THEN** runbook MUST 识别星河控股集团、星河数字科技有限公司、星河智能制造有限公司、共享供应商池和公司归属采购交易区域

#### Scenario: 解释可选 AI 可用性
- **WHEN** runbook 描述 AI 采购助手行为
- **THEN** 它 MUST 区分核心采购流程与可选真实 provider 调用，后者需要 `OPENAI_COMPATIBLE_ENABLED=true`、provider API key 和 MongoDB 审计存储

### Requirement: 本地启动流程报告演示就绪服务地址
系统 SHALL 提供本地启动流程，用于启动或引导启动所需 MVP 服务，并报告检查演示就绪状态所需的地址。

#### Scenario: 启动本地 MVP 服务
- **WHEN** 开发者在仓库根目录运行文档中的启动命令
- **THEN** 系统 MUST 启动或引导启动 Docker 基础设施、Spring Boot 后端和 Vite 前端，然后打印前端、后端健康检查、Swagger UI、RabbitMQ management 和 MinIO console 地址

#### Scenario: 检测不受支持的本地运行时
- **WHEN** 启动流程检测到缺少 Docker Compose、Java 21 不可用、缺少 npm，或 Node.js 低于 Vite 要求版本
- **THEN** 它 MUST 打印可执行的修复指引，而不是将环境呈现为 demo-ready

#### Scenario: 避免陈旧本地应用监听器
- **WHEN** 后端或前端端口已被本地 listener 占用
- **THEN** 启动流程 MUST 在启动当前仓库服务前停止或明确报告陈旧 listener

### Requirement: MVP 冒烟验证检查关键本地表面
系统 SHALL 提供可重复的 smoke 验证路径，用于检查本地 MVP 是否可支持完整演示，且不变更采购业务状态。

#### Scenario: 验证后端和 API 文档
- **WHEN** smoke 验证针对已启动本地环境运行
- **THEN** 它 MUST 使用真实后端响应验证后端健康端点、Swagger UI 或 OpenAPI JSON，以及核心 API 可用性

#### Scenario: 验证前端可达性
- **WHEN** smoke 验证针对已启动本地环境运行
- **THEN** 它 MUST 验证前端工作台在文档 URL 上可响应，并且不需要前端静态 mock 数据展示采购内容

#### Scenario: 验证基础设施就绪
- **WHEN** smoke 验证检查基础设施
- **THEN** 它 MUST 验证 MySQL 作为必需核心数据存储，并报告 MongoDB 和 MinIO 对 AI 审计与文件附件场景的就绪情况

#### Scenario: 保留采购业务状态
- **WHEN** smoke 验证检查采购申请、审批、RFQ、PO、收货、发票、三单匹配、看板、供应商、AI 或附件
- **THEN** 它 MUST 优先使用只读检查，并且 MUST NOT 自动创建、通过、取消、收货、开票、解决或删除业务记录

### Requirement: 验证记录捕获当前 MVP 交付状态
系统 SHALL 维护面向开发者的验证说明，记录最新 MVP 交付检查和已知环境注意事项。

#### Scenario: 记录自动化验证命令
- **WHEN** 某个 change 更新 MVP 交付验证
- **THEN** 验证说明 MUST 列出用于后端测试、前端 lint 或 build、Docker Compose 解析、健康检查、OpenAPI 检查和前端可达性检查的命令

#### Scenario: 记录手工演示覆盖范围
- **WHEN** 完整 MVP 演示路径被手工检查
- **THEN** 验证说明 MUST 记录已检查的业务工作台入口，以及每个入口使用的公司上下文或集团上下文

#### Scenario: 记录未解决注意事项
- **WHEN** 某个验证步骤无法在当前环境完成
- **THEN** 验证说明 MUST 记录被跳过或失败的步骤、原因和残余演示风险

### Requirement: 交付加固遵守 MVP 范围边界
系统 SHALL 在不扩展当前 MVP roadmap 产品范围的前提下提升交付信心。

#### Scenario: 避免新增基础设施范围
- **WHEN** 交付加固被实现
- **THEN** 它 MUST NOT 增加 Prometheus、Grafana、Jaeger、Zipkin、Keycloak、Redis hard dependency、RabbitMQ hard dependency 或新的外部服务

#### Scenario: 避免新增采购流程行为
- **WHEN** 交付加固被实现
- **THEN** 它 MUST NOT 增加新的采购申请、审批、RFQ、PO、收货、发票、三单匹配、供应商、看板、AI 或附件业务行为

#### Scenario: 保留多公司数据边界
- **WHEN** 脚本或文档引用演示数据
- **THEN** 它们 MUST 保留星河数字科技有限公司和星河智能制造有限公司的集团共享供应商与公司归属采购交易之间的区别
