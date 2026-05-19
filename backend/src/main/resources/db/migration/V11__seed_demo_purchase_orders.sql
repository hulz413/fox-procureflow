UPDATE rfqs
SET status = 'COMPARISON_READY',
    updated_at = '2026-05-19 11:18:00'
WHERE rfq_id IN ('RFQ-20260518-0301', 'RFQ-20260518-0302');

INSERT IGNORE INTO rfq_quotes (
    quote_id,
    rfq_id,
    supplier_id,
    quote_amount,
    tax_rate,
    tax_amount,
    total_amount,
    delivery_date,
    supplier_score,
    risk_note,
    created_at,
    updated_at
) VALUES
    ('RFQ-20260518-0301-Q02', 'RFQ-20260518-0301', 'supplier-yunzhou', 158000.00, 0.1300, 20540.00, 178540.00, '2026-06-10', 91.00, '交付窗口最早，含设备初始化服务', '2026-05-19 11:08:00', '2026-05-19 11:08:00'),
    ('RFQ-20260518-0301-Q03', 'RFQ-20260518-0301', 'supplier-chengcai', 154600.00, 0.1300, 20098.00, 174698.00, '2026-06-16', 83.00, '价格居中，备货周期略长', '2026-05-19 11:12:00', '2026-05-19 11:12:00'),
    ('RFQ-20260518-0302-Q01', 'RFQ-20260518-0302', 'supplier-chengcai', 21500.00, 0.1300, 2795.00, 24295.00, '2026-06-03', 90.00, '常备库存，可一次性交付', '2026-05-19 11:16:00', '2026-05-19 11:16:00');

INSERT IGNORE INTO rfq_quote_attachments (
    attachment_id,
    quote_id,
    rfq_id,
    supplier_id,
    file_name,
    description,
    content_type,
    size_bytes,
    storage_object_key,
    created_at
) VALUES
    ('RFQ-20260518-0301-Q02-A01', 'RFQ-20260518-0301-Q02', 'RFQ-20260518-0301', 'supplier-yunzhou', 'yunzhou-workstation-rfq.pdf', '云舟移动工作站报价单元数据', 'application/pdf', 90000, NULL, '2026-05-19 11:08:00'),
    ('RFQ-20260518-0301-Q03-A01', 'RFQ-20260518-0301-Q03', 'RFQ-20260518-0301', 'supplier-chengcai', 'chengcai-workstation-rfq.pdf', '诚采移动工作站报价单元数据', 'application/pdf', 78000, NULL, '2026-05-19 11:12:00'),
    ('RFQ-20260518-0302-Q01-A01', 'RFQ-20260518-0302-Q01', 'RFQ-20260518-0302', 'supplier-chengcai', 'chengcai-office-supplies-rfq.pdf', '办公耗材报价单元数据', 'application/pdf', 52000, NULL, '2026-05-19 11:16:00');

INSERT IGNORE INTO purchase_orders (
    po_id,
    company_id,
    rfq_id,
    quote_id,
    request_id,
    approval_id,
    requester_id,
    procurement_user_id,
    supplier_id,
    supplier_name,
    supplier_service_scope,
    supplier_risk_level,
    category_id,
    budget_account_id,
    title,
    status,
    quote_amount,
    tax_rate,
    tax_amount,
    total_amount,
    currency,
    expected_delivery_date,
    quote_delivery_date,
    quote_updated_at,
    upstream_snapshot_json,
    issued_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    'PO-20260518-0301',
    rfq.company_id,
    rfq.rfq_id,
    quote.quote_id,
    rfq.request_id,
    rfq.approval_id,
    rfq.requester_id,
    rfq.procurement_user_id,
    supplier.supplier_id,
    supplier.supplier_name,
    supplier.service_scope,
    supplier.risk_level,
    rfq.category_id,
    rfq.budget_account_id,
    CONCAT('PO - ', rfq.title),
    'DRAFT',
    quote.quote_amount,
    quote.tax_rate,
    quote.tax_amount,
    quote.total_amount,
    rfq.currency,
    rfq.expected_delivery_date,
    quote.delivery_date,
    quote.updated_at,
    JSON_OBJECT(
        'snapshotVersion', 'purchase-order-source-v1',
        'rfq', JSON_OBJECT('rfqId', rfq.rfq_id, 'status', rfq.status, 'title', rfq.title),
        'quote', JSON_OBJECT('quoteId', quote.quote_id, 'supplierId', quote.supplier_id, 'totalAmount', quote.total_amount),
        'supplier', JSON_OBJECT('supplierId', supplier.supplier_id, 'supplierName', supplier.supplier_name),
        'request', JSON_OBJECT('requestId', request.request_id, 'title', request.title, 'totalAmount', request.total_amount),
        'approval', JSON_OBJECT('approvalId', rfq.approval_id, 'status', approval.status)
    ),
    NULL,
    NULL,
    '2026-05-19 11:20:00',
    '2026-05-19 11:20:00'
FROM rfqs rfq
JOIN rfq_quotes quote ON quote.quote_id = 'RFQ-20260518-0301-Q01'
JOIN rfq_suppliers supplier ON supplier.rfq_id = rfq.rfq_id AND supplier.supplier_id = quote.supplier_id
JOIN purchase_requests request ON request.request_id = rfq.request_id
JOIN approval_instances approval ON approval.approval_id = rfq.approval_id
WHERE rfq.rfq_id = 'RFQ-20260518-0301';

INSERT IGNORE INTO purchase_orders (
    po_id,
    company_id,
    rfq_id,
    quote_id,
    request_id,
    approval_id,
    requester_id,
    procurement_user_id,
    supplier_id,
    supplier_name,
    supplier_service_scope,
    supplier_risk_level,
    category_id,
    budget_account_id,
    title,
    status,
    quote_amount,
    tax_rate,
    tax_amount,
    total_amount,
    currency,
    expected_delivery_date,
    quote_delivery_date,
    quote_updated_at,
    upstream_snapshot_json,
    issued_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    'PO-20260518-0302',
    rfq.company_id,
    rfq.rfq_id,
    quote.quote_id,
    rfq.request_id,
    rfq.approval_id,
    rfq.requester_id,
    rfq.procurement_user_id,
    supplier.supplier_id,
    supplier.supplier_name,
    supplier.service_scope,
    supplier.risk_level,
    rfq.category_id,
    rfq.budget_account_id,
    CONCAT('PO - ', rfq.title),
    'ISSUED',
    quote.quote_amount,
    quote.tax_rate,
    quote.tax_amount,
    quote.total_amount,
    rfq.currency,
    rfq.expected_delivery_date,
    quote.delivery_date,
    quote.updated_at,
    JSON_OBJECT(
        'snapshotVersion', 'purchase-order-source-v1',
        'rfq', JSON_OBJECT('rfqId', rfq.rfq_id, 'status', rfq.status, 'title', rfq.title),
        'quote', JSON_OBJECT('quoteId', quote.quote_id, 'supplierId', quote.supplier_id, 'totalAmount', quote.total_amount),
        'supplier', JSON_OBJECT('supplierId', supplier.supplier_id, 'supplierName', supplier.supplier_name),
        'request', JSON_OBJECT('requestId', request.request_id, 'title', request.title, 'totalAmount', request.total_amount),
        'approval', JSON_OBJECT('approvalId', rfq.approval_id, 'status', approval.status)
    ),
    '2026-05-19 11:36:00',
    NULL,
    '2026-05-19 11:25:00',
    '2026-05-19 11:36:00'
FROM rfqs rfq
JOIN rfq_quotes quote ON quote.quote_id = 'RFQ-20260518-0302-Q01'
JOIN rfq_suppliers supplier ON supplier.rfq_id = rfq.rfq_id AND supplier.supplier_id = quote.supplier_id
JOIN purchase_requests request ON request.request_id = rfq.request_id
JOIN approval_instances approval ON approval.approval_id = rfq.approval_id
WHERE rfq.rfq_id = 'RFQ-20260518-0302';

INSERT IGNORE INTO purchase_orders (
    po_id,
    company_id,
    rfq_id,
    quote_id,
    request_id,
    approval_id,
    requester_id,
    procurement_user_id,
    supplier_id,
    supplier_name,
    supplier_service_scope,
    supplier_risk_level,
    category_id,
    budget_account_id,
    title,
    status,
    quote_amount,
    tax_rate,
    tax_amount,
    total_amount,
    currency,
    expected_delivery_date,
    quote_delivery_date,
    quote_updated_at,
    upstream_snapshot_json,
    issued_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    'PO-20260518-0304',
    rfq.company_id,
    rfq.rfq_id,
    quote.quote_id,
    rfq.request_id,
    rfq.approval_id,
    rfq.requester_id,
    rfq.procurement_user_id,
    supplier.supplier_id,
    supplier.supplier_name,
    supplier.service_scope,
    supplier.risk_level,
    rfq.category_id,
    rfq.budget_account_id,
    CONCAT('PO - ', rfq.title),
    'CANCELLED',
    quote.quote_amount,
    quote.tax_rate,
    quote.tax_amount,
    quote.total_amount,
    rfq.currency,
    rfq.expected_delivery_date,
    quote.delivery_date,
    quote.updated_at,
    JSON_OBJECT(
        'snapshotVersion', 'purchase-order-source-v1',
        'rfq', JSON_OBJECT('rfqId', rfq.rfq_id, 'status', rfq.status, 'title', rfq.title),
        'quote', JSON_OBJECT('quoteId', quote.quote_id, 'supplierId', quote.supplier_id, 'totalAmount', quote.total_amount),
        'supplier', JSON_OBJECT('supplierId', supplier.supplier_id, 'supplierName', supplier.supplier_name),
        'request', JSON_OBJECT('requestId', request.request_id, 'title', request.title, 'totalAmount', request.total_amount),
        'approval', JSON_OBJECT('approvalId', rfq.approval_id, 'status', approval.status)
    ),
    '2026-05-19 11:38:00',
    '2026-05-19 11:50:00',
    '2026-05-19 11:30:00',
    '2026-05-19 11:50:00'
FROM rfqs rfq
JOIN rfq_quotes quote ON quote.quote_id = 'RFQ-20260518-0304-Q03'
JOIN rfq_suppliers supplier ON supplier.rfq_id = rfq.rfq_id AND supplier.supplier_id = quote.supplier_id
JOIN purchase_requests request ON request.request_id = rfq.request_id
JOIN approval_instances approval ON approval.approval_id = rfq.approval_id
WHERE rfq.rfq_id = 'RFQ-20260518-0304';

INSERT IGNORE INTO purchase_order_lines (
    line_id,
    po_id,
    line_no,
    item_name,
    specification,
    quantity,
    unit,
    category_id,
    estimated_unit_price,
    estimated_amount,
    confirmed_unit_price,
    confirmed_amount,
    created_at
)
SELECT
    CONCAT(po.po_id, '-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    po.po_id,
    line.line_no,
    line.item_name,
    line.specification,
    line.quantity,
    line.unit,
    line.category_id,
    line.estimated_unit_price,
    line.estimated_amount,
    line.estimated_unit_price,
    line.estimated_amount,
    po.created_at
FROM purchase_orders po
JOIN purchase_request_lines line ON line.request_id = po.request_id
WHERE po.po_id IN ('PO-20260518-0301', 'PO-20260518-0302', 'PO-20260518-0304');

INSERT IGNORE INTO purchase_order_delivery_schedules (
    schedule_id,
    po_id,
    planned_delivery_date,
    delivery_location,
    contact_person,
    contact_phone,
    delivery_note,
    created_at,
    updated_at
) VALUES
    ('PO-20260518-0301-D01', 'PO-20260518-0301', '2026-06-18', '星河数字科技研发中心', '王然', '138-0000-0000', '先送达测试实验室，资产管理员现场验收', '2026-05-19 11:20:00', '2026-05-19 11:20:00'),
    ('PO-20260518-0302-D01', 'PO-20260518-0302', '2026-06-03', '星河数字科技行政仓', '赵敏', '139-0000-0000', '办公耗材按行政仓收货窗口配送', '2026-05-19 11:25:00', '2026-05-19 11:25:00'),
    ('PO-20260518-0304-D01', 'PO-20260518-0304', '2026-06-20', '星河数字科技网络机房', '王然', '138-0000-0000', '因机房改造窗口调整，本单已取消', '2026-05-19 11:30:00', '2026-05-19 11:50:00');

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
    ('PO-20260518-0301-R01', 'PO-20260518-0301', 'company-digital', 'user-digital-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0301 选定报价 RFQ-20260518-0301-Q01 创建', '2026-05-19 11:20:00'),
    ('PO-20260518-0302-R01', 'PO-20260518-0302', 'company-digital', 'user-digital-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0302 选定报价 RFQ-20260518-0302-Q01 创建', '2026-05-19 11:25:00'),
    ('PO-20260518-0302-R02', 'PO-20260518-0302', 'company-digital', 'user-digital-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给供应商，等待后续收货登记', '2026-05-19 11:36:00'),
    ('PO-20260518-0304-R01', 'PO-20260518-0304', 'company-digital', 'user-digital-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0304 选定报价 RFQ-20260518-0304-Q03 创建', '2026-05-19 11:30:00'),
    ('PO-20260518-0304-R02', 'PO-20260518-0304', 'company-digital', 'user-digital-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给供应商确认交付窗口', '2026-05-19 11:38:00'),
    ('PO-20260518-0304-R03', 'PO-20260518-0304', 'company-digital', 'user-digital-buyer', 'CANCELLED', 'ISSUED', 'CANCELLED', '机房改造窗口推迟，取消后重新询价', '2026-05-19 11:50:00');
