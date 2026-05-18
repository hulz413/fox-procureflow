CREATE TABLE approval_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NULL,
    rule_name VARCHAR(160) NOT NULL,
    min_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    max_amount DECIMAL(14, 2) NULL,
    priority INT NOT NULL DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_approval_rules_rule_id (rule_id),
    KEY idx_approval_rules_company_active_priority (company_id, active, priority),
    KEY idx_approval_rules_category_id (category_id)
);

CREATE TABLE approval_rule_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_id VARCHAR(64) NOT NULL,
    step_order INT NOT NULL,
    node_name VARCHAR(128) NOT NULL,
    approver_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_approval_rule_steps_rule_step (rule_id, step_order),
    KEY idx_approval_rule_steps_approver_id (approver_id),
    CONSTRAINT fk_approval_rule_steps_rule_id
        FOREIGN KEY (rule_id) REFERENCES approval_rules (rule_id)
        ON DELETE CASCADE
);

CREATE TABLE approval_instances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    approval_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    matched_rule_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    current_step_order INT NULL,
    context_snapshot_json JSON NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_approval_instances_approval_id (approval_id),
    UNIQUE KEY uk_approval_instances_request_id (request_id),
    KEY idx_approval_instances_company_status (company_id, status),
    KEY idx_approval_instances_requester_id (requester_id),
    KEY idx_approval_instances_rule_id (matched_rule_id),
    CONSTRAINT fk_approval_instances_request_id
        FOREIGN KEY (request_id) REFERENCES purchase_requests (request_id)
        ON DELETE CASCADE
);

CREATE TABLE approval_nodes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    node_id VARCHAR(80) NOT NULL,
    approval_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    step_order INT NOT NULL,
    node_name VARCHAR(128) NOT NULL,
    approver_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    activated_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_approval_nodes_node_id (node_id),
    UNIQUE KEY uk_approval_nodes_approval_step (approval_id, step_order),
    KEY idx_approval_nodes_task (company_id, approver_id, status, activated_at),
    KEY idx_approval_nodes_approval_status (approval_id, status),
    CONSTRAINT fk_approval_nodes_approval_id
        FOREIGN KEY (approval_id) REFERENCES approval_instances (approval_id)
        ON DELETE CASCADE
);

CREATE TABLE approval_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_id VARCHAR(80) NOT NULL,
    approval_id VARCHAR(64) NOT NULL,
    node_id VARCHAR(80) NULL,
    company_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    comment_text VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_approval_records_record_id (record_id),
    KEY idx_approval_records_approval_created (approval_id, created_at),
    KEY idx_approval_records_actor_id (actor_id),
    CONSTRAINT fk_approval_records_approval_id
        FOREIGN KEY (approval_id) REFERENCES approval_instances (approval_id)
        ON DELETE CASCADE
);

INSERT INTO approval_rules (
    rule_id,
    company_id,
    category_id,
    rule_name,
    min_amount,
    max_amount,
    priority,
    active
) VALUES
    ('rule-digital-it-high', 'company-digital', 'category-it-hardware', '数字科技 IT 设备大额审批', 100000.00, NULL, 10, TRUE),
    ('rule-digital-default', 'company-digital', NULL, '数字科技默认采购审批', 0.00, NULL, 100, TRUE),
    ('rule-mfg-spares', 'company-manufacturing', 'category-equipment-spares', '智能制造设备备件审批', 0.00, NULL, 10, TRUE),
    ('rule-mfg-default', 'company-manufacturing', NULL, '智能制造默认采购审批', 0.00, NULL, 100, TRUE);

INSERT INTO approval_rule_steps (rule_id, step_order, node_name, approver_id)
VALUES
    ('rule-digital-it-high', 1, '部门负责人审批', 'user-digital-approver'),
    ('rule-digital-it-high', 2, '财务审批', 'user-digital-finance'),
    ('rule-digital-default', 1, '业务负责人审批', 'user-digital-approver'),
    ('rule-mfg-spares', 1, '生产负责人审批', 'user-mfg-approver'),
    ('rule-mfg-default', 1, '业务负责人审批', 'user-mfg-approver');

INSERT INTO approval_instances (
    approval_id,
    request_id,
    company_id,
    requester_id,
    matched_rule_id,
    status,
    current_step_order,
    context_snapshot_json,
    started_at,
    created_at,
    updated_at
)
SELECT
    'AP-20260518-0102',
    request_id,
    company_id,
    requester_id,
    'rule-digital-default',
    'IN_PROGRESS',
    1,
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
        'lineCount', (SELECT COUNT(*) FROM purchase_request_lines WHERE purchase_request_lines.request_id = purchase_requests.request_id)
    ),
    submitted_at,
    submitted_at,
    submitted_at
FROM purchase_requests
WHERE request_id = 'PR-20260518-0102'
  AND status = 'SUBMITTED';

INSERT INTO approval_instances (
    approval_id,
    request_id,
    company_id,
    requester_id,
    matched_rule_id,
    status,
    current_step_order,
    context_snapshot_json,
    started_at,
    created_at,
    updated_at
)
SELECT
    'AP-20260518-0201',
    request_id,
    company_id,
    requester_id,
    'rule-mfg-spares',
    'IN_PROGRESS',
    1,
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
        'lineCount', (SELECT COUNT(*) FROM purchase_request_lines WHERE purchase_request_lines.request_id = purchase_requests.request_id)
    ),
    submitted_at,
    submitted_at,
    submitted_at
FROM purchase_requests
WHERE request_id = 'PR-20260518-0201'
  AND status = 'SUBMITTED';

INSERT INTO approval_nodes (
    node_id,
    approval_id,
    request_id,
    company_id,
    step_order,
    node_name,
    approver_id,
    status,
    activated_at,
    created_at,
    updated_at
)
SELECT
    'AP-20260518-0102-N01',
    approval_id,
    request_id,
    company_id,
    1,
    '业务负责人审批',
    'user-digital-approver',
    'ACTIVE',
    started_at,
    started_at,
    started_at
FROM approval_instances
WHERE approval_id = 'AP-20260518-0102';

INSERT INTO approval_nodes (
    node_id,
    approval_id,
    request_id,
    company_id,
    step_order,
    node_name,
    approver_id,
    status,
    activated_at,
    created_at,
    updated_at
)
SELECT
    'AP-20260518-0201-N01',
    approval_id,
    request_id,
    company_id,
    1,
    '生产负责人审批',
    'user-mfg-approver',
    'ACTIVE',
    started_at,
    started_at,
    started_at
FROM approval_instances
WHERE approval_id = 'AP-20260518-0201';

INSERT INTO approval_records (
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
    '提交采购申请后自动进入审批流',
    started_at
FROM approval_instances
WHERE approval_id IN ('AP-20260518-0102', 'AP-20260518-0201');
