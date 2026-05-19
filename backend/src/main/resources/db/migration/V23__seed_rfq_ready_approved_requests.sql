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
    (
        'PR-20260519-0601',
        'company-digital',
        'user-digital-applicant',
        'dept-digital-it',
        'category-it-hardware',
        'budget-digital-it-equipment',
        'supplier-bluechip',
        '会议室智能屏扩容采购',
        '产品和售前团队共用会议室需要补充智能协作屏，支持客户远程评审和方案演示。',
        'SUBMITTED',
        78000.00,
        'CNY',
        '2026-06-20',
        '2026-05-19 13:05:00',
        JSON_OBJECT('formVersion', 'purchase-request-intake-v1', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-bluechip', 'title', '会议室智能屏扩容采购', 'expectedDeliveryDate', '2026-06-20', 'totalAmount', 78000.00, 'currency', 'CNY', 'lineCount', 1),
        '2026-05-19 12:58:00',
        '2026-05-19 13:16:00'
    ),
    (
        'PR-20260519-0602',
        'company-digital',
        'user-digital-applicant',
        'dept-digital-it',
        'category-it-hardware',
        'budget-digital-it-equipment',
        'supplier-bluechip',
        '研发实验室显示器补充',
        '研发实验室扩充联调工位，需要补充高分辨率显示器和支架。',
        'SUBMITTED',
        96000.00,
        'CNY',
        '2026-06-18',
        '2026-05-19 13:22:00',
        JSON_OBJECT('formVersion', 'purchase-request-intake-v1', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-bluechip', 'title', '研发实验室显示器补充', 'expectedDeliveryDate', '2026-06-18', 'totalAmount', 96000.00, 'currency', 'CNY', 'lineCount', 2),
        '2026-05-19 13:14:00',
        '2026-05-19 13:35:00'
    ),
    (
        'PR-20260519-0603',
        'company-digital',
        'user-digital-applicant',
        'dept-digital-it',
        'category-it-hardware',
        'budget-digital-it-equipment',
        'supplier-yunzhou',
        '测试设备集中采购',
        '测试团队为六月专项验证准备一批通用测试终端和外设。',
        'SUBMITTED',
        68500.00,
        'CNY',
        '2026-06-15',
        '2026-05-19 13:40:00',
        JSON_OBJECT('formVersion', 'purchase-request-intake-v1', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-yunzhou', 'title', '测试设备集中采购', 'expectedDeliveryDate', '2026-06-15', 'totalAmount', 68500.00, 'currency', 'CNY', 'lineCount', 2),
        '2026-05-19 13:32:00',
        '2026-05-19 13:52:00'
    );

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
    ('PR-20260519-0601', 1, '会议室智能协作屏', '75 英寸 / 4K / 无线投屏 / 触控白板', 3.00, '台', 26000.00, 78000.00, 'category-it-hardware', '2026-05-19 12:58:00'),
    ('PR-20260519-0602', 1, '研发显示器', '27 英寸 / 4K / Type-C 供电', 12.00, '台', 6200.00, 74400.00, 'category-it-hardware', '2026-05-19 13:14:00'),
    ('PR-20260519-0602', 2, '显示器支架', '双臂可调节支架', 12.00, '套', 1800.00, 21600.00, 'category-it-hardware', '2026-05-19 13:14:00'),
    ('PR-20260519-0603', 1, '通用测试终端', '小型台式主机 / 32G / 1T SSD', 5.00, '台', 11500.00, 57500.00, 'category-it-hardware', '2026-05-19 13:32:00'),
    ('PR-20260519-0603', 2, '测试外设包', '键鼠、转接线、采集卡组合', 5.00, '套', 2200.00, 11000.00, 'category-it-hardware', '2026-05-19 13:32:00');

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
) VALUES
    ('AP-20260519-0601', 'PR-20260519-0601', 'company-digital', 'user-digital-applicant', 'rule-digital-default', 'APPROVED', NULL, JSON_OBJECT('requestId', 'PR-20260519-0601', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-bluechip', 'title', '会议室智能屏扩容采购', 'totalAmount', 78000.00, 'currency', 'CNY', 'expectedDeliveryDate', '2026-06-20', 'lineCount', 1), '2026-05-19 13:05:00', '2026-05-19 13:16:00', '2026-05-19 13:05:00', '2026-05-19 13:16:00'),
    ('AP-20260519-0602', 'PR-20260519-0602', 'company-digital', 'user-digital-applicant', 'rule-digital-default', 'APPROVED', NULL, JSON_OBJECT('requestId', 'PR-20260519-0602', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-bluechip', 'title', '研发实验室显示器补充', 'totalAmount', 96000.00, 'currency', 'CNY', 'expectedDeliveryDate', '2026-06-18', 'lineCount', 2), '2026-05-19 13:22:00', '2026-05-19 13:35:00', '2026-05-19 13:22:00', '2026-05-19 13:35:00'),
    ('AP-20260519-0603', 'PR-20260519-0603', 'company-digital', 'user-digital-applicant', 'rule-digital-default', 'APPROVED', NULL, JSON_OBJECT('requestId', 'PR-20260519-0603', 'companyId', 'company-digital', 'requesterId', 'user-digital-applicant', 'departmentId', 'dept-digital-it', 'categoryId', 'category-it-hardware', 'budgetAccountId', 'budget-digital-it-equipment', 'supplierId', 'supplier-yunzhou', 'title', '测试设备集中采购', 'totalAmount', 68500.00, 'currency', 'CNY', 'expectedDeliveryDate', '2026-06-15', 'lineCount', 2), '2026-05-19 13:40:00', '2026-05-19 13:52:00', '2026-05-19 13:40:00', '2026-05-19 13:52:00');

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
) VALUES
    ('AP-20260519-0601-N01', 'AP-20260519-0601', 'PR-20260519-0601', 'company-digital', 1, '业务负责人审批', 'user-digital-approver', 'APPROVED', '2026-05-19 13:05:00', '2026-05-19 13:16:00', '2026-05-19 13:05:00', '2026-05-19 13:16:00'),
    ('AP-20260519-0602-N01', 'AP-20260519-0602', 'PR-20260519-0602', 'company-digital', 1, '业务负责人审批', 'user-digital-approver', 'APPROVED', '2026-05-19 13:22:00', '2026-05-19 13:35:00', '2026-05-19 13:22:00', '2026-05-19 13:35:00'),
    ('AP-20260519-0603-N01', 'AP-20260519-0603', 'PR-20260519-0603', 'company-digital', 1, '业务负责人审批', 'user-digital-approver', 'APPROVED', '2026-05-19 13:40:00', '2026-05-19 13:52:00', '2026-05-19 13:40:00', '2026-05-19 13:52:00');

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
    ('AP-20260519-0601-R01', 'AP-20260519-0601', NULL, 'company-digital', 'user-digital-applicant', 'CREATED', '提交采购申请后自动进入审批流', '2026-05-19 13:05:00'),
    ('AP-20260519-0601-R02', 'AP-20260519-0601', 'AP-20260519-0601-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '会议室协作设备需求明确，同意进入询价', '2026-05-19 13:16:00'),
    ('AP-20260519-0602-R01', 'AP-20260519-0602', NULL, 'company-digital', 'user-digital-applicant', 'CREATED', '提交采购申请后自动进入审批流', '2026-05-19 13:22:00'),
    ('AP-20260519-0602-R02', 'AP-20260519-0602', 'AP-20260519-0602-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '实验室工位扩容需求合理，同意采购', '2026-05-19 13:35:00'),
    ('AP-20260519-0603-R01', 'AP-20260519-0603', NULL, 'company-digital', 'user-digital-applicant', 'CREATED', '提交采购申请后自动进入审批流', '2026-05-19 13:40:00'),
    ('AP-20260519-0603-R02', 'AP-20260519-0603', 'AP-20260519-0603-N01', 'company-digital', 'user-digital-approver', 'APPROVED', '测试设备集中采购可进入供应商询价', '2026-05-19 13:52:00');
