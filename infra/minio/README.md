# MinIO bucket 约定

`infra/docker-compose.yml` 的 `minio-init` 服务会创建以下 bucket，供后段真实附件上传切片使用：

- `procurement-attachments`：采购申请附件
- `rfq-attachments`：报价附件
- `invoice-files`：发票文件和收货凭证

骨架、采购申请、审批流、RFQ/PO/收货/发票前期切片只记录附件意图或附件元数据占位，不要求文件真实上传到 MinIO。真实报价附件、发票文件和收货凭证上传应在核心业务闭环稳定后作为独立切片统一接入。
