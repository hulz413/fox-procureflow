# MinIO bucket 约定

`infra/docker-compose.yml` 的 `minio-init` 服务会创建以下 bucket：

- `procurement-attachments`：采购申请附件预留，本 MVP 切片暂不启用。
- `rfq-attachments`：RFQ 供应商报价附件。
- `invoice-files`：收货凭证和供应商发票文件。

`minio-init` 还会写入两个小型演示对象，对应 Flyway seed 中的 uploaded-ready 附件：

- `companies/company-digital/rfqs/RFQ-20260518-0301/quotes/RFQ-20260518-0301-Q02/RFQ-20260518-0301-Q02-A01-yunzhou-workstation-rfq.pdf`
- `companies/company-digital/receipts/RCPT-20260519-0301/RCPT-20260519-0301-A01-chengcai-receipt-proof.jpg`

后端配置来自 `.env` / `application.yml`：

- `FOX_ATTACHMENT_RFQ_BUCKET`
- `FOX_ATTACHMENT_RECEIPT_INVOICE_BUCKET`
- `FOX_ATTACHMENT_MAX_SIZE_BYTES`
- `FOX_ATTACHMENT_ALLOWED_CONTENT_TYPES`
- `FOX_ATTACHMENT_VALIDATE_BUCKETS_ON_STARTUP`

本地验证路径：启动 `infra`、后端和前端后，在 RFQ 详情上传报价单，或在“收货发票”工作台上传收货凭证/发票文件；保存业务单据后，附件行应显示下载动作。历史 metadata-only 附件仍显示文件名，但下载按钮禁用并说明原因。
