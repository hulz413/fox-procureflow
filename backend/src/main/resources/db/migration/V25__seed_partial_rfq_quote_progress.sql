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
VALUES
    (
        'RFQ-20260519-0601',
        'company-digital',
        'PR-20260519-0601',
        'AP-20260519-0601',
        'user-digital-applicant',
        'user-digital-buyer',
        'category-it-hardware',
        'budget-digital-it-equipment',
        '会议室智能屏扩容采购询价',
        'QUOTING',
        78000.00,
        'CNY',
        '2026-06-20',
        JSON_OBJECT(
            'snapshotVersion', 'rfq-source-request-v1',
            'requestId', 'PR-20260519-0601',
            'approvalId', 'AP-20260519-0601',
            'approvalStatus', 'APPROVED',
            'companyId', 'company-digital',
            'requesterId', 'user-digital-applicant',
            'departmentId', 'dept-digital-it',
            'categoryId', 'category-it-hardware',
            'budgetAccountId', 'budget-digital-it-equipment',
            'supplierId', 'supplier-bluechip',
            'title', '会议室智能屏扩容采购',
            'description', '产品和售前团队共用会议室需要补充智能协作屏，支持客户远程评审和方案演示。',
            'totalAmount', 78000.00,
            'currency', 'CNY',
            'expectedDeliveryDate', '2026-06-20',
            'lineItems', JSON_ARRAY(JSON_OBJECT(
                'lineNo', 1,
                'itemName', '会议室智能协作屏',
                'specification', '75 英寸 / 4K / 无线投屏 / 触控白板',
                'quantity', 3.00,
                'unit', '台',
                'estimatedUnitPrice', 26000.00,
                'estimatedAmount', 78000.00,
                'categoryId', 'category-it-hardware'
            ))
        ),
        '2026-05-19 14:02:00',
        '2026-05-19 14:18:00'
    ),
    (
        'RFQ-20260519-0602',
        'company-digital',
        'PR-20260519-0602',
        'AP-20260519-0602',
        'user-digital-applicant',
        'user-digital-buyer',
        'category-it-hardware',
        'budget-digital-it-equipment',
        '研发实验室显示器补充询价',
        'COMPARISON_READY',
        96000.00,
        'CNY',
        '2026-06-18',
        JSON_OBJECT(
            'snapshotVersion', 'rfq-source-request-v1',
            'requestId', 'PR-20260519-0602',
            'approvalId', 'AP-20260519-0602',
            'approvalStatus', 'APPROVED',
            'companyId', 'company-digital',
            'requesterId', 'user-digital-applicant',
            'departmentId', 'dept-digital-it',
            'categoryId', 'category-it-hardware',
            'budgetAccountId', 'budget-digital-it-equipment',
            'supplierId', 'supplier-bluechip',
            'title', '研发实验室显示器补充',
            'description', '研发实验室扩充联调工位，需要补充高分辨率显示器和支架。',
            'totalAmount', 96000.00,
            'currency', 'CNY',
            'expectedDeliveryDate', '2026-06-18',
            'lineItems', JSON_ARRAY(
                JSON_OBJECT(
                    'lineNo', 1,
                    'itemName', '研发显示器',
                    'specification', '27 英寸 / 4K / Type-C 供电',
                    'quantity', 12.00,
                    'unit', '台',
                    'estimatedUnitPrice', 6200.00,
                    'estimatedAmount', 74400.00,
                    'categoryId', 'category-it-hardware'
                ),
                JSON_OBJECT(
                    'lineNo', 2,
                    'itemName', '显示器支架',
                    'specification', '双臂可调节支架',
                    'quantity', 12.00,
                    'unit', '套',
                    'estimatedUnitPrice', 1800.00,
                    'estimatedAmount', 21600.00,
                    'categoryId', 'category-it-hardware'
                )
            )
        ),
        '2026-05-19 14:10:00',
        '2026-05-19 14:32:00'
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
SELECT rfq_id, supplier_id, supplier_name, service_scope, location, risk_level, shared_scope, status, category_coverage_json, created_at
FROM (
    SELECT 'RFQ-20260519-0601' AS rfq_id, 'supplier-yunzhou' AS supplier_id, '上海云舟信息技术有限公司' AS supplier_name, '软件订阅 / IT 服务' AS service_scope, '上海' AS location, 'low' AS risk_level, 'group-shared' AS shared_scope, 'INVITED' AS status, JSON_ARRAY('category-it-hardware', 'category-software-subscription') AS category_coverage_json, '2026-05-19 14:02:00' AS created_at
    UNION ALL SELECT 'RFQ-20260519-0601', 'supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-office-supplies'), '2026-05-19 14:02:00'
    UNION ALL SELECT 'RFQ-20260519-0601', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', '笔记本 / 显示器 / 配件', '深圳', 'medium', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware'), '2026-05-19 14:02:00'
    UNION ALL SELECT 'RFQ-20260519-0602', 'supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', '上海', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-software-subscription'), '2026-05-19 14:10:00'
    UNION ALL SELECT 'RFQ-20260519-0602', 'supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-office-supplies'), '2026-05-19 14:10:00'
    UNION ALL SELECT 'RFQ-20260519-0602', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', '笔记本 / 显示器 / 配件', '深圳', 'medium', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware'), '2026-05-19 14:10:00'
) AS seeded_suppliers
WHERE EXISTS (
    SELECT 1
    FROM rfqs
    WHERE rfqs.rfq_id = seeded_suppliers.rfq_id
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
SELECT quote_id, rfq_id, supplier_id, quote_amount, tax_rate, tax_amount, total_amount, delivery_date, supplier_score, risk_note, created_at, updated_at
FROM (
    SELECT 'RFQ-20260519-0601-Q01' AS quote_id, 'RFQ-20260519-0601' AS rfq_id, 'supplier-bluechip' AS supplier_id, 76500.00 AS quote_amount, 0.1300 AS tax_rate, 9945.00 AS tax_amount, 86445.00 AS total_amount, '2026-06-16' AS delivery_date, 87.00 AS supplier_score, '先回传蓝芯报价，云舟和诚采仍在确认库存与交付排期' AS risk_note, '2026-05-19 14:18:00' AS created_at, '2026-05-19 14:18:00' AS updated_at
    UNION ALL SELECT 'RFQ-20260519-0602-Q01', 'RFQ-20260519-0602', 'supplier-yunzhou', 92500.00, 0.1300, 12025.00, 104525.00, '2026-06-14', 91.00, '报价包含显示器调试和上门安装，蓝芯报价仍待补充', '2026-05-19 14:24:00', '2026-05-19 14:24:00'
    UNION ALL SELECT 'RFQ-20260519-0602-Q02', 'RFQ-20260519-0602', 'supplier-chengcai', 90200.00, 0.1300, 11726.00, 101926.00, '2026-06-17', 82.00, '价格略低，支架交付需拆分批次，蓝芯报价仍未返回', '2026-05-19 14:32:00', '2026-05-19 14:32:00'
) AS seeded_quotes
WHERE EXISTS (
    SELECT 1
    FROM rfq_suppliers
    WHERE rfq_suppliers.rfq_id = seeded_quotes.rfq_id
      AND rfq_suppliers.supplier_id = seeded_quotes.supplier_id
);

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
)
SELECT attachment_id, quote_id, rfq_id, supplier_id, file_name, description, content_type, size_bytes, storage_object_key, created_at
FROM (
    SELECT 'RFQ-20260519-0601-Q01-A01' AS attachment_id, 'RFQ-20260519-0601-Q01' AS quote_id, 'RFQ-20260519-0601' AS rfq_id, 'supplier-bluechip' AS supplier_id, '蓝芯会议室智能屏报价单.pdf' AS file_name, '蓝芯智能协作屏报价单元数据', 'application/pdf' AS content_type, 76000 AS size_bytes, NULL AS storage_object_key, '2026-05-19 14:18:00' AS created_at
    UNION ALL SELECT 'RFQ-20260519-0602-Q01-A01', 'RFQ-20260519-0602-Q01', 'RFQ-20260519-0602', 'supplier-yunzhou', '云舟研发显示器报价单.pdf', '云舟研发显示器报价单元数据', 'application/pdf', 83000, NULL, '2026-05-19 14:24:00'
    UNION ALL SELECT 'RFQ-20260519-0602-Q02-A01', 'RFQ-20260519-0602-Q02', 'RFQ-20260519-0602', 'supplier-chengcai', '诚采研发显示器报价单.pdf', '诚采研发显示器报价单元数据', 'application/pdf', 79000, NULL, '2026-05-19 14:32:00'
) AS seeded_attachments
WHERE EXISTS (
    SELECT 1
    FROM rfq_quotes
    WHERE rfq_quotes.quote_id = seeded_attachments.quote_id
);
