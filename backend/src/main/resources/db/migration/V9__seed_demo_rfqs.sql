UPDATE approval_instances
SET status = 'APPROVED',
    current_step_order = NULL,
    completed_at = '2026-05-19 10:42:00',
    updated_at = '2026-05-19 10:42:00'
WHERE approval_id IN ('AP-20260519-0301', 'AP-20260519-0302', 'AP-20260519-0304');

UPDATE approval_nodes
SET status = 'APPROVED',
    completed_at = CASE node_id
        WHEN 'AP-20260519-0301-N01' THEN '2026-05-19 10:24:00'
        WHEN 'AP-20260519-0301-N02' THEN '2026-05-19 10:42:00'
        WHEN 'AP-20260519-0302-N01' THEN '2026-05-19 09:48:00'
        WHEN 'AP-20260519-0304-N02' THEN '2026-05-19 10:36:00'
        ELSE completed_at
    END,
    updated_at = CASE node_id
        WHEN 'AP-20260519-0301-N01' THEN '2026-05-19 10:24:00'
        WHEN 'AP-20260519-0301-N02' THEN '2026-05-19 10:42:00'
        WHEN 'AP-20260519-0302-N01' THEN '2026-05-19 09:48:00'
        WHEN 'AP-20260519-0304-N02' THEN '2026-05-19 10:36:00'
        ELSE updated_at
    END
WHERE node_id IN (
    'AP-20260519-0301-N01',
    'AP-20260519-0301-N02',
    'AP-20260519-0302-N01',
    'AP-20260519-0304-N02'
);

UPDATE approval_nodes
SET activated_at = '2026-05-19 10:24:00'
WHERE node_id = 'AP-20260519-0301-N02'
  AND activated_at IS NULL;

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
    ('AP-20260519-0301-R02', 'AP-20260519-0301', 'AP-20260519-0301-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '测试设备预算已确认', '2026-05-19 10:24:00'),
    ('AP-20260519-0301-R03', 'AP-20260519-0301', 'AP-20260519-0301-N02', 'company-digital', 'user-digital-finance', 'APPROVED', '财务复核通过', '2026-05-19 10:42:00'),
    ('AP-20260519-0302-R02', 'AP-20260519-0302', 'AP-20260519-0302-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '办公耗材补货同意', '2026-05-19 09:48:00'),
    ('AP-20260519-0304-R03', 'AP-20260519-0304', 'AP-20260519-0304-N02', 'company-digital', 'user-digital-finance', 'APPROVED', '财务预算锁定前复核通过', '2026-05-19 10:36:00');

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
    (
        'RFQ-20260518-0301',
        'company-digital',
        'PR-20260519-0301',
        'AP-20260519-0301',
        'user-digital-applicant',
        'user-digital-buyer',
        'category-it-hardware',
        'budget-digital-it-equipment',
        '研发测试工作站采购 RFQ',
        'QUOTING',
        156000.00,
        'CNY',
        '2026-06-18',
        JSON_OBJECT(
            'snapshotVersion', 'rfq-source-request-v1',
            'requestId', 'PR-20260519-0301',
            'approvalId', 'AP-20260519-0301',
            'approvalStatus', 'APPROVED',
            'companyId', 'company-digital',
            'requesterId', 'user-digital-applicant',
            'departmentId', 'dept-digital-it',
            'categoryId', 'category-it-hardware',
            'budgetAccountId', 'budget-digital-it-equipment',
            'supplierId', 'supplier-bluechip',
            'title', '研发测试工作站采购',
            'description', '测试团队扩充自动化测试环境，需要补充高性能移动工作站。',
            'totalAmount', 156000.00,
            'currency', 'CNY',
            'expectedDeliveryDate', '2026-06-18',
            'lineItems', JSON_ARRAY(JSON_OBJECT(
                'lineNo', 1,
                'itemName', '高性能移动工作站',
                'specification', '16 英寸 / 64G / 2T SSD / 独显',
                'quantity', 12.00,
                'unit', '台',
                'estimatedUnitPrice', 13000.00,
                'estimatedAmount', 156000.00,
                'categoryId', 'category-it-hardware'
            ))
        ),
        '2026-05-19 10:48:00',
        '2026-05-19 11:04:00'
    ),
    (
        'RFQ-20260518-0302',
        'company-digital',
        'PR-20260519-0302',
        'AP-20260519-0302',
        'user-digital-applicant',
        'user-digital-buyer',
        'category-office-supplies',
        'budget-digital-office',
        '行政办公耗材季度补货 RFQ',
        'ISSUED',
        22800.00,
        'CNY',
        '2026-06-05',
        JSON_OBJECT(
            'snapshotVersion', 'rfq-source-request-v1',
            'requestId', 'PR-20260519-0302',
            'approvalId', 'AP-20260519-0302',
            'approvalStatus', 'APPROVED',
            'companyId', 'company-digital',
            'requesterId', 'user-digital-applicant',
            'departmentId', 'dept-digital-admin',
            'categoryId', 'category-office-supplies',
            'budgetAccountId', 'budget-digital-office',
            'supplierId', 'supplier-chengcai',
            'title', '行政办公耗材季度补货',
            'description', '综合管理部按季度补充打印纸、会议用品和日常办公耗材。',
            'totalAmount', 22800.00,
            'currency', 'CNY',
            'expectedDeliveryDate', '2026-06-05',
            'lineItems', JSON_ARRAY(JSON_OBJECT(
                'lineNo', 1,
                'itemName', '季度办公耗材包',
                'specification', '打印纸、白板笔、会议用品组合',
                'quantity', 1.00,
                'unit', '批',
                'estimatedUnitPrice', 22800.00,
                'estimatedAmount', 22800.00,
                'categoryId', 'category-office-supplies'
            ))
        ),
        '2026-05-19 10:08:00',
        '2026-05-19 10:08:00'
    ),
    (
        'RFQ-20260518-0304',
        'company-digital',
        'PR-20260519-0304',
        'AP-20260519-0304',
        'user-digital-applicant',
        'user-digital-buyer',
        'category-it-hardware',
        'budget-digital-it-equipment',
        '研发网络安全网关采购 RFQ',
        'COMPARISON_READY',
        132000.00,
        'CNY',
        '2026-06-22',
        JSON_OBJECT(
            'snapshotVersion', 'rfq-source-request-v1',
            'requestId', 'PR-20260519-0304',
            'approvalId', 'AP-20260519-0304',
            'approvalStatus', 'APPROVED',
            'companyId', 'company-digital',
            'requesterId', 'user-digital-applicant',
            'departmentId', 'dept-digital-it',
            'categoryId', 'category-it-hardware',
            'budgetAccountId', 'budget-digital-it-equipment',
            'supplierId', 'supplier-bluechip',
            'title', '研发网络安全网关采购',
            'description', '研发测试环境需要独立安全网关设备，隔离外部联调流量。',
            'totalAmount', 132000.00,
            'currency', 'CNY',
            'expectedDeliveryDate', '2026-06-22',
            'lineItems', JSON_ARRAY(JSON_OBJECT(
                'lineNo', 1,
                'itemName', '研发网络安全网关',
                'specification', '千兆吞吐 / VPN / 日志审计',
                'quantity', 6.00,
                'unit', '台',
                'estimatedUnitPrice', 22000.00,
                'estimatedAmount', 132000.00,
                'categoryId', 'category-it-hardware'
            ))
        ),
        '2026-05-19 10:38:00',
        '2026-05-19 11:12:00'
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
) VALUES
    ('RFQ-20260518-0301', 'supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', '上海', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-software-subscription'), '2026-05-19 10:48:00'),
    ('RFQ-20260518-0301', 'supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-office-supplies'), '2026-05-19 10:48:00'),
    ('RFQ-20260518-0301', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', '笔记本 / 显示器 / 配件', '深圳', 'medium', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware'), '2026-05-19 10:48:00'),
    ('RFQ-20260518-0302', 'supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-office-supplies'), '2026-05-19 10:08:00'),
    ('RFQ-20260518-0304', 'supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', '上海', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-software-subscription'), '2026-05-19 10:38:00'),
    ('RFQ-20260518-0304', 'supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'low', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware', 'category-office-supplies'), '2026-05-19 10:38:00'),
    ('RFQ-20260518-0304', 'supplier-bluechip', '深圳蓝芯电子科技有限公司', '笔记本 / 显示器 / 配件', '深圳', 'medium', 'group-shared', 'INVITED', JSON_ARRAY('category-it-hardware'), '2026-05-19 10:38:00');

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
    ('RFQ-20260518-0301-Q01', 'RFQ-20260518-0301', 'supplier-bluechip', 151200.00, 0.1300, 19656.00, 170856.00, '2026-06-12', 88.00, '库存充足，需确认批量交付排期', '2026-05-19 11:04:00', '2026-05-19 11:04:00'),
    ('RFQ-20260518-0304-Q01', 'RFQ-20260518-0304', 'supplier-yunzhou', 129800.00, 0.1300, 16874.00, 146674.00, '2026-06-15', 92.00, '交付最快，含现场配置服务', '2026-05-19 10:52:00', '2026-05-19 10:52:00'),
    ('RFQ-20260518-0304-Q02', 'RFQ-20260518-0304', 'supplier-chengcai', 126500.00, 0.1300, 16445.00, 142945.00, '2026-06-18', 82.00, '价格较稳，需提前锁定运输窗口', '2026-05-19 11:02:00', '2026-05-19 11:02:00'),
    ('RFQ-20260518-0304-Q03', 'RFQ-20260518-0304', 'supplier-bluechip', 122000.00, 0.1300, 15860.00, 137860.00, '2026-06-20', 89.00, '价格最低，硬件型号与申请完全匹配', '2026-05-19 11:12:00', '2026-05-19 11:12:00');

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
    ('RFQ-20260518-0301-Q01-A01', 'RFQ-20260518-0301-Q01', 'RFQ-20260518-0301', 'supplier-bluechip', 'bluechip-workstation-rfq.pdf', '研发测试工作站报价单元数据', 'application/pdf', 96000, NULL, '2026-05-19 11:04:00'),
    ('RFQ-20260518-0304-Q01-A01', 'RFQ-20260518-0304-Q01', 'RFQ-20260518-0304', 'supplier-yunzhou', 'yunzhou-gateway-rfq.pdf', '网络安全网关报价单元数据', 'application/pdf', 86000, NULL, '2026-05-19 10:52:00'),
    ('RFQ-20260518-0304-Q02-A01', 'RFQ-20260518-0304-Q02', 'RFQ-20260518-0304', 'supplier-chengcai', 'chengcai-gateway-rfq.pdf', '诚采网关报价单元数据', 'application/pdf', 79000, NULL, '2026-05-19 11:02:00'),
    ('RFQ-20260518-0304-Q03-A01', 'RFQ-20260518-0304-Q03', 'RFQ-20260518-0304', 'supplier-bluechip', 'bluechip-gateway-rfq.pdf', '蓝芯网关报价单元数据', 'application/pdf', 82000, NULL, '2026-05-19 11:12:00');
