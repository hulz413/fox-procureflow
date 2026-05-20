## MODIFIED Requirements

### Requirement: 收货和发票不实现匹配、付款、上传或 AI 流程
系统 SHALL 将收货和发票登记聚焦在事实性收货/发票数据，同时允许三单匹配能力在收货或发票创建成功后同步刷新匹配结果；该流程 SHALL NOT 创建付款、对象存储、异步消息或 AI 生成决策。

#### Scenario: 匹配可用后收货创建刷新匹配记录
- **WHEN** 三单匹配能力可用后，为已发布采购订单创建收货
- **THEN** 系统 MUST 为相同 `companyId` 和 `poId` 同步重算当前三单匹配结果
- **AND** 收货 MUST 保持可作为匹配详情的来源输入
- **AND** 系统 MUST NOT 创建付款记录、RabbitMQ events 或 AI 建议

#### Scenario: 匹配可用后发票创建刷新匹配记录
- **WHEN** 三单匹配能力可用后，为已发布采购订单创建供应商发票
- **THEN** 系统 MUST 为相同 `companyId` 和 `poId` 同步重算当前三单匹配结果
- **AND** 发票 MUST 保持可作为匹配详情的来源输入
- **AND** 系统 MUST NOT 创建付款记录、RabbitMQ events 或 AI 建议

#### Scenario: 匹配刷新失败时回滚收货和发票创建
- **WHEN** 收货或发票创建通过校验并成功，但同一采购订单的同步匹配刷新失败
- **THEN** 系统 MUST 回滚收货或发票创建事务
- **AND** 系统 MUST NOT 留下没有刷新匹配结果的来源收货/发票数据

#### Scenario: 收货和发票流程不需要延期基础设施
- **WHEN** 开发者在 MVP 本地环境中运行收货、发票和匹配刷新流程
- **THEN** 流程 MUST 使用 MySQL 和同步 service 调用
- **AND** 它 MUST NOT 需要 Redis、RabbitMQ、MongoDB、MinIO、Prometheus、Grafana、Jaeger、Zipkin、Keycloak 或 DeepSeek
