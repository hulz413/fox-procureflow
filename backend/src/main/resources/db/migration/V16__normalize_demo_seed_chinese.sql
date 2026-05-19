UPDATE demo_company_context
SET business_scope = '信息技术设备、软件订阅、办公采购'
WHERE company_id = 'company-digital';

UPDATE demo_companies
SET business_scope = '信息技术设备、软件订阅、办公采购'
WHERE company_id = 'company-digital';

UPDATE demo_departments
SET function_scope = '信息技术设备、软件订阅和技术服务申请'
WHERE department_id = 'dept-digital-it';

UPDATE demo_users
SET position_title = '信息技术设备申请人'
WHERE user_id = 'user-digital-applicant';

UPDATE demo_procurement_categories
SET category_name = '信息技术设备',
    business_scope = '笔记本、显示器、配件等办公信息技术硬件'
WHERE category_id = 'category-it-hardware';

UPDATE demo_procurement_categories
SET business_scope = '在线软件订阅、软件许可和信息技术服务'
WHERE category_id = 'category-software-subscription';

UPDATE demo_suppliers
SET service_scope = '软件订阅 / 信息技术服务'
WHERE supplier_id = 'supplier-yunzhou';

UPDATE demo_budget_accounts
SET account_name = '数字科技 信息技术设备预算'
WHERE budget_account_id = 'budget-digital-it-equipment';

UPDATE purchase_requests
SET title = '研发集成开发工具企业订阅续费',
    description = '研发团队需要续费集成开发工具企业订阅，覆盖后端、前端和测试工程师席位。',
    field_snapshot_json = JSON_SET(field_snapshot_json, '$.title', '研发集成开发工具企业订阅续费')
WHERE request_id = 'PR-20260518-0102';

UPDATE purchase_requests
SET title = '设计协作软件订阅扩容',
    field_snapshot_json = JSON_SET(field_snapshot_json, '$.title', '设计协作软件订阅扩容')
WHERE request_id = 'PR-20260519-0303';

UPDATE purchase_requests
SET title = '浏览器验证采购订单申请',
    description = '浏览器验证采购订单流程使用的中文演示申请。',
    field_snapshot_json = JSON_SET(field_snapshot_json, '$.title', '浏览器验证采购订单申请')
WHERE title LIKE 'Browser PO verification%';

UPDATE purchase_requests
SET title = '浏览器验证信息技术设备询价申请',
    description = '浏览器验证询价流程使用的中文演示申请。',
    field_snapshot_json = JSON_SET(field_snapshot_json, '$.title', '浏览器验证信息技术设备询价申请')
WHERE title LIKE 'RFQ 浏览器验证 IT 设备%';

UPDATE purchase_requests
SET title = REPLACE(title, 'IT 设备', '信息技术设备'),
    description = REPLACE(description, 'IT 设备', '信息技术设备'),
    field_snapshot_json = JSON_SET(
        field_snapshot_json,
        '$.title',
        REPLACE(JSON_UNQUOTE(JSON_EXTRACT(field_snapshot_json, '$.title')), 'IT 设备', '信息技术设备')
    )
WHERE title LIKE '%IT 设备%'
   OR description LIKE '%IT 设备%';

UPDATE purchase_request_lines
SET item_name = '集成开发工具企业订阅'
WHERE request_id = 'PR-20260518-0102'
  AND line_no = 1;

UPDATE purchase_request_lines
SET item_name = REPLACE(item_name, 'IT 设备', '信息技术设备'),
    specification = REPLACE(specification, 'IT 设备', '信息技术设备')
WHERE item_name LIKE '%IT 设备%'
   OR specification LIKE '%IT 设备%';

UPDATE approval_instances approval
JOIN purchase_requests request ON request.request_id = approval.request_id
SET approval.context_snapshot_json = JSON_SET(approval.context_snapshot_json, '$.title', request.title);

UPDATE rfqs
SET title = CASE rfq_id
    WHEN 'RFQ-20260518-0301' THEN '研发测试工作站采购询价'
    WHEN 'RFQ-20260518-0302' THEN '行政办公耗材季度补货询价'
    WHEN 'RFQ-20260518-0304' THEN '研发网络安全网关采购询价'
    WHEN 'RFQ-20260518-0303' THEN '设计协作软件订阅扩容询价'
    WHEN 'RFQ-20260518-0201' THEN '灌装线传感器备件采购询价'
    WHEN 'RFQ-20260518-0202' THEN '华东仓临时配送服务采购询价'
    ELSE title
END
WHERE rfq_id IN (
    'RFQ-20260518-0301',
    'RFQ-20260518-0302',
    'RFQ-20260518-0304',
    'RFQ-20260518-0303',
    'RFQ-20260518-0201',
    'RFQ-20260518-0202'
);

UPDATE rfqs
SET title = '浏览器验证信息技术设备询价'
WHERE title LIKE 'RFQ 浏览器验证%';

UPDATE rfqs
SET title = CONCAT(TRIM(SUBSTRING(title, 1, CHAR_LENGTH(title) - 4)), '询价')
WHERE title LIKE '% RFQ';

UPDATE rfqs
SET title = REPLACE(title, 'IT 设备', '信息技术设备')
WHERE title LIKE '%IT 设备%';

UPDATE rfqs rfq
JOIN purchase_requests request ON request.request_id = rfq.request_id
SET rfq.request_snapshot_json = JSON_SET(rfq.request_snapshot_json, '$.title', request.title)
WHERE JSON_CONTAINS_PATH(rfq.request_snapshot_json, 'one', '$.title');

UPDATE rfq_suppliers
SET service_scope = '软件订阅 / 信息技术服务'
WHERE supplier_id = 'supplier-yunzhou';

UPDATE purchase_orders
SET supplier_service_scope = '软件订阅 / 信息技术服务'
WHERE supplier_id = 'supplier-yunzhou';

UPDATE purchase_orders
SET title = CASE po_id
    WHEN 'PO-20260518-0301' THEN '采购订单：研发测试工作站采购'
    WHEN 'PO-20260518-0302' THEN '采购订单：行政办公耗材季度补货'
    WHEN 'PO-20260518-0304' THEN '采购订单：研发网络安全网关采购'
    WHEN 'PO-20260518-0303' THEN '采购订单：设计协作软件订阅扩容'
    WHEN 'PO-20260518-0201' THEN '采购订单：灌装线传感器备件采购'
    WHEN 'PO-20260518-0202' THEN '采购订单：华东仓临时配送服务采购'
    ELSE title
END
WHERE po_id IN (
    'PO-20260518-0301',
    'PO-20260518-0302',
    'PO-20260518-0304',
    'PO-20260518-0303',
    'PO-20260518-0201',
    'PO-20260518-0202'
);

UPDATE purchase_orders
SET title = CONCAT('采购订单：', TRIM(REPLACE(SUBSTRING(title, 6), ' RFQ', '')))
WHERE title LIKE 'PO - %';

UPDATE purchase_orders
SET title = REPLACE(REPLACE(title, 'IT 设备', '信息技术设备'), 'SaaS', '软件')
WHERE title LIKE '%IT 设备%'
   OR title LIKE '%SaaS%';

UPDATE purchase_order_status_records
SET comment_text = CONCAT(
    '基于询价单 ',
    SUBSTRING_INDEX(SUBSTRING_INDEX(comment_text, ' quote ', 1), 'Created from RFQ ', -1),
    ' 的选定报价 ',
    SUBSTRING_INDEX(comment_text, ' quote ', -1),
    ' 创建采购订单'
)
WHERE comment_text LIKE 'Created from RFQ % quote %';

UPDATE purchase_order_status_records
SET comment_text = REPLACE(REPLACE(comment_text, '从 RFQ-', '从询价单 RFQ-'), ' PO', '采购订单')
WHERE comment_text LIKE '%RFQ%'
   OR comment_text LIKE '% PO%';

UPDATE three_way_match_results
SET po_title = CASE po_id
    WHEN 'PO-20260518-0301' THEN '采购订单：研发测试工作站采购'
    WHEN 'PO-20260518-0302' THEN '采购订单：行政办公耗材季度补货'
    WHEN 'PO-20260518-0303' THEN '采购订单：设计协作软件订阅扩容'
    WHEN 'PO-20260518-0201' THEN '采购订单：灌装线传感器备件采购'
    WHEN 'PO-20260518-0202' THEN '采购订单：华东仓临时配送服务采购'
    ELSE po_title
END
WHERE po_id IN (
    'PO-20260518-0301',
    'PO-20260518-0302',
    'PO-20260518-0303',
    'PO-20260518-0201',
    'PO-20260518-0202'
);

UPDATE three_way_match_results
SET po_title = CONCAT('采购订单：', TRIM(REPLACE(SUBSTRING(po_title, 6), ' RFQ', '')))
WHERE po_title LIKE 'PO - %';

UPDATE three_way_match_results
SET po_title = REPLACE(REPLACE(po_title, 'IT 设备', '信息技术设备'), 'SaaS', '软件')
WHERE po_title LIKE '%IT 设备%'
   OR po_title LIKE '%SaaS%';

UPDATE supplier_invoices
SET note = REPLACE(REPLACE(note, '较 PO 多', '较采购订单多'), '与 PO 一致', '与采购订单一致')
WHERE note LIKE '% PO %'
   OR note LIKE '%PO %';

UPDATE three_way_match_differences
SET description = REPLACE(description, 'PO 含税金额', '采购订单含税金额')
WHERE description LIKE '%PO 含税金额%';

UPDATE rfq_quote_attachments
SET file_name = CASE attachment_id
    WHEN 'RFQ-20260518-0301-Q01-A01' THEN '蓝芯移动工作站报价单.pdf'
    WHEN 'RFQ-20260518-0301-Q02-A01' THEN '云舟移动工作站报价单.pdf'
    WHEN 'RFQ-20260518-0301-Q03-A01' THEN '诚采移动工作站报价单.pdf'
    WHEN 'RFQ-20260518-0302-Q01-A01' THEN '诚采办公耗材报价单.pdf'
    WHEN 'RFQ-20260518-0304-Q01-A01' THEN '云舟网络安全网关报价单.pdf'
    WHEN 'RFQ-20260518-0304-Q02-A01' THEN '诚采网络安全网关报价单.pdf'
    WHEN 'RFQ-20260518-0304-Q03-A01' THEN '蓝芯网络安全网关报价单.pdf'
    ELSE file_name
END
WHERE attachment_id IN (
    'RFQ-20260518-0301-Q01-A01',
    'RFQ-20260518-0301-Q02-A01',
    'RFQ-20260518-0301-Q03-A01',
    'RFQ-20260518-0302-Q01-A01',
    'RFQ-20260518-0304-Q01-A01',
    'RFQ-20260518-0304-Q02-A01',
    'RFQ-20260518-0304-Q03-A01'
);

UPDATE purchase_receipt_attachments
SET file_name = CASE attachment_id
    WHEN 'RCPT-20260519-0301-A01' THEN '诚采办公耗材首批到货签收照片.jpg'
    WHEN 'RCPT-20260519-0302-A01' THEN '诚采办公耗材补送到货签收照片.jpg'
    ELSE file_name
END
WHERE attachment_id IN ('RCPT-20260519-0301-A01', 'RCPT-20260519-0302-A01');

UPDATE supplier_invoice_attachments
SET file_name = '诚采办公耗材发票.pdf'
WHERE attachment_id = 'INV-20260519-0301-A01';
