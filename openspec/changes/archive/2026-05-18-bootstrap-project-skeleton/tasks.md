## 1. 本地演示底座入口

- [x] 1.1 创建 `frontend/`、`backend/`、`infra/`、`docs/dev/`、`scripts/` 目录，并保留根目录 README 指向最短启动路径
- [x] 1.2 定义本地默认端口、环境变量和服务命名，确保演示人员能理解前端、后端和基础设施分别如何启动
- [x] 1.3 增加 `.env.example` 或等效示例配置，覆盖前端 API 地址、后端数据源和基础设施默认账号
- [x] 1.4 新增 `scripts/launch.sh` 作为日常开发聚合启动脚本，按顺序启动或提示启动 Docker 基础设施、后端和前端，并输出关键访问 URL

## 2. 基础设施可启动闭环

- [x] 2.1 在 `infra/docker-compose.yml` 中配置 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO，并使用稳定服务名和持久化卷
- [x] 2.2 为基础设施补充初始化约定，至少预留 MySQL Flyway、MongoDB 动态表单、MinIO 附件 bucket 的后续落点
- [x] 2.3 验证 Docker Compose 配置可解析，并在开发文档中记录基础设施启动、停止和端口检查方式

## 3. 后端健康与文档闭环

- [x] 3.1 创建 Java 21 + Spring Boot Gradle 后端骨架，加入 Web、Validation、Security、Spring Data JPA、MongoDB、Flyway、AMQP、MapStruct、springdoc-openapi 和测试依赖
- [x] 3.2 建立 `config`、`common`、`identity`、`procurement`、`matching` 包结构，体现集团、公司、采购和三单匹配后续边界
- [x] 3.3 以 Spring Data JPA 作为默认 MySQL 数据访问层，建立 repository/service 边界，保留后续引入 MyBatis Plus、原生 SQL 或 read model 的扩展空间
- [x] 3.4 实现 `GET /api/health`，返回服务状态、应用名、当前时间、星河控股集团和默认演示公司摘要
- [x] 3.5 配置 Swagger UI、CORS 和骨架阶段 Security 规则，只放行健康接口和 API 文档入口
- [x] 3.6 添加后端测试或启动验证，覆盖健康接口响应和 Swagger/OpenAPI 配置可加载

## 4. 前端采购工作台闭环

- [x] 4.1 创建 Vite React TypeScript 前端骨架，加入 Ant Design、React Router、TanStack Query、Zustand、React Hook Form、Zod 和 ECharts
- [x] 4.2 建立应用路由、查询客户端、全局状态和 API client，支持读取后端健康接口
- [x] 4.3 实现 Fox Procureflow 工作台外壳，包含固定左侧导航、顶部集团/公司上下文、KPI、趋势图、近期采购申请、采购流程、风险待办和供应商分布
- [x] 4.4 应用最终「F 库采 SaaS」视觉 token：主色 `#2f7a4d`、浅灰背景、白面板、细边框、极少阴影和低饱和状态色
- [x] 4.5 在工作台中展示前后端联通状态，并用静态演示数据区分集团共享供应商池和公司级采购数据
- [x] 4.6 添加前端构建或组件级验证，确保页面可构建、核心文本可渲染且无营销页元素

## 5. 多公司语境与非目标守护

- [x] 5.1 在前端演示数据和后端健康响应中体现星河控股集团、星河数字科技有限公司、星河智能制造有限公司和共享供应商池
- [x] 5.2 在代码注释或文档中明确集团级共享数据与公司级隔离数据的后续落库约定
- [x] 5.3 确认本 change 不实现真实采购申请、审批、RFQ、PO、收货、发票、三单匹配、AI 助手或完整 JWT 登录

## 6. 端到端验收

- [x] 6.1 更新 README 和 `docs/dev/`，写清基础设施、后端、前端的启动顺序和验证 URL
- [x] 6.2 验证 `scripts/launch.sh` 能作为 README 推荐入口启动或引导启动本地演示底座，并输出前端、健康接口和 Swagger UI URL
- [x] 6.3 运行后端测试或至少启动检查，确认 `GET /api/health` 和 Swagger UI 可访问
- [x] 6.4 运行前端构建或测试，确认采购工作台和健康联通状态可用
- [x] 6.5 使用浏览器打开本地前端，验证最终 F 视觉效果、公司上下文、工作台内容和前后端联通状态
- [x] 6.6 记录无法在当前环境完成的验证项及原因，避免把未验证能力写成已完成
