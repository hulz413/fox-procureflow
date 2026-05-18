# MinIO bucket 约定

`infra/docker-compose.yml` 的 `minio-init` 服务会创建以下 bucket：

- `procurement-attachments`：采购申请附件
- `rfq-attachments`：报价附件
- `invoice-files`：发票文件和收货凭证

骨架阶段只创建对象存储落点，不实现附件上传业务。
