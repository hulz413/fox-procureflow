UPDATE rfqs rfq
JOIN purchase_requests request ON request.request_id = rfq.request_id
SET rfq.title = CASE
    WHEN request.title = '浏览器验证采购订单申请' THEN '浏览器验证采购订单申请询价'
    WHEN request.title = '浏览器验证信息技术设备询价申请' THEN '浏览器验证信息技术设备询价'
    WHEN request.title LIKE '%询价' THEN request.title
    ELSE CONCAT(request.title, '询价')
END
WHERE rfq.title REGEXP 'Browser|browser|verification|RFQ 浏览器|PO verification|IT 设备|SaaS|IDE|PO -| RFQ$';

UPDATE purchase_orders po
JOIN purchase_requests request ON request.request_id = po.request_id
SET po.title = CASE
    WHEN request.title = '浏览器验证采购订单申请' THEN '采购订单：浏览器验证采购订单流程'
    WHEN request.title = '浏览器验证信息技术设备询价申请' THEN '采购订单：浏览器验证信息技术设备采购'
    ELSE CONCAT('采购订单：', TRIM(REPLACE(REPLACE(request.title, '询价申请', '采购'), '申请', '')))
END
WHERE po.title REGEXP 'Browser|browser|verification|RFQ 浏览器|PO verification|IT 设备|SaaS|IDE|PO -| RFQ$';

UPDATE purchase_order_status_records record
JOIN purchase_orders po ON po.po_id = record.po_id
SET record.comment_text = CONCAT('基于询价单 ', po.rfq_id, ' 创建采购订单')
WHERE record.comment_text REGEXP 'Browser|browser|verification|PO verification';
