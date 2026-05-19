CREATE TABLE file_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id VARCHAR(96) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id VARCHAR(96) NOT NULL,
    target_secondary_id VARCHAR(96) NULL,
    supplier_id VARCHAR(64) NULL,
    bucket_name VARCHAR(120) NOT NULL,
    object_key VARCHAR(700) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    content_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    etag VARCHAR(160) NULL,
    storage_status VARCHAR(32) NOT NULL,
    uploaded_by VARCHAR(64) NULL,
    linked_business_id VARCHAR(96) NULL,
    linked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_file_attachments_attachment_id (attachment_id),
    KEY idx_file_attachments_company_target (company_id, target_type, target_id),
    KEY idx_file_attachments_linked_business (linked_business_id),
    KEY idx_file_attachments_object_key (bucket_name, object_key(512))
);

ALTER TABLE rfq_quote_attachments
    ADD COLUMN file_attachment_id VARCHAR(96) NULL AFTER attachment_id,
    ADD COLUMN storage_status VARCHAR(32) NOT NULL DEFAULT 'METADATA_ONLY' AFTER storage_object_key,
    ADD KEY idx_rfq_quote_attachments_file_attachment_id (file_attachment_id),
    ADD CONSTRAINT fk_rfq_quote_attachments_file_attachment_id
        FOREIGN KEY (file_attachment_id) REFERENCES file_attachments (attachment_id);

ALTER TABLE purchase_receipt_attachments
    ADD COLUMN file_attachment_id VARCHAR(96) NULL AFTER attachment_id,
    ADD COLUMN storage_status VARCHAR(32) NOT NULL DEFAULT 'METADATA_ONLY' AFTER storage_object_key,
    ADD KEY idx_purchase_receipt_attachments_file_attachment_id (file_attachment_id),
    ADD CONSTRAINT fk_purchase_receipt_attachments_file_attachment_id
        FOREIGN KEY (file_attachment_id) REFERENCES file_attachments (attachment_id);

ALTER TABLE supplier_invoice_attachments
    ADD COLUMN file_attachment_id VARCHAR(96) NULL AFTER attachment_id,
    ADD COLUMN storage_status VARCHAR(32) NOT NULL DEFAULT 'METADATA_ONLY' AFTER storage_object_key,
    ADD KEY idx_supplier_invoice_attachments_file_attachment_id (file_attachment_id),
    ADD CONSTRAINT fk_supplier_invoice_attachments_file_attachment_id
        FOREIGN KEY (file_attachment_id) REFERENCES file_attachments (attachment_id);

INSERT INTO file_attachments (
    attachment_id,
    company_id,
    target_type,
    target_id,
    target_secondary_id,
    supplier_id,
    bucket_name,
    object_key,
    original_file_name,
    description,
    content_type,
    size_bytes,
    etag,
    storage_status,
    uploaded_by,
    linked_business_id,
    linked_at,
    created_at,
    updated_at
)
VALUES
    (
        'RFQ-20260518-0301-Q02-A01',
        'company-digital',
        'RFQ_QUOTE',
        'RFQ-20260518-0301',
        'supplier-yunzhou',
        'supplier-yunzhou',
        'rfq-attachments',
        'companies/company-digital/rfqs/RFQ-20260518-0301/quotes/RFQ-20260518-0301-Q02/RFQ-20260518-0301-Q02-A01-yunzhou-workstation-rfq.pdf',
        'yunzhou-workstation-rfq.pdf',
        '云舟移动工作站报价单真实上传演示文件',
        'application/pdf',
        90000,
        'demo-seed',
        'READY',
        'user-digital-buyer',
        'RFQ-20260518-0301-Q02',
        '2026-05-19 11:08:00',
        '2026-05-19 11:08:00',
        '2026-05-19 11:08:00'
    ),
    (
        'RCPT-20260519-0301-A01',
        'company-digital',
        'RECEIPT',
        'PO-20260518-0302',
        NULL,
        'supplier-chengcai',
        'invoice-files',
        'companies/company-digital/receipts/RCPT-20260519-0301/RCPT-20260519-0301-A01-chengcai-receipt-proof.jpg',
        '诚采办公耗材补送到货签收照片.jpg',
        '诚采办公耗材补送到货签收照片真实上传演示文件',
        'image/jpeg',
        118000,
        'demo-seed',
        'READY',
        'user-demo-operator',
        'RCPT-20260519-0301',
        '2026-05-19 15:05:00',
        '2026-05-19 15:05:00',
        '2026-05-19 15:05:00'
    );

UPDATE rfq_quote_attachments
SET file_attachment_id = 'RFQ-20260518-0301-Q02-A01',
    storage_object_key = 'companies/company-digital/rfqs/RFQ-20260518-0301/quotes/RFQ-20260518-0301-Q02/RFQ-20260518-0301-Q02-A01-yunzhou-workstation-rfq.pdf',
    storage_status = 'READY'
WHERE attachment_id = 'RFQ-20260518-0301-Q02-A01';

UPDATE purchase_receipt_attachments
SET file_attachment_id = 'RCPT-20260519-0301-A01',
    storage_object_key = 'companies/company-digital/receipts/RCPT-20260519-0301/RCPT-20260519-0301-A01-chengcai-receipt-proof.jpg',
    storage_status = 'READY'
WHERE attachment_id = 'RCPT-20260519-0301-A01';
