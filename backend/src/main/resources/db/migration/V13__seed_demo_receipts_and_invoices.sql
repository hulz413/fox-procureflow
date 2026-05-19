UPDATE purchase_orders
SET status = 'ISSUED',
    issued_at = COALESCE(issued_at, '2026-05-19 12:05:00'),
    updated_at = '2026-05-19 12:05:00'
WHERE po_id = 'PO-20260518-0301'
  AND status = 'DRAFT';

INSERT IGNORE INTO purchase_order_status_records (
    record_id,
    po_id,
    company_id,
    actor_id,
    action,
    from_status,
    to_status,
    comment_text,
    created_at
) VALUES
    ('PO-20260518-0301-R02', 'PO-20260518-0301', 'company-digital', 'user-digital-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给供应商，作为未收货未开票演示单', '2026-05-19 12:05:00');

INSERT IGNORE INTO purchase_receipts (
    receipt_id,
    company_id,
    po_id,
    supplier_id,
    supplier_name,
    received_by,
    received_date,
    status,
    note,
    created_at,
    updated_at
) VALUES
    ('RCPT-20260519-0301', 'company-digital', 'PO-20260518-0302', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'user-demo-operator', '2026-06-03', 'RECORDED', '行政仓先收 60% 办公耗材，等待补送', '2026-06-03 10:20:00', '2026-06-03 10:20:00'),
    ('RCPT-20260519-0302', 'company-digital', 'PO-20260518-0302', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'user-demo-operator', '2026-06-04', 'RECORDED', '剩余耗材已补送完成', '2026-06-04 15:10:00', '2026-06-04 15:10:00');

INSERT IGNORE INTO purchase_receipt_lines (
    receipt_line_id,
    receipt_id,
    po_id,
    po_line_id,
    line_no,
    item_name,
    specification,
    received_quantity,
    unit,
    note,
    created_at
)
SELECT
    CONCAT('RCPT-20260519-0301-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    'RCPT-20260519-0301',
    line.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    ROUND(line.quantity * 0.60, 2),
    line.unit,
    '首批到货',
    '2026-06-03 10:20:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0302';

INSERT IGNORE INTO purchase_receipt_lines (
    receipt_line_id,
    receipt_id,
    po_id,
    po_line_id,
    line_no,
    item_name,
    specification,
    received_quantity,
    unit,
    note,
    created_at
)
SELECT
    CONCAT('RCPT-20260519-0302-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    'RCPT-20260519-0302',
    line.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    line.quantity - ROUND(line.quantity * 0.60, 2),
    line.unit,
    '补齐到货',
    '2026-06-04 15:10:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0302';

INSERT IGNORE INTO purchase_receipt_attachments (
    attachment_id,
    receipt_id,
    file_name,
    description,
    content_type,
    size_bytes,
    storage_object_key,
    created_at
) VALUES
    ('RCPT-20260519-0301-A01', 'RCPT-20260519-0301', 'chengcai-office-supplies-delivery-1.jpg', '首批到货签收照片元数据', 'image/jpeg', 740000, NULL, '2026-06-03 10:22:00'),
    ('RCPT-20260519-0302-A01', 'RCPT-20260519-0302', 'chengcai-office-supplies-delivery-2.jpg', '补送到货签收照片元数据', 'image/jpeg', 690000, NULL, '2026-06-04 15:12:00');

INSERT IGNORE INTO supplier_invoices (
    invoice_id,
    company_id,
    po_id,
    supplier_id,
    supplier_name,
    invoice_number,
    invoice_date,
    registered_by,
    status,
    untaxed_amount,
    tax_amount,
    total_amount,
    currency,
    note,
    created_at,
    updated_at
) VALUES
    ('INV-20260519-0301', 'company-digital', 'PO-20260518-0302', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'FP-CHENGCAI-202606-001', '2026-06-05', 'user-digital-finance', 'RECORDED', 23535.40, 3059.60, 26595.00, 'CNY', '供应商发票金额较 PO 多 2300，留给三单匹配识别', '2026-06-05 16:30:00', '2026-06-05 16:30:00');

INSERT IGNORE INTO supplier_invoice_lines (
    invoice_line_id,
    invoice_id,
    po_id,
    po_line_id,
    line_no,
    item_name,
    specification,
    invoiced_quantity,
    unit,
    untaxed_amount,
    tax_rate,
    tax_amount,
    total_amount,
    currency,
    created_at
)
SELECT
    CONCAT('INV-20260519-0301-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    'INV-20260519-0301',
    line.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    line.quantity,
    line.unit,
    23535.40,
    0.1300,
    3059.60,
    26595.00,
    'CNY',
    '2026-06-05 16:30:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0302';

INSERT IGNORE INTO supplier_invoice_attachments (
    attachment_id,
    invoice_id,
    file_name,
    description,
    content_type,
    size_bytes,
    storage_object_key,
    created_at
) VALUES
    ('INV-20260519-0301-A01', 'INV-20260519-0301', 'chengcai-office-supplies-invoice.pdf', '诚采办公耗材发票元数据', 'application/pdf', 118000, NULL, '2026-06-05 16:32:00');
