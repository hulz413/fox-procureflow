DELETE FROM three_way_match_differences
WHERE match_id IN ('TWM-20260519-0001', 'TWM-20260519-0003');

UPDATE supplier_invoices
SET untaxed_amount = 64000.00,
    tax_amount = 8320.00,
    total_amount = 72320.00,
    note = '订阅扩容金额与 PO 一致',
    updated_at = '2026-06-12 16:00:00'
WHERE invoice_id = 'INV-20260519-0303';

UPDATE supplier_invoice_lines
SET untaxed_amount = 64000.00,
    tax_amount = 8320.00,
    total_amount = 72320.00
WHERE invoice_line_id = 'INV-20260519-0303-L01';

UPDATE three_way_match_results
SET status = 'PENDING_INPUT',
    received_total_quantity = 0.00,
    invoiced_total_quantity = 0.00,
    invoice_total_amount = 0.00,
    invoice_variance_amount = -170856.00,
    difference_count = 0,
    highest_severity = NULL,
    last_calculated_at = '2026-06-06 09:00:00',
    updated_at = '2026-06-06 09:00:00'
WHERE match_id = 'TWM-20260519-0001';

UPDATE three_way_match_results
SET status = 'EXCEPTION',
    difference_count = 1,
    highest_severity = 'MEDIUM',
    last_calculated_at = '2026-06-05 16:35:00',
    updated_at = '2026-06-05 16:35:00'
WHERE match_id = 'TWM-20260519-0002';

UPDATE three_way_match_results
SET status = 'MATCHED',
    invoice_total_amount = 72320.00,
    invoice_variance_amount = 0.00,
    difference_count = 0,
    highest_severity = NULL,
    last_calculated_at = '2026-06-12 16:05:00',
    updated_at = '2026-06-12 16:05:00'
WHERE match_id = 'TWM-20260519-0003';

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
)
SELECT
    'TWM-20260519-0006',
    po.company_id,
    po.po_id,
    po.supplier_id,
    po.supplier_name,
    po.title,
    'RESOLVED',
    po.total_amount,
    COALESCE(SUM(line.quantity), 0.00),
    0.00,
    0.00,
    0.00,
    -po.total_amount,
    po.currency,
    1,
    'LOW',
    '2026-05-19 11:55:00',
    '2026-05-19 11:55:00',
    '2026-05-19 11:55:00'
FROM purchase_orders po
JOIN purchase_order_lines line ON line.po_id = po.po_id
WHERE po.po_id = 'PO-20260518-0304'
GROUP BY po.company_id, po.po_id, po.supplier_id, po.supplier_name, po.title, po.total_amount, po.currency;

UPDATE three_way_match_results
SET status = 'RESOLVED',
    difference_count = 1,
    highest_severity = 'LOW',
    last_calculated_at = '2026-05-19 11:55:00',
    updated_at = '2026-05-19 11:55:00'
WHERE po_id = 'PO-20260518-0304';

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
)
SELECT
    'TWM-20260519-0006-D01',
    result.match_id,
    result.company_id,
    result.po_id,
    line.line_id,
    line.line_no,
    line.item_name,
    line.specification,
    'MISSING_INVOICE',
    'LOW',
    line.quantity,
    0.00,
    0.00,
    line.unit,
    result.po_total_amount,
    0.00,
    -result.po_total_amount,
    result.currency,
    'PO 已取消，匹配异常已关闭留档',
    '2026-05-19 11:55:00'
FROM three_way_match_results result
JOIN purchase_order_lines line ON line.po_id = result.po_id AND line.line_no = 1
WHERE result.po_id = 'PO-20260518-0304';

INSERT IGNORE INTO three_way_match_actions (
    action_id,
    match_id,
    company_id,
    action_type,
    actor_id,
    note,
    created_at
)
SELECT
    'TWM-ACT-20260519-0304-01',
    result.match_id,
    result.company_id,
    'RESOLVE',
    'user-digital-finance',
    'PO 已取消，关闭三单匹配跟进',
    '2026-05-19 11:56:00'
FROM three_way_match_results result
WHERE result.po_id = 'PO-20260518-0304';

UPDATE three_way_match_results
SET status = 'RESOLVED',
    difference_count = 1,
    highest_severity = 'HIGH',
    last_calculated_at = '2026-06-02 14:05:00',
    updated_at = '2026-06-02 14:06:00'
WHERE match_id = 'TWM-20260519-0005';

INSERT IGNORE INTO three_way_match_actions (
    action_id,
    match_id,
    company_id,
    action_type,
    actor_id,
    note,
    created_at
)
VALUES (
    'TWM-ACT-20260519-0005-01',
    'TWM-20260519-0005',
    'company-manufacturing',
    'RESOLVE',
    'user-mfg-finance',
    '物流服务量已由仓储确认，关闭三单匹配异常',
    '2026-06-02 14:06:00'
);

UPDATE three_way_match_results
SET status = 'RESOLVED',
    updated_at = '2026-05-20 17:06:00'
WHERE match_id = 'TWM-20260520-0001';

INSERT IGNORE INTO three_way_match_actions (
    action_id,
    match_id,
    company_id,
    action_type,
    actor_id,
    note,
    created_at
)
SELECT
    'TWM-ACT-20260520-0001-01',
    match_id,
    company_id,
    'RESOLVE',
    'user-digital-finance',
    '补充收货说明已记录，关闭三单匹配异常',
    '2026-05-20 17:06:00'
FROM three_way_match_results
WHERE match_id = 'TWM-20260520-0001';
