# procurement-dashboard 规格

## Purpose

定义 Fox Procureflow 的只读采购看板，覆盖明确的集团和公司范围、后端聚合语义、chart-ready 指标、前端管理看板行为，以及排除延期基础设施和 AI 生成摘要的边界。

## Requirements

### Requirement: 采购看板 暴露明确集团和公司范围
系统 SHALL 提供只读采购看板，可按演示集团或某个所选公司聚合数据，并具备明确范围语义和公司归属校验。

#### Scenario: 查询集团看板
- **WHEN** 具备看板权限的调用方请求 `GET /api/procurement-dashboard?scope=GROUP&actorId=user-digital-admin`
- **THEN** 系统 MUST 返回跨星河数字科技有限公司和星河智能制造有限公司聚合的 看板数据
- **AND** 响应 MUST 将范围标识为 `GROUP`，包含演示集团标识，并包含生成时间戳

#### Scenario: 查询公司看板
- **WHEN** 具备看板权限的调用方请求 `GET /api/procurement-dashboard?scope=COMPANY&companyId=company-digital&actorId=user-digital-finance`
- **THEN** 系统 MUST 仅返回从 `company-digital` 归属记录聚合的 看板数据
- **AND** 响应 MUST 将范围标识为 `COMPANY`，包含 `company-digital`，并包含公司展示名称
- **AND** 响应 MUST NOT 包含属于 `company-manufacturing` 的采购记录

#### Scenario: 拒绝普通申请人访问看板
- **WHEN** 角色仅为 `role-applicant` 的申请人请求采购看板
- **THEN** 系统 MUST 以 `403 Forbidden` 拒绝请求
- **AND** 响应 MUST NOT 包含集团或公司采购指标、异常亮点或供应商分布数据

#### Scenario: 拒绝没有有效公司的公司看板
- **WHEN** 调用方请求公司看板 但缺少或使用未知 `companyId`
- **THEN** 系统 MUST 以客户端可见的 4xx 错误拒绝请求
- **AND** 系统 MUST NOT 回退到活跃演示公司

### Requirement: 看板汇总采购生命周期指标
系统 SHALL 使用现有采购申请、审批、RFQ、采购订单、收货、发票和三单匹配数据汇总当前采购生命周期。

#### Scenario: 返回 看板摘要指标
- **WHEN** 调用方查询 `company-digital` 的采购看板
- **THEN** 响应 MUST 包含采购金额、待审批、活跃 RFQ、已发布采购订单、收货或发票跟进、三单匹配异常等摘要指标
- **AND** 每个指标 MUST 包含稳定 key、展示标签、数值、可选币种以及来源时间戳或生成时间戳

#### Scenario: 从已发布采购订单计算采购金额
- **WHEN** 看板为所选范围计算采购金额
- **THEN** 金额 MUST 从该范围内已发布采购订单总金额聚合而来
- **AND** 草稿或已取消采购订单 MUST NOT 增加已发布采购金额

#### Scenario: 统计待审批工作
- **WHEN** 看板为所选范围计算待审批数量
- **THEN** 数量 MUST 包含该范围公司归属的 活跃或进行中 审批工作
- **AND** 已完成、已驳回或已撤回审批实例 MUST NOT 计入待审批工作

#### Scenario: 统计匹配异常
- **WHEN** 看板为所选范围计算匹配异常
- **THEN** 数量 MUST 包含当前状态为 `EXCEPTION` 的三单匹配结果
- **AND** 已匹配、待输入和已解决匹配结果 MUST NOT 计为活跃异常

### Requirement: 看板提供趋势、漏斗、分布和异常亮点
系统 SHALL 暴露 chart-ready 数据集，帮助管理者理解采购进展、供应商集中度和财务风险。

#### Scenario: 返回采购金额趋势
- **WHEN** 调用方查询集团范围看板
- **THEN** 响应 MUST 包含按月份或演示报告周期分组的采购金额趋势
- **AND** 每个趋势点 MUST 包含期间、金额、币种和来源单据数量

#### Scenario: 返回采购单据漏斗
- **WHEN** 调用方查询所选范围看板
- **THEN** 响应 MUST 包含采购申请、已审批申请、可对比 RFQ、已发布采购订单、已收货采购订单、已开票采购订单和已匹配采购订单的漏斗数量
- **AND** 数量 MUST 基于后端数据计算，而不是前端静态常量

#### Scenario: 返回状态分布
- **WHEN** 调用方查询所选范围看板
- **THEN** 响应 MUST 至少包含审批、RFQ、采购订单、收货、发票和三单匹配记录的状态分布
- **AND** 每个分布 bucket MUST 包含状态、数量和业务标签

#### Scenario: 返回供应商分布
- **WHEN** 调用方查询所选范围看板
- **THEN** 响应 MUST 包含基于该范围内供应商相关 RFQ quote 或采购订单记录的供应商分布数据
- **AND** 供应商主数据 MAY 来自集团共享供应商池，但交易金额和数量 MUST 保持在所选公司范围内

#### Scenario: 返回匹配异常亮点
- **WHEN** 所选范围包含三单匹配异常
- **THEN** 响应 MUST 包含异常亮点，包括匹配标识、公司标识、PO 编号或 PO 标识、供应商、严重程度、发票差异和最后计算时间戳
- **AND** 亮点 MUST 排序，使最严重或最新的异常优先可见

### Requirement: 看板 API 已文档化并保持只读
系统 SHALL 记录 看板 API，并保持 看板能力不包含业务变更、延期基础设施或 AI 生成摘要。

#### Scenario: Swagger 记录采购看板 端点
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** API 文档 MUST 包含采购看板 端点、查询参数、范围值和响应结构

#### Scenario: 看板查询不变更采购记录
- **WHEN** 调用方查询采购看板
- **THEN** 系统 MUST NOT 创建、更新或删除采购申请、审批实例、RFQ、采购订单、收货、发票、三单匹配结果、处理记录、已上传文件或付款记录

#### Scenario: 看板不需要延期基础设施或 AI
- **WHEN** 开发者在 MVP 本地环境中运行采购看板
- **THEN** 看板 MUST 使用 MySQL-backed 现有业务数据和同步请求处理
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak、DeepSeek 或其他 AI 服务

### Requirement: 前端提供管理型采购看板
前端 SHALL 提供真实采购看板 页面，让管理者使用后端 看板 API 查看集团和公司采购状态。

#### Scenario: 从导航打开采购看板
- **WHEN** 具备看板权限的用户在工作台导航中选择“采购看板”或打开应用根路由
- **THEN** 前端 MUST 展示采购看板 页面
- **AND** 页面 MUST 从后端 API 加载 看板数据，而不是前端静态 mock 数据

#### Scenario: 普通申请人不显示采购看板 入口
- **WHEN** 当前演示角色为普通申请人
- **THEN** 前端 MUST NOT 在侧边导航中展示“采购看板”
- **AND** 如果申请人直接打开应用根路由，前端 MUST 导航到其可访问的采购申请工作台

#### Scenario: 切换 看板范围
- **WHEN** 用户在集团摘要和具体公司之间切换 看板范围
- **THEN** 前端 MUST 为所选范围请求 看板数据
- **AND** 可见 KPI cards、charts、distributions 和 exception highlights MUST 刷新以匹配该范围

#### Scenario: 查看看板 KPI 和图表区域
- **WHEN** 看板数据加载成功
- **THEN** 页面 MUST 展示采购金额、待审批、活跃 RFQ、已发布采购订单和匹配异常的 KPI cards
- **AND** 页面 MUST 展示采购金额趋势、采购单据漏斗、状态分布和供应商分布的 chart-ready 视图

#### Scenario: 查看异常亮点
- **WHEN** 看板响应包含匹配异常亮点
- **THEN** 前端 MUST 展示异常公司、PO 或匹配引用、供应商、严重程度、发票差异和最后计算时间戳
- **AND** 前端 SHOULD 提供到三单匹配页面的导航路径，用于详细处理

#### Scenario: 无静态填充地展示真实空状态
- **WHEN** 所选公司在某个 看板区域没有记录
- **THEN** 前端 MUST 为该区域展示清晰空状态
- **AND** 它 MUST NOT 用硬编码采购演示指标填充该区域

#### Scenario: 展示 看板 loading 和 error 状态
- **WHEN** 看板数据正在加载或 看板 API 失败
- **THEN** 前端 MUST 展示不会与现有工作台控件重叠的 loading 或 error 状态
- **AND** 用户 MUST 仍然能够切换公司上下文或导航到其他采购页面
