# Fox Procureflow

Fox Procureflow 是面向集团内部采购场景的多公司采购协同平台。MVP 聚焦星河控股集团下两个公司主体的采购业务闭环，从采购申请、审批、询报价、采购订单、收货、发票到三单匹配。

## 快速启动

```bash
cp .env.example .env
./scripts/launch.sh
```

`scripts/launch.sh` 会尝试启动本地基础设施、后端和前端，并输出常用访问地址。首次运行前请确认本机已安装：

- Node.js `>=20.19`
- Java 21
- Docker 和 Docker Compose 插件，或 `docker-compose`

## 本地地址

| 服务 | 地址 |
|---|---|
| 前端工作台 | `http://localhost:5173` |
| 后端健康检查 | `http://localhost:8080/api/health` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| RabbitMQ Management | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |

更多本地开发说明见 [docs/dev/local-development.md](docs/dev/local-development.md)，当前环境验证记录见 [docs/dev/verification-notes.md](docs/dev/verification-notes.md)。

## 项目结构

```text
frontend/   React + TypeScript + Vite 前端应用
backend/    Java 21 + Spring Boot 后端服务
infra/      MySQL、MongoDB、Redis、RabbitMQ、MinIO 本地编排
scripts/    本地开发辅助脚本
docs/       产品与开发文档
openspec/   OpenSpec 变更与规格
```

## 当前骨架边界

当前实现只提供工程底座、健康接口、Swagger UI、采购工作台外壳和 F「库采 SaaS」视觉基线。真实采购申请、审批、RFQ、PO、收货、发票、三单匹配、AI 助手和完整 JWT 登录将在后续 OpenSpec change 中实现。
