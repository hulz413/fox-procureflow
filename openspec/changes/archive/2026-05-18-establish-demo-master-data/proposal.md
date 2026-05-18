## Why

当前工程底座已经能启动前后端和基础设施，但集团、公司、供应商池等演示上下文仍主要停留在骨架级占位数据。后续采购申请、审批、RFQ、PO 和三单匹配都需要稳定的组织、用户、供应商、品类和预算科目作为业务坐标，因此需要先建立 P0 基础组织与演示数据切片。

## What Changes

- 新增真实演示基础数据能力，覆盖星河控股集团、两家演示公司、部门、用户、角色、集团共享供应商池、采购品类和预算科目。
- 用 MySQL/Flyway 管理基础数据 schema 和稳定 seed data，替换后续业务切片中可能出现的重复硬编码演示数据。
- 新增只读基础数据 API，用于查询集团/公司上下文、公司部门用户、集团共享供应商池、采购品类和预算科目。
- 前端工作台新增基础资料验证入口，从后端读取并展示公司上下文、供应商池、品类和预算科目，验证集团共享数据与公司隔离数据的边界。
- 保留后续完整认证、权限矩阵和业务 CRUD 的扩展空间，但本 change 不实现登录、采购申请、审批、RFQ、PO、收货、发票或三单匹配流程。
- 验收标准：开发者启动基础设施、后端和前端后，可以通过 Swagger/API 和前端页面看到稳定的星河集团演示基础数据，并确认共享供应商池与公司级基础数据边界清晰。

## Capabilities

### New Capabilities

- `demo-master-data`: 定义 Fox Procureflow MVP 演示基础数据、集团/公司组织上下文、共享供应商池、采购品类、预算科目和只读基础数据 API。

### Modified Capabilities

- 无。

## Impact

- 影响后端：新增或扩展 `identity` 与基础资料相关包、JPA entity/repository/service/controller、DTO 和测试。
- 影响数据库：新增 Flyway migration，创建组织、部门、用户、角色、供应商、品类、预算科目及关联关系的 MySQL 表和演示 seed data。
- 影响前端：新增基础资料/供应商池验证视图，工作台公司上下文从后端基础数据 API 获取。
- 影响 API 文档：Swagger/OpenAPI 展示基础数据查询接口。
- 影响后续切片：采购申请 Intake、审批流、RFQ、PO、收货、发票和三单匹配应复用本 change 建立的 companyId、userId、supplierId、categoryId 和 budgetAccountId。
- 不新增外部依赖；继续使用 Spring Data JPA、Flyway、React、Ant Design 和 TanStack Query。
