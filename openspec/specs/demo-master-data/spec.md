# demo-master-data 规格

## Purpose

定义 Fox Procureflow MVP 演示所需的组织、公司、部门、用户、角色、集团共享供应商池、采购品类、预算科目和只读主数据 API，确保后续采购业务切片复用稳定业务 ID 与清晰的数据归属边界。

## Requirements

### Requirement: 演示组织主数据完成 seed
系统 SHALL 为 Fox Procureflow MVP 演示 seed 稳定的组织主数据，包括星河控股集团、星河数字科技有限公司、星河智能制造有限公司、部门、用户和角色。

#### Scenario: Seed 集团和公司上下文
- **WHEN** 后端数据库迁移在空的本地 MySQL 数据库上运行
- **THEN** 系统 MUST 创建 `group-xinghe`、`company-digital` 和 `company-manufacturing` 的稳定记录
- **AND** 每个公司 MUST 包含其 roadmap 业务范围和活跃/非活跃演示上下文元数据

#### Scenario: Seed 部门、用户和角色
- **WHEN** 开发者查询已 seed 的组织主数据
- **THEN** 每个演示公司 MUST 拥有后续 P0 切片所需的部门和用户，覆盖申请人、审批人、采购、财务、仓库、管理员和演示操作员角色

### Requirement: 集团共享供应商池可用
系统 SHALL 为演示公司提供集团级共享供应商池。

#### Scenario: 填充 roadmap 中的供应商
- **WHEN** 后端数据库迁移运行
- **THEN** 共享供应商池 MUST 包含上海云舟信息技术有限公司、深圳蓝芯电子科技有限公司、苏州恒润工业设备有限公司、杭州诚采办公用品有限公司和宁波安捷物流有限公司

#### Scenario: 供应商跨公司共享
- **WHEN** 调用方从任一演示公司上下文请求供应商主数据
- **THEN** 系统 MUST 返回同一集团级供应商池
- **AND** 响应 MUST 明确供应商是集团共享数据，而不是公司归属采购记录

### Requirement: 采购品类和预算科目可用
系统 SHALL 提供采购品类和公司级预算科目，用于后续采购申请校验。

#### Scenario: 采购品类是集团级参考数据
- **WHEN** 调用方请求采购品类
- **THEN** 系统 MUST 返回集团级品类，覆盖 IT 设备、软件订阅、办公用品、生产耗材、设备备件和物流服务

#### Scenario: 预算科目按公司隔离
- **WHEN** 调用方请求 `company-digital` 的预算科目
- **THEN** 系统 MUST 仅返回星河数字科技有限公司的预算科目
- **AND** 响应 MUST NOT 包含星河智能制造有限公司的预算科目

#### Scenario: 未知公司预算科目请求被拒绝
- **WHEN** 调用方使用未知 `companyId` 请求预算科目
- **THEN** 系统 MUST 返回客户端可见错误，而不是静默回退到默认公司

### Requirement: 只读主数据 API 暴露稳定标识
系统 SHALL 暴露只读后端 API，用于提供带稳定业务标识的演示主数据，供后续 P0 业务切片引用。

#### Scenario: 查询演示上下文 API
- **WHEN** 调用方请求 `GET /api/master-data/context`
- **THEN** 系统 MUST 使用已 seed 的主数据返回集团、默认活跃公司、公司列表、供应商池范围和集团/公司数据边界

#### Scenario: 查询公司级主数据 API
- **WHEN** 调用方使用有效 `companyId` 请求公司级部门、用户或预算科目
- **THEN** 系统 MUST 仅返回属于该公司的记录
- **AND** 每条记录 MUST 包含稳定业务标识，供后续采购流程引用

#### Scenario: 查询共享供应商和品类 API
- **WHEN** 调用方请求共享供应商或采购品类
- **THEN** 系统 MUST 返回带稳定供应商和品类标识的集团级记录

#### Scenario: 主数据 API 出现在 OpenAPI 文档中
- **WHEN** 开发者打开 Swagger UI 或请求 `/v3/api-docs`
- **THEN** 主数据端点 MUST 连同响应结构一起被文档化

### Requirement: 前端通过后端 API 校验主数据
前端 SHALL 在采购工作台中提供只读主数据视图，用于验证后端主数据 API。

#### Scenario: 打开主数据视图
- **WHEN** 用户打开前端主数据视图
- **THEN** 页面 MUST 展示从后端主数据 API 获取的集团和公司上下文
- **AND** 它 MUST 保留 project skeleton 中的 F 库采 SaaS 视觉基线

#### Scenario: 同时查看共享数据和公司级数据
- **WHEN** 用户在主数据视图中选择演示公司
- **THEN** 页面 MUST 展示集团共享供应商池和采购品类
- **AND** 它 MUST 仅展示所选公司的部门、用户和预算科目

#### Scenario: 主数据视图保持只读
- **WHEN** 用户查看主数据视图
- **THEN** 页面 MUST NOT 展示创建、编辑、删除、审批、RFQ、PO、收货、发票或匹配操作

### Requirement: 演示主数据不实现采购流程
系统 SHALL 将本 change 聚焦于主数据，并且 SHALL NOT 实现下游采购流程。

#### Scenario: 不存在业务流程端点
- **WHEN** 开发者检查本 change 后的 API 面
- **THEN** 本 change MUST NOT 将采购申请、审批、RFQ、PO、收货、发票和三单匹配端点实现为真实业务流程

#### Scenario: AI 行为仍然不在范围内
- **WHEN** 开发者检查主数据实现
- **THEN** DeepSeek API 集成和 AI 采购助手行为 MUST NOT 由本 change 引入
