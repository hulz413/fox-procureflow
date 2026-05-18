# 本地开发

本文档说明 Fox Procureflow 骨架阶段的本地启动方式、默认端口、环境变量和验证路径。

## 工具要求

- Node.js `>=20.19`
- npm
- Java 21
- Docker
- Docker Compose 插件或 `docker-compose`

## 最短路径

```bash
cp .env.example .env
./scripts/launch.sh
```

`scripts/launch.sh` 是日常开发聚合启动入口。它会按顺序尝试：

1. 启动 `infra/docker-compose.yml` 中的 MySQL、MongoDB、Redis、RabbitMQ 和 MinIO。
2. 启动 `backend/` 中的 Spring Boot 服务。
3. 启动 `frontend/` 中的 Vite 开发服务器。
4. 输出前端、健康接口和 Swagger UI 地址。

如果本机缺少 Java 或 Docker Compose，脚本会给出下一步提示。也可以用下面的分步命令手动启动。

## 分步启动

### 基础设施

```bash
cd infra
docker compose up -d
```

如果本机只有旧版 Compose：

```bash
cd infra
docker-compose up -d
```

检查 Compose 配置是否可解析：

```bash
docker compose -f infra/docker-compose.yml config
```

查看服务状态：

```bash
cd infra
docker compose ps
```

停止本地基础设施：

```bash
cd infra
docker compose down
```

检查常用端口占用：

```bash
lsof -nP -iTCP:3306,27017,6379,5672,15672,9000,9001 -sTCP:LISTEN
```

### 后端

```bash
cd backend
./gradlew bootRun
```

健康接口：

```bash
curl http://localhost:8080/api/health
```

Swagger UI：

```text
http://localhost:8080/swagger-ui.html
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端工作台：

```text
http://localhost:5173
```

## 默认端口

| 服务 | 端口 | 说明 |
|---|---:|---|
| Frontend | `5173` | Vite dev server |
| Backend | `8080` | Spring Boot API |
| MySQL | `3306` | 核心交易和组织数据 |
| MongoDB | `27017` | 动态表单和审计类文档 |
| Redis | `6379` | 缓存、待办和看板指标 |
| RabbitMQ | `5672` / `15672` | 事件总线和管理界面 |
| MinIO | `9000` / `9001` | 对象存储和控制台 |

## 数据边界约定

骨架阶段只落工程和演示上下文，不实现真实业务流程。

- 集团共享数据：供应商池、采购品类模板、集团级看板汇总。
- 公司隔离数据：采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果。

后续核心业务表必须预留公司隔离字段。后端默认使用 Spring Data JPA 访问 MySQL，但通过 repository/service 边界保留未来引入 MyBatis Plus、原生 SQL 或 read model 的空间。

## 验证命令

```bash
cd frontend
npm run build
```

```bash
cd backend
./gradlew test
```

当前骨架不包含 Prometheus、Grafana、Jaeger、Zipkin 或 Keycloak。
