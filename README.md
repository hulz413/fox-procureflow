# Fox Procureflow

Fox Procureflow 是面向集团内部采购场景的多公司协同平台。MVP 演示星河控股集团下星河数字科技有限公司和星河智能制造有限公司的采购闭环，覆盖集团共享供应商池、采购申请、审批、询报价、采购订单、收货、发票、三单匹配、采购看板、AI 建议和真实附件上传。

## 快速启动

```bash
cp .env.example .env
./scripts/launch.sh --detach
```

`scripts/launch.sh --detach` 会启动本地基础设施，并把后端和前端放到后台运行。日志写入 `.local/logs/`，需要停止本地演示服务时运行：

```bash
./scripts/stop-demo.sh
```

服务启动后运行只读 smoke check：

```bash
./scripts/smoke-check.sh
```

当前核心采购闭环依赖 MySQL；AI 审计使用 MongoDB；真实报价单、收货凭证和供应商发票文件上传使用 MinIO。首次运行前请确认本机已安装：

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

## 附件上传

真实附件上传覆盖 RFQ 报价单、收货凭证和供应商发票文件，不回补采购申请 Intake。默认 bucket：

- `rfq-attachments`：RFQ 供应商报价附件。
- `invoice-files`：收货凭证和供应商发票文件。

默认单文件上限为 10 MB，允许 PDF、常见 Office 文档、图片和纯文本。前端在 RFQ 详情和“收货发票”工作台上传文件，后端会校验 `companyId`、业务目标和文件类型，保存 MinIO object key 与 MySQL 元数据后返回可下载附件。

完整演示路径见 [docs/dev/mvp-demo-runbook.md](docs/dev/mvp-demo-runbook.md)，本地开发说明见 [docs/dev/local-development.md](docs/dev/local-development.md)，当前环境验证记录见 [docs/dev/verification-notes.md](docs/dev/verification-notes.md)。
