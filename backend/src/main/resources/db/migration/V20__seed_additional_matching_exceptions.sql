UPDATE supplier_invoices
SET untaxed_amount = 66035.40,
    tax_amount = 8584.60,
    total_amount = 74620.00,
    note = '供应商发票包含额外席位服务费，留给三单匹配识别',
    updated_at = '2026-06-13 10:15:00'
WHERE invoice_id = 'INV-20260519-0303';

UPDATE supplier_invoice_lines
SET untaxed_amount = 66035.40,
    tax_amount = 8584.60,
    total_amount = 74620.00
WHERE invoice_line_id = 'INV-20260519-0303-L01';

UPDATE three_way_match_results
SET status = 'EXCEPTION',
    difference_count = 1,
    highest_severity = 'MEDIUM',
    last_calculated_at = '2026-06-05 16:35:00',
    updated_at = '2026-06-05 16:35:00'
WHERE match_id = 'TWM-20260519-0002';

UPDATE three_way_match_results
SET status = 'EXCEPTION',
    invoice_total_amount = 74620.00,
    invoice_variance_amount = 2300.00,
    difference_count = 1,
    highest_severity = 'MEDIUM',
    last_calculated_at = '2026-06-13 10:15:00',
    updated_at = '2026-06-13 10:15:00'
WHERE match_id = 'TWM-20260519-0003';

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
    (
        'TWM-20260519-0003-D01',
        'TWM-20260519-0003',
        'company-digital',
        'PO-20260518-0303',
        NULL,
        NULL,
        NULL,
        NULL,
        'INVOICE_AMOUNT_MISMATCH',
        'MEDIUM',
        NULL,
        NULL,
        NULL,
        NULL,
        72320.00,
        74620.00,
        2300.00,
        'CNY',
        '发票含税金额与采购订单含税金额不一致',
        '2026-06-13 10:15:00'
    );
