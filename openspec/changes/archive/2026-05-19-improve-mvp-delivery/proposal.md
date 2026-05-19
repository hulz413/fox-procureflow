## Why

Fox Procureflow 的 P0/P1 采购闭环、AI 助手和真实附件上传已经完成，下一步需要把 MVP 从“功能可用”推进到“可稳定交付和演示”。当前启动、验证和交付说明已经存在，但缺少面向完整 MVP 的一键 smoke 验证、演示运行手册和持续更新的验收记录，容易让开发者或演示人员在本地环境差异中消耗时间。

## What Changes

- 新增 MVP 交付硬化能力，覆盖本地启动前检查、关键服务健康检查、前后端 smoke 验证和常见故障提示。
- 补强 `scripts/launch.sh` 或新增轻量脚本，使演示人员可以更明确地判断 MySQL、MongoDB、MinIO、后端、前端和 Swagger 是否达到可演示状态。
- 更新本地开发与演示文档，提供从 fresh checkout 到完整采购闭环演示的最短路径、环境要求、访问地址和失败恢复建议。
- 更新验证记录，明确后端测试、前端 lint/build、Compose 配置、健康接口、OpenAPI、前端首页和核心 MVP 演示入口的验收命令。
- 不新增业务流程、业务 API、数据库业务表、AI mock、Redis/RabbitMQ 事件化实现、可观测性套件或身份认证能力。

## Capabilities

### New Capabilities
- `mvp-delivery`: 覆盖 Fox Procureflow 完整 MVP 的本地演示交付、启动验证、smoke check、运行手册和验收记录。

### Modified Capabilities

## Impact

- 影响脚本：`scripts/launch.sh`，以及可能新增的 `scripts/*` smoke/verification 辅助脚本。
- 影响文档：`README.md`、`docs/dev/local-development.md`、`docs/dev/verification-notes.md`，以及可能新增的 MVP demo runbook。
- 影响验证：后端 Gradle 测试、前端 lint/build、Docker Compose 配置解析、后端健康接口、Swagger/OpenAPI、前端首页响应和关键演示入口检查。
- 依赖边界不变：继续使用现有 Docker Compose、Java 21、Node.js、Spring Boot、React/Vite、MySQL、MongoDB 和 MinIO；不引入 Prometheus、Grafana、Jaeger/Zipkin、Keycloak 或新的中间件。
