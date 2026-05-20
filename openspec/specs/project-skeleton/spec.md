# project-skeleton 规格

## Purpose

定义 Fox Procureflow MVP 的本地工程底座、前后端健康联通、采购工作台外壳、视觉基线和多公司演示上下文，确保后续采购业务切片可以复用同一套运行、接口、数据归属和非目标约定。

## Requirements

### Requirement: 本地开发底座启动所需服务
系统 SHALL 提供本地开发底座，启动后续采购切片所需的 MVP 基础设施服务。

#### Scenario: 启动本地基础设施
- **WHEN** 开发者通过文档命令启动本地基础设施
- **THEN** MySQL、MongoDB、Redis、RabbitMQ 和 MinIO MUST 通过稳定的本地服务名和文档端口可用

#### Scenario: 不包含被排除的可观测性和身份服务
- **WHEN** 开发者检查本地基础设施定义
- **THEN** Prometheus、Grafana、Jaeger、Zipkin 和 Keycloak MUST NOT 包含在 MVP skeleton 中

### Requirement: 后端服务暴露健康检查和 API 文档
系统 SHALL 使用 roadmap 后端技术栈提供可运行的 Fox Procureflow 后端服务，并暴露基础 REST API 面。

#### Scenario: 健康端点报告服务可用性
- **WHEN** 开发者启动后端服务并请求 `GET /api/health`
- **THEN** 系统 MUST 返回成功响应，其中包含服务状态和 Fox Procureflow 应用身份信息

#### Scenario: API 文档可访问
- **WHEN** 开发者启动后端服务并打开文档中的 Swagger UI URL
- **THEN** 系统 MUST 展示可用 skeleton 端点的生成式 API 文档

### Requirement: 前端外壳呈现采购工作台
系统 SHALL 提供可运行的前端应用外壳，用于集团内部采购工作台。

#### Scenario: 打开前端工作台
- **WHEN** 开发者启动前端并打开文档中的本地前端 URL
- **THEN** 系统 MUST 展示 Fox Procureflow 采购工作台，而不是营销落地页

#### Scenario: 验证前后端连通性
- **WHEN** 前端工作台加载且后端正在运行
- **THEN** 系统 MUST 调用后端健康检查端点，并在工作台中展示成功连接状态

### Requirement: 应用最终 F 库采 SaaS 视觉基线
前端外壳 SHALL 应用最终确认的 “F 库采 SaaS” 视觉基线，用于现代 B2B 采购与库存运营工具。

#### Scenario: 视觉基线使用约定设计 token
- **WHEN** 前端工作台被渲染
- **THEN** 系统 MUST 使用低饱和绿色品牌强调色，主色为 `#2f7a4d`，并使用浅灰主背景、白色面板、细边框和轻量阴影

#### Scenario: 视觉基线避免营销装饰
- **WHEN** 前端工作台被渲染
- **THEN** 系统 MUST 避免不服务于采购运营的 hero 营销布局、渐变、插画和装饰性视觉效果

### Requirement: 多公司演示上下文可见且被保留
系统 SHALL 将 MVP 呈现为集团内部多公司采购平台，并明确展示公司上下文。

#### Scenario: 外壳展示集团和公司上下文
- **WHEN** 用户查看前端工作台
- **THEN** 系统 MUST 展示星河控股集团上下文，以及至少一个来自 roadmap 演示公司的活跃公司上下文

#### Scenario: 表达公司隔离约定
- **WHEN** 开发者查看 skeleton 后端结构、前端上下文命名或 seed-data 占位
- **THEN** 系统 MUST 区分集团级共享数据（例如供应商池）和公司归属采购数据（例如申请、审批、订单、收货、发票和匹配结果）

### Requirement: 工程骨架不实现业务流程
系统 SHALL 将工程骨架聚焦在工程和视觉底座，同时保留后续业务流程扩展点。

#### Scenario: 业务模块仅为占位
- **WHEN** 开发者检查 skeleton 应用
- **THEN** 采购申请、审批、RFQ、PO、收货、发票和三单匹配能力 MUST 仅以导航、包、路由或文档占位形式存在

#### Scenario: 不把最终 AI 行为 mock 成生产功能
- **WHEN** 开发者检查 skeleton 应用
- **THEN** DeepSeek API 集成和 AI 采购助手行为 MUST NOT 呈现为最终生产功能

### Requirement: 开发者文档支持端到端验证
系统 SHALL 记录从全新 checkout 验证 skeleton 的最短路径。

#### Scenario: 使用统一启动脚本
- **WHEN** 开发者在仓库根目录运行 `scripts/launch.sh`
- **THEN** 脚本 MUST 启动或引导启动本地基础设施、后端和前端，然后打印前端 URL、后端健康检查 URL 和 Swagger UI URL

#### Scenario: 按文档启动路径操作
- **WHEN** 开发者按照文档中的本地启动说明操作
- **THEN** 开发者 MUST 能够启动基础设施、后端和前端，并验证前端工作台、后端健康端点和 Swagger UI

#### Scenario: 记录环境与端口
- **WHEN** 开发者阅读开发文档
- **THEN** 文档 MUST 列出所需工具、本地环境变量，以及前端、后端和基础设施服务的默认端口

### Requirement: 后端数据访问默认使用 Spring Data JPA 并保留扩展边界
后端 skeleton SHALL 默认使用 Spring Data JPA 作为 MySQL 数据访问层，同时为后续复杂采购查询保留扩展点。

#### Scenario: 默认关系型访问使用 Spring Data JPA
- **WHEN** 开发者检查后端关系型持久化依赖和 skeleton repository
- **THEN** 系统 MUST 使用 Spring Data JPA 作为 MySQL-backed skeleton 模块的默认数据访问方式

#### Scenario: 未来查询替代方案保持可引入
- **WHEN** 后续业务切片需要复杂读模型、报表查询、RFQ 对比或三单匹配投影
- **THEN** skeleton MUST 将数据访问保持在模块级 repository 或 service 边界之后，使 MyBatis Plus、native SQL 或专用读模型可由后续 change 引入，而无需替换 controller 契约
