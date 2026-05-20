INSERT IGNORE INTO purchase_requests (
    request_id,
    company_id,
    requester_id,
    department_id,
    category_id,
    budget_account_id,
    supplier_id,
    title,
    description,
    status,
    total_amount,
    currency,
    expected_delivery_date,
    submitted_at,
    field_snapshot_json,
    created_at,
    updated_at
) VALUES
    ('PR-20260520-0501', 'company-digital', 'user-digital-applicant', 'dept-digital-it', 'category-it-hardware', 'budget-digital-it-equipment', 'supplier-bluechip', '测试工位显示器补采', '补齐测试工位外接显示器，支持移动办公调试。', 'SUBMITTED', 28000.00, 'CNY', '2026-06-15', '2026-05-20 09:05:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 09:00:00', '2026-05-20 09:05:00'),
    ('PR-20260520-0502', 'company-digital', 'user-digital-applicant', 'dept-digital-it', 'category-software-subscription', 'budget-digital-software', 'supplier-yunzhou', '远程协作账号续费', '远程协作账号年度续费，供应商待开通后补收货和发票。', 'SUBMITTED', 25200.00, 'CNY', '2026-06-18', '2026-05-20 09:20:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 09:15:00', '2026-05-20 09:20:00'),
    ('PR-20260520-0503', 'company-digital', 'user-digital-applicant', 'dept-digital-admin', 'category-office-supplies', 'budget-digital-office', 'supplier-chengcai', '茶水间耗材月度补货', '茶水间和公共区域耗材补货，发票含额外配送费待确认。', 'SUBMITTED', 16800.00, 'CNY', '2026-06-10', '2026-05-20 09:35:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 09:30:00', '2026-05-20 09:35:00'),
    ('PR-20260520-0504', 'company-digital', 'user-digital-applicant', 'dept-digital-it', 'category-it-hardware', 'budget-digital-it-equipment', 'supplier-bluechip', '会议室投屏适配器补货', '会议室投屏适配器和备用线材补货，少量差异已处理。', 'SUBMITTED', 3900.00, 'CNY', '2026-06-11', '2026-05-20 09:50:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 09:45:00', '2026-05-20 09:50:00'),
    ('PR-20260520-0601', 'company-manufacturing', 'user-mfg-applicant', 'dept-mfg-production', 'category-production-consumables', 'budget-mfg-consumables', 'supplier-hengrun', '包装膜耗材补货', '生产线包装膜耗材补货，收货和开票已闭环。', 'SUBMITTED', 22000.00, 'CNY', '2026-06-13', '2026-05-20 10:05:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 10:00:00', '2026-05-20 10:05:00'),
    ('PR-20260520-0602', 'company-manufacturing', 'user-mfg-warehouse', 'dept-mfg-warehouse', 'category-logistics-service', 'budget-mfg-logistics', 'supplier-anjie', '夜间短驳车辆服务', '夜间短驳车辆临时服务，等待仓储确认服务量。', 'SUBMITTED', 9000.00, 'CNY', '2026-06-16', '2026-05-20 10:20:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 10:15:00', '2026-05-20 10:20:00'),
    ('PR-20260520-0603', 'company-manufacturing', 'user-mfg-applicant', 'dept-mfg-production', 'category-equipment-spares', 'budget-mfg-spares', 'supplier-hengrun', '贴标机备件安全库存', '贴标机关键备件安全库存补充，供应商已开票但仓库未登记收货。', 'SUBMITTED', 30400.00, 'CNY', '2026-06-19', '2026-05-20 10:35:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 10:30:00', '2026-05-20 10:35:00'),
    ('PR-20260520-0604', 'company-manufacturing', 'user-mfg-warehouse', 'dept-mfg-warehouse', 'category-logistics-service', 'budget-mfg-logistics', 'supplier-anjie', '华北仓临时配送补单', '华北仓临时配送补单，服务量差异已由仓储确认处理。', 'SUBMITTED', 12600.00, 'CNY', '2026-06-12', '2026-05-20 10:50:00', JSON_OBJECT('snapshotVersion', 'matching-demo-v1', 'source', 'three-way-matching'), '2026-05-20 10:45:00', '2026-05-20 10:50:00');

INSERT IGNORE INTO purchase_request_lines (
    request_id,
    line_no,
    item_name,
    specification,
    quantity,
    unit,
    estimated_unit_price,
    estimated_amount,
    category_id,
    created_at
) VALUES
    ('PR-20260520-0501', 1, '27 英寸显示器', '2K / USB-C / 可升降支架', 10.00, '台', 2800.00, 28000.00, 'category-it-hardware', '2026-05-20 09:00:00'),
    ('PR-20260520-0502', 1, '远程协作账号年度包', '专业版 / 15 席位 / 12 个月', 15.00, '套', 1680.00, 25200.00, 'category-software-subscription', '2026-05-20 09:15:00'),
    ('PR-20260520-0503', 1, '茶水间耗材包', '咖啡豆 / 纸杯 / 清洁耗材组合', 40.00, '箱', 420.00, 16800.00, 'category-office-supplies', '2026-05-20 09:30:00'),
    ('PR-20260520-0504', 1, '投屏适配器套装', 'USB-C 转 HDMI / 备用线材', 6.00, '套', 650.00, 3900.00, 'category-it-hardware', '2026-05-20 09:45:00'),
    ('PR-20260520-0601', 1, '包装膜耗材', '生产线通用 50cm 宽幅', 200.00, '卷', 110.00, 22000.00, 'category-production-consumables', '2026-05-20 10:00:00'),
    ('PR-20260520-0602', 1, '夜间短驳车辆服务', '市内夜间短驳 / 含司机', 5.00, '车次', 1800.00, 9000.00, 'category-logistics-service', '2026-05-20 10:15:00'),
    ('PR-20260520-0603', 1, '贴标机备件包', '传感器 / 压轮 / 控制线束', 4.00, '套', 7600.00, 30400.00, 'category-equipment-spares', '2026-05-20 10:30:00'),
    ('PR-20260520-0604', 1, '临时配送服务', '华北仓临时配送补单', 1.00, '项', 12600.00, 12600.00, 'category-logistics-service', '2026-05-20 10:45:00');

INSERT IGNORE INTO approval_instances (
    approval_id,
    request_id,
    company_id,
    requester_id,
    matched_rule_id,
    status,
    current_step_order,
    context_snapshot_json,
    started_at,
    completed_at,
    created_at,
    updated_at
)
SELECT
    CONCAT('AP-', SUBSTRING(request_id, 4)),
    request_id,
    company_id,
    requester_id,
    CASE WHEN company_id = 'company-manufacturing' THEN 'rule-mfg-default' ELSE 'rule-digital-default' END,
    'APPROVED',
    NULL,
    JSON_OBJECT(
        'requestId', request_id,
        'companyId', company_id,
        'requesterId', requester_id,
        'departmentId', department_id,
        'categoryId', category_id,
        'budgetAccountId', budget_account_id,
        'supplierId', supplier_id,
        'title', title,
        'totalAmount', total_amount,
        'currency', currency,
        'expectedDeliveryDate', DATE_FORMAT(expected_delivery_date, '%Y-%m-%d'),
        'lineCount', 1
    ),
    submitted_at,
    DATE_ADD(submitted_at, INTERVAL 20 MINUTE),
    submitted_at,
    DATE_ADD(submitted_at, INTERVAL 20 MINUTE)
FROM purchase_requests
WHERE request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

INSERT IGNORE INTO approval_nodes (
    node_id,
    approval_id,
    request_id,
    company_id,
    step_order,
    node_name,
    approver_id,
    status,
    activated_at,
    completed_at,
    created_at,
    updated_at
)
SELECT
    CONCAT(approval_id, '-N01'),
    approval_id,
    request_id,
    company_id,
    1,
    CASE WHEN company_id = 'company-manufacturing' THEN '业务负责人审批' ELSE '业务负责人审批' END,
    CASE WHEN company_id = 'company-manufacturing' THEN 'user-mfg-approver' ELSE 'user-digital-approver' END,
    'APPROVED',
    started_at,
    completed_at,
    started_at,
    completed_at
FROM approval_instances
WHERE request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

INSERT IGNORE INTO approval_records (
    record_id,
    approval_id,
    node_id,
    company_id,
    actor_id,
    action,
    comment_text,
    created_at
)
SELECT
    CONCAT(approval_id, '-R01'),
    approval_id,
    NULL,
    company_id,
    requester_id,
    'CREATED',
    '提交采购申请后进入演示审批流',
    started_at
FROM approval_instances
WHERE request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
)
UNION ALL
SELECT
    CONCAT(approval_id, '-R02'),
    approval_id,
    CONCAT(approval_id, '-N01'),
    company_id,
    CASE WHEN company_id = 'company-manufacturing' THEN 'user-mfg-approver' ELSE 'user-digital-approver' END,
    'APPROVED',
    '演示数据自动审批通过',
    completed_at
FROM approval_instances
WHERE request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

INSERT IGNORE INTO rfqs (
    rfq_id,
    company_id,
    request_id,
    approval_id,
    requester_id,
    procurement_user_id,
    category_id,
    budget_account_id,
    title,
    status,
    request_total_amount,
    currency,
    expected_delivery_date,
    request_snapshot_json,
    created_at,
    updated_at
)
SELECT
    CONCAT('RFQ-', SUBSTRING(request.request_id, 4)),
    request.company_id,
    request.request_id,
    approval.approval_id,
    request.requester_id,
    CASE WHEN request.company_id = 'company-manufacturing' THEN 'user-mfg-buyer' ELSE 'user-digital-buyer' END,
    request.category_id,
    request.budget_account_id,
    CONCAT(request.title, ' RFQ'),
    'COMPARISON_READY',
    request.total_amount,
    request.currency,
    request.expected_delivery_date,
    JSON_OBJECT(
        'snapshotVersion', 'rfq-source-request-v1',
        'requestId', request.request_id,
        'approvalId', approval.approval_id,
        'approvalStatus', approval.status,
        'companyId', request.company_id,
        'lineCount', 1
    ),
    DATE_ADD(approval.completed_at, INTERVAL 5 MINUTE),
    DATE_ADD(approval.completed_at, INTERVAL 12 MINUTE)
FROM purchase_requests request
JOIN approval_instances approval ON approval.request_id = request.request_id
WHERE request.request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

INSERT IGNORE INTO rfq_suppliers (
    rfq_id,
    supplier_id,
    supplier_name,
    service_scope,
    location,
    risk_level,
    shared_scope,
    status,
    category_coverage_json,
    created_at
)
SELECT
    rfq.rfq_id,
    supplier.supplier_id,
    supplier.supplier_name,
    supplier.service_scope,
    supplier.location,
    supplier.risk_level,
    supplier.shared_scope,
    'INVITED',
    JSON_ARRAY(rfq.category_id),
    rfq.created_at
FROM rfqs rfq
JOIN purchase_requests request ON request.request_id = rfq.request_id
JOIN demo_suppliers supplier ON supplier.supplier_id = request.supplier_id
WHERE request.request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

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
)
SELECT
    CONCAT(rfq.rfq_id, '-Q01'),
    rfq.rfq_id,
    request.supplier_id,
    request.total_amount,
    0.1300,
    ROUND(request.total_amount * 0.13, 2),
    ROUND(request.total_amount * 1.13, 2),
    request.expected_delivery_date,
    CASE request.request_id
        WHEN 'PR-20260520-0503' THEN 84.00
        WHEN 'PR-20260520-0603' THEN 82.00
        ELSE 90.00
    END,
    CASE request.request_id
        WHEN 'PR-20260520-0502' THEN '账号开通后补齐收货和发票'
        WHEN 'PR-20260520-0602' THEN '服务量待仓储确认'
        WHEN 'PR-20260520-0603' THEN '发票先到，收货单待补录'
        ELSE '演示数据报价，便于三单匹配状态覆盖'
    END,
    DATE_ADD(rfq.created_at, INTERVAL 3 MINUTE),
    DATE_ADD(rfq.created_at, INTERVAL 3 MINUTE)
FROM rfqs rfq
JOIN purchase_requests request ON request.request_id = rfq.request_id
WHERE request.request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

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
    created_at,
    updated_at
)
SELECT
    CONCAT('PO-', SUBSTRING(rfq.rfq_id, 5)),
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
        'rfqId', rfq.rfq_id,
        'quoteId', quote.quote_id,
        'supplierId', supplier.supplier_id
    ),
    DATE_ADD(quote.updated_at, INTERVAL 5 MINUTE),
    DATE_ADD(quote.updated_at, INTERVAL 2 MINUTE),
    DATE_ADD(quote.updated_at, INTERVAL 5 MINUTE)
FROM rfqs rfq
JOIN rfq_quotes quote ON quote.rfq_id = rfq.rfq_id
JOIN demo_suppliers supplier ON supplier.supplier_id = quote.supplier_id
WHERE rfq.request_id IN (
    'PR-20260520-0501',
    'PR-20260520-0502',
    'PR-20260520-0503',
    'PR-20260520-0504',
    'PR-20260520-0601',
    'PR-20260520-0602',
    'PR-20260520-0603',
    'PR-20260520-0604'
);

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
WHERE po.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0502',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0602',
    'PO-20260520-0603',
    'PO-20260520-0604'
);

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
)
SELECT
    CONCAT(po.po_id, '-D01'),
    po.po_id,
    po.expected_delivery_date,
    CASE WHEN po.company_id = 'company-manufacturing' THEN '星河智能制造收货点' ELSE '星河数字科技办公区' END,
    CASE WHEN po.company_id = 'company-manufacturing' THEN '陆景行' ELSE '王然' END,
    CASE WHEN po.company_id = 'company-manufacturing' THEN '137-0000-0000' ELSE '138-0000-0000' END,
    '三单匹配扩展演示数据交付计划',
    po.created_at,
    po.updated_at
FROM purchase_orders po
WHERE po.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0502',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0602',
    'PO-20260520-0603',
    'PO-20260520-0604'
);

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
)
SELECT
    CONCAT(po.po_id, '-R01'),
    po.po_id,
    po.company_id,
    po.procurement_user_id,
    'CREATED',
    NULL,
    'DRAFT',
    '从扩展 RFQ 演示数据创建 PO',
    po.created_at
FROM purchase_orders po
WHERE po.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0502',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0602',
    'PO-20260520-0603',
    'PO-20260520-0604'
)
UNION ALL
SELECT
    CONCAT(po.po_id, '-R02'),
    po.po_id,
    po.company_id,
    po.procurement_user_id,
    'PUBLISHED',
    'DRAFT',
    'ISSUED',
    '发布给供应商用于三单匹配演示',
    po.issued_at
FROM purchase_orders po
WHERE po.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0502',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0602',
    'PO-20260520-0603',
    'PO-20260520-0604'
);

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
    ('RCPT-20260520-0501', 'company-digital', 'PO-20260520-0501', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'user-demo-operator', '2026-06-14', 'RECORDED', '显示器已按 PO 数量完成验收', '2026-06-14 09:00:00', '2026-06-14 09:00:00'),
    ('RCPT-20260520-0503', 'company-digital', 'PO-20260520-0503', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'user-demo-operator', '2026-06-14', 'RECORDED', '茶水间耗材已全部入库', '2026-06-14 09:55:00', '2026-06-14 09:55:00'),
    ('RCPT-20260520-0504', 'company-digital', 'PO-20260520-0504', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'user-demo-operator', '2026-06-14', 'RECORDED', '投屏适配器先到 5 套，余量已确认补记处理', '2026-06-14 10:25:00', '2026-06-14 10:25:00'),
    ('RCPT-20260520-0601', 'company-manufacturing', 'PO-20260520-0601', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'user-mfg-warehouse', '2026-06-14', 'RECORDED', '包装膜耗材按 PO 数量入库', '2026-06-14 11:00:00', '2026-06-14 11:00:00'),
    ('RCPT-20260520-0604', 'company-manufacturing', 'PO-20260520-0604', 'supplier-anjie', '宁波安捷物流有限公司', 'user-mfg-warehouse', '2026-06-16', 'RECORDED', '临时配送服务完成 80%，尾差已由仓储说明', '2026-06-16 09:50:00', '2026-06-16 09:50:00');

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
    CONCAT('RCPT-', SUBSTRING(line.po_id, 4), '-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    CONCAT('RCPT-', SUBSTRING(line.po_id, 4)),
    line.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    CASE line.po_id
        WHEN 'PO-20260520-0504' THEN 5.00
        WHEN 'PO-20260520-0604' THEN 0.80
        ELSE line.quantity
    END,
    line.unit,
    CASE line.po_id
        WHEN 'PO-20260520-0504' THEN '先到数量，尾差已处理'
        WHEN 'PO-20260520-0604' THEN '服务完成 80%'
        ELSE '完整验收'
    END,
    CASE line.po_id
        WHEN 'PO-20260520-0501' THEN '2026-06-14 09:00:00'
        WHEN 'PO-20260520-0503' THEN '2026-06-14 09:55:00'
        WHEN 'PO-20260520-0504' THEN '2026-06-14 10:25:00'
        WHEN 'PO-20260520-0601' THEN '2026-06-14 11:00:00'
        ELSE '2026-06-16 09:50:00'
    END
FROM purchase_order_lines line
WHERE line.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0604'
);

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
    ('INV-20260520-0501', 'company-digital', 'PO-20260520-0501', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'FP-BLUECHIP-202606-0501', '2026-06-14', 'user-digital-finance', 'RECORDED', 28000.00, 3640.00, 31640.00, 'CNY', '显示器补采发票金额与 PO 一致', '2026-06-14 09:10:00', '2026-06-14 09:10:00'),
    ('INV-20260520-0503', 'company-digital', 'PO-20260520-0503', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'FP-CHENGCAI-202606-0503', '2026-06-14', 'user-digital-finance', 'RECORDED', 18038.94, 2345.06, 20384.00, 'CNY', '发票包含额外配送费 1400 元', '2026-06-14 10:05:00', '2026-06-14 10:05:00'),
    ('INV-20260520-0504', 'company-digital', 'PO-20260520-0504', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'FP-BLUECHIP-202606-0504', '2026-06-14', 'user-digital-finance', 'RECORDED', 3900.00, 507.00, 4407.00, 'CNY', '投屏适配器按 PO 全量开票，差异已处理', '2026-06-14 10:35:00', '2026-06-14 10:35:00'),
    ('INV-20260520-0601', 'company-manufacturing', 'PO-20260520-0601', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'FP-HENGRUN-202606-0601', '2026-06-14', 'user-mfg-finance', 'RECORDED', 22000.00, 2860.00, 24860.00, 'CNY', '包装膜耗材发票金额与 PO 一致', '2026-06-14 11:10:00', '2026-06-14 11:10:00'),
    ('INV-20260520-0603', 'company-manufacturing', 'PO-20260520-0603', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'FP-HENGRUN-202606-0603', '2026-06-16', 'user-mfg-finance', 'RECORDED', 30400.00, 3952.00, 34352.00, 'CNY', '贴标机备件发票先到，收货单未登记', '2026-06-16 09:20:00', '2026-06-16 09:20:00'),
    ('INV-20260520-0604', 'company-manufacturing', 'PO-20260520-0604', 'supplier-anjie', '宁波安捷物流有限公司', 'FP-ANJIE-202606-0604', '2026-06-16', 'user-mfg-finance', 'RECORDED', 12600.00, 1638.00, 14238.00, 'CNY', '临时配送按完整服务开票，尾差已处理', '2026-06-16 10:00:00', '2026-06-16 10:00:00');

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
    CONCAT('INV-', SUBSTRING(line.po_id, 4), '-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')),
    CONCAT('INV-', SUBSTRING(line.po_id, 4)),
    line.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    line.quantity,
    line.unit,
    CASE line.po_id
        WHEN 'PO-20260520-0501' THEN 28000.00
        WHEN 'PO-20260520-0503' THEN 18038.94
        WHEN 'PO-20260520-0504' THEN 3900.00
        WHEN 'PO-20260520-0601' THEN 22000.00
        WHEN 'PO-20260520-0603' THEN 30400.00
        ELSE 12600.00
    END,
    0.1300,
    CASE line.po_id
        WHEN 'PO-20260520-0501' THEN 3640.00
        WHEN 'PO-20260520-0503' THEN 2345.06
        WHEN 'PO-20260520-0504' THEN 507.00
        WHEN 'PO-20260520-0601' THEN 2860.00
        WHEN 'PO-20260520-0603' THEN 3952.00
        ELSE 1638.00
    END,
    CASE line.po_id
        WHEN 'PO-20260520-0501' THEN 31640.00
        WHEN 'PO-20260520-0503' THEN 20384.00
        WHEN 'PO-20260520-0504' THEN 4407.00
        WHEN 'PO-20260520-0601' THEN 24860.00
        WHEN 'PO-20260520-0603' THEN 34352.00
        ELSE 14238.00
    END,
    'CNY',
    CASE line.po_id
        WHEN 'PO-20260520-0501' THEN '2026-06-14 09:10:00'
        WHEN 'PO-20260520-0503' THEN '2026-06-14 10:05:00'
        WHEN 'PO-20260520-0504' THEN '2026-06-14 10:35:00'
        WHEN 'PO-20260520-0601' THEN '2026-06-14 11:10:00'
        WHEN 'PO-20260520-0603' THEN '2026-06-16 09:20:00'
        ELSE '2026-06-16 10:00:00'
    END
FROM purchase_order_lines line
WHERE line.po_id IN (
    'PO-20260520-0501',
    'PO-20260520-0503',
    'PO-20260520-0504',
    'PO-20260520-0601',
    'PO-20260520-0603',
    'PO-20260520-0604'
);

INSERT IGNORE INTO three_way_match_results (
    match_id,
    company_id,
    po_id,
    supplier_id,
    supplier_name,
    po_title,
    status,
    po_total_amount,
    ordered_total_quantity,
    received_total_quantity,
    invoiced_total_quantity,
    invoice_total_amount,
    invoice_variance_amount,
    currency,
    difference_count,
    highest_severity,
    last_calculated_at,
    created_at,
    updated_at
) VALUES
    ('TWM-20260520-0501', 'company-digital', 'PO-20260520-0501', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'PO - 测试工位显示器补采 RFQ', 'MATCHED', 31640.00, 10.00, 10.00, 10.00, 31640.00, 0.00, 'CNY', 0, NULL, '2026-06-14 09:15:00', '2026-06-14 09:15:00', '2026-06-14 09:15:00'),
    ('TWM-20260520-0502', 'company-digital', 'PO-20260520-0502', 'supplier-yunzhou', '上海云舟信息技术有限公司', 'PO - 远程协作账号续费 RFQ', 'PENDING_INPUT', 28476.00, 15.00, 0.00, 0.00, 0.00, -28476.00, 'CNY', 0, NULL, '2026-06-14 09:30:00', '2026-06-14 09:30:00', '2026-06-14 09:30:00'),
    ('TWM-20260520-0503', 'company-digital', 'PO-20260520-0503', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'PO - 茶水间耗材月度补货 RFQ', 'EXCEPTION', 18984.00, 40.00, 40.00, 40.00, 20384.00, 1400.00, 'CNY', 1, 'MEDIUM', '2026-06-14 10:10:00', '2026-06-14 10:10:00', '2026-06-14 10:10:00'),
    ('TWM-20260520-0504', 'company-digital', 'PO-20260520-0504', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'PO - 会议室投屏适配器补货 RFQ', 'RESOLVED', 4407.00, 6.00, 5.00, 6.00, 4407.00, 0.00, 'CNY', 1, 'MEDIUM', '2026-06-14 10:45:00', '2026-06-14 10:45:00', '2026-06-14 10:45:00'),
    ('TWM-20260520-0601', 'company-manufacturing', 'PO-20260520-0601', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'PO - 包装膜耗材补货 RFQ', 'MATCHED', 24860.00, 200.00, 200.00, 200.00, 24860.00, 0.00, 'CNY', 0, NULL, '2026-06-14 11:20:00', '2026-06-14 11:20:00', '2026-06-14 11:20:00'),
    ('TWM-20260520-0602', 'company-manufacturing', 'PO-20260520-0602', 'supplier-anjie', '宁波安捷物流有限公司', 'PO - 夜间短驳车辆服务 RFQ', 'PENDING_INPUT', 10170.00, 5.00, 0.00, 0.00, 0.00, -10170.00, 'CNY', 0, NULL, '2026-06-14 11:40:00', '2026-06-14 11:40:00', '2026-06-14 11:40:00'),
    ('TWM-20260520-0603', 'company-manufacturing', 'PO-20260520-0603', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'PO - 贴标机备件安全库存 RFQ', 'EXCEPTION', 34352.00, 4.00, 0.00, 4.00, 34352.00, 0.00, 'CNY', 1, 'HIGH', '2026-06-16 09:30:00', '2026-06-16 09:30:00', '2026-06-16 09:30:00'),
    ('TWM-20260520-0604', 'company-manufacturing', 'PO-20260520-0604', 'supplier-anjie', '宁波安捷物流有限公司', 'PO - 华北仓临时配送补单 RFQ', 'RESOLVED', 14238.00, 1.00, 0.80, 1.00, 14238.00, 0.00, 'CNY', 1, 'LOW', '2026-06-16 10:15:00', '2026-06-16 10:15:00', '2026-06-16 10:15:00');

INSERT IGNORE INTO three_way_match_differences (
    difference_id,
    match_id,
    company_id,
    po_id,
    po_line_id,
    line_no,
    item_name,
    specification,
    difference_type,
    severity,
    ordered_quantity,
    received_quantity,
    invoiced_quantity,
    unit,
    po_amount,
    invoice_amount,
    difference_amount,
    currency,
    description,
    created_at
) VALUES
    ('TWM-20260520-0503-D01', 'TWM-20260520-0503', 'company-digital', 'PO-20260520-0503', NULL, NULL, NULL, NULL, 'INVOICE_AMOUNT_MISMATCH', 'MEDIUM', NULL, NULL, NULL, NULL, 18984.00, 20384.00, 1400.00, 'CNY', '发票含税金额包含额外配送费，与 PO 金额不一致', '2026-06-14 10:10:00'),
    ('TWM-20260520-0504-D01', 'TWM-20260520-0504', 'company-digital', 'PO-20260520-0504', 'PO-20260520-0504-L01', 1, '投屏适配器套装', 'USB-C 转 HDMI / 备用线材', 'INVOICE_QUANTITY_OVER_RECEIPT', 'MEDIUM', 6.00, 5.00, 6.00, '套', NULL, NULL, NULL, 'CNY', '发票数量大于已登记收货数量，业务已补充说明', '2026-06-14 10:45:00'),
    ('TWM-20260520-0603-D01', 'TWM-20260520-0603', 'company-manufacturing', 'PO-20260520-0603', 'PO-20260520-0603-L01', 1, '贴标机备件包', '传感器 / 压轮 / 控制线束', 'MISSING_RECEIPT', 'HIGH', 4.00, 0.00, 4.00, '套', NULL, NULL, NULL, 'CNY', '发票已登记但仓储尚未登记对应收货', '2026-06-16 09:30:00'),
    ('TWM-20260520-0604-D01', 'TWM-20260520-0604', 'company-manufacturing', 'PO-20260520-0604', 'PO-20260520-0604-L01', 1, '临时配送服务', '华北仓临时配送补单', 'INVOICE_QUANTITY_OVER_RECEIPT', 'LOW', 1.00, 0.80, 1.00, '项', NULL, NULL, NULL, 'CNY', '服务量尾差已由仓储确认，关闭留档', '2026-06-16 10:15:00');

INSERT IGNORE INTO three_way_match_actions (
    action_id,
    match_id,
    company_id,
    action_type,
    actor_id,
    note,
    created_at
) VALUES
    ('TWM-ACT-20260520-0503-01', 'TWM-20260520-0503', 'company-digital', 'ACKNOWLEDGE', 'user-digital-finance', '已通知供应商拆分配送费，等待重开或补充说明', '2026-06-14 10:20:00'),
    ('TWM-ACT-20260520-0504-01', 'TWM-20260520-0504', 'company-digital', 'RESOLVE', 'user-digital-finance', '业务确认尾差已补记到备用件台账，关闭异常', '2026-06-14 10:48:00'),
    ('TWM-ACT-20260520-0603-01', 'TWM-20260520-0603', 'company-manufacturing', 'MARK_IN_PROGRESS', 'user-mfg-finance', '已要求仓储核对贴标机备件到货记录', '2026-06-16 09:36:00'),
    ('TWM-ACT-20260520-0604-01', 'TWM-20260520-0604', 'company-manufacturing', 'RESOLVE', 'user-mfg-finance', '仓储确认尾差属于调度口径差异，关闭留档', '2026-06-16 10:18:00');
