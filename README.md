# Fox Procureflow

Fox Procureflow 是面向企业采购场景的多主体协同平台，覆盖采购申请、审批、询报价、采购订单、收货、发票与三单匹配等核心流程，帮助采购、财务、业务和供应商在统一工作台中协作推进采购履约。

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
