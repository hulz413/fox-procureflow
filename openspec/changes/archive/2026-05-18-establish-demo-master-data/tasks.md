## 1. 演示基础数据事实来源

- [x] 1.1 设计并新增 `V2__create_demo_master_data.sql`，追加集团、公司、部门、用户、角色、用户角色、供应商、采购品类、供应商品类和预算科目表，不重写既有 V1 migration
- [x] 1.2 写入星河控股集团、两家演示公司和稳定业务 ID，确保 `company-digital` 为默认激活公司
- [x] 1.3 写入两家公司部门、演示用户和角色关联，覆盖申请人、审批人、采购员、财务人员、仓储人员、系统管理员和演示人员
- [x] 1.4 写入 roadmap 中 5 家集团共享供应商、采购品类和供应商品类关联
- [x] 1.5 写入两家公司各自预算科目，确保数字科技与智能制造的预算科目可被 companyId 隔离查询

## 2. 后端基础数据读取闭环

- [x] 2.1 新增基础数据 JPA entity、repository 和 service，使用稳定业务 ID 作为 API 输出标识
- [x] 2.2 将 `DemoOrganizationService` 改为从新基础数据表聚合集团、默认公司、公司列表和数据归属说明
- [x] 2.3 新增 `GET /api/master-data/context`，返回 seeded group/company context、共享供应商池范围和数据边界
- [x] 2.4 新增公司级 API：部门、用户角色摘要、预算科目，并确保未知 companyId 返回客户端可理解错误
- [x] 2.5 新增集团级 API：共享供应商池和采购品类，支持按品类筛选供应商
- [x] 2.6 在骨架阶段 Security 配置中明确放行只读 `/api/master-data/**`，并保留后续 JWT 收紧空间

## 3. API 验证与测试覆盖

- [x] 3.1 添加 Flyway/JPA 层测试或 Spring Boot 集成测试，验证 seed data 可加载且关键业务 ID 存在
- [x] 3.2 添加 API 测试覆盖 context、companies、departments、users、suppliers、categories、budget-accounts 成功响应
- [x] 3.3 添加公司隔离测试，验证 `company-digital` 预算科目不会返回 `company-manufacturing` 数据
- [x] 3.4 添加未知 companyId 测试，验证不会静默回退默认公司
- [x] 3.5 验证 Swagger/OpenAPI 中出现 master data endpoints 和基础响应结构

## 4. 前端基础资料验证视图

- [x] 4.1 扩展前端 API client 和 TanStack Query hooks，读取 master data context、供应商、品类、部门、用户和预算科目
- [x] 4.2 在现有采购工作台导航中新增“基础资料”入口，保持固定左侧导航和 F「库采 SaaS」视觉 token
- [x] 4.3 实现只读基础资料页面，展示集团/公司上下文、公司选择、共享供应商池、采购品类、部门用户和预算科目
- [x] 4.4 在页面中明确展示集团共享数据与公司级数据边界，不提供新增、编辑、删除或业务流程操作
- [x] 4.5 确认工作台健康/公司上下文继续可用，并优先使用后端 master data context

## 5. 端到端验收

- [x] 5.1 使用 Docker Compose 基础设施启动后端，确认 Flyway V1/V2 在空库可执行
- [x] 5.2 运行后端测试，确认基础数据 API、公司隔离和 Swagger 文档可用
- [x] 5.3 运行前端构建或测试，确认基础资料视图可构建且核心文本可渲染
- [x] 5.4 启动前后端并通过浏览器验证基础资料视图能展示真实后端数据
- [x] 5.5 记录验证命令、结果和任何环境限制，避免把未验证能力写成已完成

## 6. 非目标守护

- [x] 6.1 确认本 change 不新增真实登录、JWT 签发、权限矩阵或主数据维护 CRUD
- [x] 6.2 确认本 change 不实现采购申请、审批、RFQ、PO、收货、发票、三单匹配或 AI 助手业务流程
