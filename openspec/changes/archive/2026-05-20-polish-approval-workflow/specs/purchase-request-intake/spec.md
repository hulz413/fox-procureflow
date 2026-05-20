## MODIFIED Requirements

### Requirement: 前端提供采购申请录入流程
前端 SHALL 在采购工作台中提供真实采购申请页面，用于创建、提交、列表查看、查看采购申请，并展示其审批状态和统一审批进度摘要。

#### Scenario: 打开采购申请页面
- **WHEN** 用户在工作台导航中选择“采购申请”
- **THEN** 系统 MUST 打开 `/purchase-requests` 页面
- **AND** 页面 MUST 从后端 API 加载公司、申请人、品类和预算科目选项，而不是使用静态 mock 数据

#### Scenario: 活跃公司上下文约束表单选项
- **WHEN** 用户在活跃演示公司上下文下打开采购申请页面
- **THEN** 申请人和预算科目选项 MUST 仅展示属于该活跃公司的记录
- **AND** 采购申请页面 MUST NOT 在当前 MVP 切片中暴露公司切换器
- **AND** 供应商池和采购品类 MUST 保持集团级参考数据

#### Scenario: 从前端保存草稿
- **WHEN** 用户填写必填采购申请字段并保存草稿
- **THEN** 前端 MUST 调用草稿创建 API
- **AND** 新草稿 MUST 以其后端 `requestId` 和 `DRAFT` 状态出现在列表中

#### Scenario: 从前端提交采购申请
- **WHEN** 用户提交已保存草稿
- **THEN** 前端 MUST 调用提交 API
- **AND** 列表和详情视图 MUST 将该申请展示为 `SUBMITTED`
- **AND** 列表和详情视图 MUST 展示已创建审批实例的状态和当前审批节点

#### Scenario: 查看采购申请审批进度
- **WHEN** 用户打开带审批实例的已提交采购申请详情
- **THEN** 前端 MUST 展示来自后端 API 的审批状态、当前审批人和统一审批进度摘要
- **AND** 如果前端已加载完整审批详情，审批进度摘要 MUST 同时表达路径节点和审批记录
- **AND** 页面 MUST NOT 将审批路径和审批记录渲染为两个并列的主区域
