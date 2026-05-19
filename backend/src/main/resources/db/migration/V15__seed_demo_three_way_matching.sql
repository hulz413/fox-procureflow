UPDATE approval_instances
SET status = 'APPROVED',
    current_step_order = NULL,
    completed_at = '2026-05-19 12:30:00',
    updated_at = '2026-05-19 12:30:00'
WHERE approval_id IN ('AP-20260519-0303', 'AP-20260518-0201');

UPDATE approval_nodes
SET status = 'APPROVED',
    completed_at = '2026-05-19 12:30:00',
    updated_at = '2026-05-19 12:30:00'
WHERE node_id IN ('AP-20260519-0303-N01', 'AP-20260518-0201-N01');

UPDATE purchase_requests
SET status = 'SUBMITTED',
    submitted_at = COALESCE(submitted_at, '2026-05-19 12:10:00'),
    updated_at = '2026-05-19 12:10:00'
WHERE request_id = 'PR-20260518-0202';

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
    'AP-20260518-0202',
    request_id,
    company_id,
    requester_id,
    'rule-mfg-default',
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
    '2026-05-19 12:24:00',
    submitted_at,
    '2026-05-19 12:24:00'
FROM purchase_requests
WHERE request_id = 'PR-20260518-0202';

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
    'AP-20260518-0202-N01',
    approval_id,
    request_id,
    company_id,
    1,
    '业务负责人审批',
    'user-mfg-approver',
    'APPROVED',
    started_at,
    '2026-05-19 12:24:00',
    started_at,
    '2026-05-19 12:24:00'
FROM approval_instances
WHERE approval_id = 'AP-20260518-0202';

INSERT IGNORE INTO approval_records (
    record_id,
    approval_id,
    node_id,
    company_id,
    actor_id,
    action,
    comment_text,
    created_at
) VALUES
    ('AP-20260519-0303-R02', 'AP-20260519-0303', 'AP-20260519-0303-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '设计协作订阅扩容同意', '2026-05-19 12:30:00'),
    ('AP-20260518-0201-R02', 'AP-20260518-0201', 'AP-20260518-0201-N01', 'company-manufacturing', 'user-mfg-approver', 'APPROVED', '生产备件采购同意', '2026-05-19 12:30:00'),
    ('AP-20260518-0202-R01', 'AP-20260518-0202', NULL, 'company-manufacturing', 'user-mfg-warehouse', 'CREATED', '提交采购申请后自动进入审批流', '2026-05-19 12:10:00'),
    ('AP-20260518-0202-R02', 'AP-20260518-0202', 'AP-20260518-0202-N01', 'company-manufacturing', 'user-mfg-approver', 'APPROVED', '临时配送服务采购同意', '2026-05-19 12:24:00');

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
) VALUES
    ('RFQ-20260518-0303', 'company-digital', 'PR-20260519-0303', 'AP-20260519-0303', 'user-digital-applicant', 'user-digital-buyer', 'category-software-subscription', 'budget-digital-software', '设计协作 SaaS 订阅扩容 RFQ', 'COMPARISON_READY', 64000.00, 'CNY', '2026-06-12', JSON_OBJECT('snapshotVersion', 'rfq-source-request-v1', 'requestId', 'PR-20260519-0303', 'approvalId', 'AP-20260519-0303', 'approvalStatus', 'APPROVED', 'companyId', 'company-digital', 'lineCount', 1), '2026-05-19 12:32:00', '2026-05-19 12:40:00'),
    ('RFQ-20260518-0201', 'company-manufacturing', 'PR-20260518-0201', 'AP-20260518-0201', 'user-mfg-applicant', 'user-mfg-buyer', 'category-equipment-spares', 'budget-mfg-spares', '灌装线传感器备件采购 RFQ', 'COMPARISON_READY', 72400.00, 'CNY', '2026-06-20', JSON_OBJECT('snapshotVersion', 'rfq-source-request-v1', 'requestId', 'PR-20260518-0201', 'approvalId', 'AP-20260518-0201', 'approvalStatus', 'APPROVED', 'companyId', 'company-manufacturing', 'lineCount', 1), '2026-05-19 12:34:00', '2026-05-19 12:42:00'),
    ('RFQ-20260518-0202', 'company-manufacturing', 'PR-20260518-0202', 'AP-20260518-0202', 'user-mfg-warehouse', 'user-mfg-buyer', 'category-logistics-service', 'budget-mfg-logistics', '华东仓临时配送服务采购 RFQ', 'COMPARISON_READY', 24800.00, 'CNY', '2026-05-31', JSON_OBJECT('snapshotVersion', 'rfq-source-request-v1', 'requestId', 'PR-20260518-0202', 'approvalId', 'AP-20260518-0202', 'approvalStatus', 'APPROVED', 'companyId', 'company-manufacturing', 'lineCount', 1), '2026-05-19 12:36:00', '2026-05-19 12:44:00');

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
) VALUES
    ('RFQ-20260518-0303', 'supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', '上海', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-software-subscription'), '2026-05-19 12:32:00'),
    ('RFQ-20260518-0201', 'supplier-hengrun', '苏州恒润工业设备有限公司', '设备备件 / 维修服务', '苏州', 'medium', 'group-shared', 'INVITED', JSON_ARRAY('category-equipment-spares'), '2026-05-19 12:34:00'),
    ('RFQ-20260518-0202', 'supplier-anjie', '宁波安捷物流有限公司', '物流服务', '宁波', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-logistics-service'), '2026-05-19 12:36:00');

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
    ('RFQ-20260518-0303-Q01', 'RFQ-20260518-0303', 'supplier-yunzhou', 64000.00, 0.1300, 8320.00, 72320.00, '2026-06-12', 93.00, '现有服务商扩容，交付风险低', '2026-05-19 12:40:00', '2026-05-19 12:40:00'),
    ('RFQ-20260518-0201-Q01', 'RFQ-20260518-0201', 'supplier-hengrun', 72400.00, 0.1300, 9412.00, 81812.00, '2026-06-20', 88.00, '备件型号匹配，需跟进到货验收', '2026-05-19 12:42:00', '2026-05-19 12:42:00'),
    ('RFQ-20260518-0202-Q01', 'RFQ-20260518-0202', 'supplier-anjie', 24800.00, 0.1300, 3224.00, 28024.00, '2026-05-31', 86.00, '临时配送资源可锁定，按服务单验收', '2026-05-19 12:44:00', '2026-05-19 12:44:00');

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
) VALUES
    ('PO-20260518-0303', 'company-digital', 'RFQ-20260518-0303', 'RFQ-20260518-0303-Q01', 'PR-20260519-0303', 'AP-20260519-0303', 'user-digital-applicant', 'user-digital-buyer', 'supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', 'low', 'category-software-subscription', 'budget-digital-software', 'PO - 设计协作 SaaS 订阅扩容', 'ISSUED', 64000.00, 0.1300, 8320.00, 72320.00, 'CNY', '2026-06-12', '2026-06-12', '2026-05-19 12:40:00', JSON_OBJECT('snapshotVersion', 'purchase-order-source-v1', 'rfqId', 'RFQ-20260518-0303'), '2026-05-19 12:50:00', '2026-05-19 12:46:00', '2026-05-19 12:50:00'),
    ('PO-20260518-0201', 'company-manufacturing', 'RFQ-20260518-0201', 'RFQ-20260518-0201-Q01', 'PR-20260518-0201', 'AP-20260518-0201', 'user-mfg-applicant', 'user-mfg-buyer', 'supplier-hengrun', '苏州恒润工业设备有限公司', '设备备件 / 维修服务', 'medium', 'category-equipment-spares', 'budget-mfg-spares', 'PO - 灌装线传感器备件采购', 'ISSUED', 72400.00, 0.1300, 9412.00, 81812.00, 'CNY', '2026-06-20', '2026-06-20', '2026-05-19 12:42:00', JSON_OBJECT('snapshotVersion', 'purchase-order-source-v1', 'rfqId', 'RFQ-20260518-0201'), '2026-05-19 12:52:00', '2026-05-19 12:48:00', '2026-05-19 12:52:00'),
    ('PO-20260518-0202', 'company-manufacturing', 'RFQ-20260518-0202', 'RFQ-20260518-0202-Q01', 'PR-20260518-0202', 'AP-20260518-0202', 'user-mfg-warehouse', 'user-mfg-buyer', 'supplier-anjie', '宁波安捷物流有限公司', '物流服务', 'low', 'category-logistics-service', 'budget-mfg-logistics', 'PO - 华东仓临时配送服务采购', 'ISSUED', 24800.00, 0.1300, 3224.00, 28024.00, 'CNY', '2026-05-31', '2026-05-31', '2026-05-19 12:44:00', JSON_OBJECT('snapshotVersion', 'purchase-order-source-v1', 'rfqId', 'RFQ-20260518-0202'), '2026-05-19 12:54:00', '2026-05-19 12:49:00', '2026-05-19 12:54:00');

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
WHERE po.po_id IN ('PO-20260518-0303', 'PO-20260518-0201', 'PO-20260518-0202');

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
    ('PO-20260518-0303-D01', 'PO-20260518-0303', '2026-06-12', '星河数字科技研发中心', '王然', '138-0000-0000', '供应商远程开通席位，采购员确认生效', '2026-05-19 12:46:00', '2026-05-19 12:50:00'),
    ('PO-20260518-0201-D01', 'PO-20260518-0201', '2026-06-20', '星河智能制造备件仓', '陆景行', '137-0000-0000', '备件到货后由仓储和生产共同验收', '2026-05-19 12:48:00', '2026-05-19 12:52:00'),
    ('PO-20260518-0202-D01', 'PO-20260518-0202', '2026-05-31', '星河智能制造华东仓', '陆景行', '137-0000-0000', '配送服务按月末出货记录验收', '2026-05-19 12:49:00', '2026-05-19 12:54:00');

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
    ('PO-20260518-0303-R01', 'PO-20260518-0303', 'company-digital', 'user-digital-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0303 创建订阅扩容 PO', '2026-05-19 12:46:00'),
    ('PO-20260518-0303-R02', 'PO-20260518-0303', 'company-digital', 'user-digital-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给供应商开通席位', '2026-05-19 12:50:00'),
    ('PO-20260518-0201-R01', 'PO-20260518-0201', 'company-manufacturing', 'user-mfg-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0201 创建设备备件 PO', '2026-05-19 12:48:00'),
    ('PO-20260518-0201-R02', 'PO-20260518-0201', 'company-manufacturing', 'user-mfg-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给供应商备货', '2026-05-19 12:52:00'),
    ('PO-20260518-0202-R01', 'PO-20260518-0202', 'company-manufacturing', 'user-mfg-buyer', 'CREATED', NULL, 'DRAFT', '从 RFQ-20260518-0202 创建配送服务 PO', '2026-05-19 12:49:00'),
    ('PO-20260518-0202-R02', 'PO-20260518-0202', 'company-manufacturing', 'user-mfg-buyer', 'PUBLISHED', 'DRAFT', 'ISSUED', '发布给物流供应商', '2026-05-19 12:54:00');

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
    ('RCPT-20260519-0303', 'company-digital', 'PO-20260518-0303', 'supplier-yunzhou', '上海云舟信息技术有限公司', 'user-demo-operator', '2026-06-12', 'RECORDED', '订阅席位已开通并验收', '2026-06-12 10:00:00', '2026-06-12 10:00:00'),
    ('RCPT-20260519-0202', 'company-manufacturing', 'PO-20260518-0202', 'supplier-anjie', '宁波安捷物流有限公司', 'user-mfg-warehouse', '2026-06-01', 'RECORDED', '配送服务完成 50%，剩余服务等待确认', '2026-06-01 11:00:00', '2026-06-01 11:00:00');

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
SELECT CONCAT('RCPT-20260519-0303-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')), 'RCPT-20260519-0303', line.po_id, line.line_id, line.line_no, line.item_name, line.specification, line.quantity, line.unit, '完整验收', '2026-06-12 10:00:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0303'
UNION ALL
SELECT CONCAT('RCPT-20260519-0202-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')), 'RCPT-20260519-0202', line.po_id, line.line_id, line.line_no, line.item_name, line.specification, ROUND(line.quantity * 0.50, 2), line.unit, '服务完成一半', '2026-06-01 11:00:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0202';

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
    ('INV-20260519-0303', 'company-digital', 'PO-20260518-0303', 'supplier-yunzhou', '上海云舟信息技术有限公司', 'FP-YUNZHOU-202606-003', '2026-06-12', 'user-digital-finance', 'RECORDED', 64000.00, 8320.00, 72320.00, 'CNY', '订阅扩容金额与 PO 一致', '2026-06-12 16:00:00', '2026-06-12 16:00:00'),
    ('INV-20260519-0201', 'company-manufacturing', 'PO-20260518-0201', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'FP-HENGRUN-202606-001', '2026-06-21', 'user-mfg-finance', 'RECORDED', 72400.00, 9412.00, 81812.00, 'CNY', '供应商先到票但仓储未登记收货', '2026-06-21 15:00:00', '2026-06-21 15:00:00'),
    ('INV-20260519-0202', 'company-manufacturing', 'PO-20260518-0202', 'supplier-anjie', '宁波安捷物流有限公司', 'FP-ANJIE-202606-001', '2026-06-02', 'user-mfg-finance', 'RECORDED', 24800.00, 3224.00, 28024.00, 'CNY', '发票按完整服务开具，收货服务量尚未确认完成', '2026-06-02 14:00:00', '2026-06-02 14:00:00');

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
SELECT CONCAT('INV-20260519-0303-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')), 'INV-20260519-0303', line.po_id, line.line_id, line.line_no, line.item_name, line.specification, line.quantity, line.unit, 64000.00, 0.1300, 8320.00, 72320.00, 'CNY', '2026-06-12 16:00:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0303'
UNION ALL
SELECT CONCAT('INV-20260519-0201-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')), 'INV-20260519-0201', line.po_id, line.line_id, line.line_no, line.item_name, line.specification, line.quantity, line.unit, 72400.00, 0.1300, 9412.00, 81812.00, 'CNY', '2026-06-21 15:00:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0201'
UNION ALL
SELECT CONCAT('INV-20260519-0202-L', LPAD(CAST(line.line_no AS CHAR), 2, '0')), 'INV-20260519-0202', line.po_id, line.line_id, line.line_no, line.item_name, line.specification, line.quantity, line.unit, 24800.00, 0.1300, 3224.00, 28024.00, 'CNY', '2026-06-02 14:00:00'
FROM purchase_order_lines line
WHERE line.po_id = 'PO-20260518-0202';

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
    ('TWM-20260519-0001', 'company-digital', 'PO-20260518-0301', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', 'PO - 研发测试工作站采购 RFQ', 'PENDING_INPUT', 170856.00, 12.00, 0.00, 0.00, 0.00, -170856.00, 'CNY', 0, NULL, '2026-06-06 09:00:00', '2026-06-06 09:00:00', '2026-06-06 09:00:00'),
    ('TWM-20260519-0002', 'company-digital', 'PO-20260518-0302', 'supplier-chengcai', '杭州诚采办公用品有限公司', 'PO - 行政办公耗材季度补货 RFQ', 'EXCEPTION', 24295.00, 1.00, 1.00, 1.00, 26595.00, 2300.00, 'CNY', 1, 'MEDIUM', '2026-06-05 16:35:00', '2026-06-05 16:35:00', '2026-06-05 16:35:00'),
    ('TWM-20260519-0003', 'company-digital', 'PO-20260518-0303', 'supplier-yunzhou', '上海云舟信息技术有限公司', 'PO - 设计协作 SaaS 订阅扩容', 'MATCHED', 72320.00, 40.00, 40.00, 40.00, 72320.00, 0.00, 'CNY', 0, NULL, '2026-06-12 16:05:00', '2026-06-12 16:05:00', '2026-06-12 16:05:00'),
    ('TWM-20260519-0004', 'company-manufacturing', 'PO-20260518-0201', 'supplier-hengrun', '苏州恒润工业设备有限公司', 'PO - 灌装线传感器备件采购', 'EXCEPTION', 81812.00, 8.00, 0.00, 8.00, 81812.00, 0.00, 'CNY', 1, 'HIGH', '2026-06-21 15:05:00', '2026-06-21 15:05:00', '2026-06-21 15:05:00'),
    ('TWM-20260519-0005', 'company-manufacturing', 'PO-20260518-0202', 'supplier-anjie', '宁波安捷物流有限公司', 'PO - 华东仓临时配送服务采购', 'EXCEPTION', 28024.00, 1.00, 0.50, 1.00, 28024.00, 0.00, 'CNY', 1, 'HIGH', '2026-06-02 14:05:00', '2026-06-02 14:05:00', '2026-06-02 14:05:00');

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
    ('TWM-20260519-0002-D01', 'TWM-20260519-0002', 'company-digital', 'PO-20260518-0302', NULL, NULL, NULL, NULL, 'INVOICE_AMOUNT_MISMATCH', 'MEDIUM', NULL, NULL, NULL, NULL, 24295.00, 26595.00, 2300.00, 'CNY', '发票含税金额与 PO 含税金额不一致', '2026-06-05 16:35:00'),
    ('TWM-20260519-0004-D01', 'TWM-20260519-0004', 'company-manufacturing', 'PO-20260518-0201', 'PO-20260518-0201-L01', 1, '高精度传感器', '灌装线备用件', 'MISSING_RECEIPT', 'HIGH', 8.00, 0.00, 8.00, '件', NULL, NULL, NULL, 'CNY', '已开票但未登记对应收货', '2026-06-21 15:05:00'),
    ('TWM-20260519-0005-D01', 'TWM-20260519-0005', 'company-manufacturing', 'PO-20260518-0202', 'PO-20260518-0202-L01', 1, '临时配送服务', '华东仓月末出货高峰', 'INVOICE_QUANTITY_OVER_RECEIPT', 'HIGH', 1.00, 0.50, 1.00, '项', NULL, NULL, NULL, 'CNY', '发票数量大于累计收货数量', '2026-06-02 14:05:00');
