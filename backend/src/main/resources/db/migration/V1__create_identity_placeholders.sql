CREATE TABLE demo_company_context (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    business_scope VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_demo_company_context_company_id (company_id)
);

INSERT INTO demo_company_context (group_id, company_id, company_name, business_scope, active)
VALUES
    ('group-xinghe', 'company-digital', '星河数字科技有限公司', 'IT 设备、软件订阅、办公采购', TRUE),
    ('group-xinghe', 'company-manufacturing', '星河智能制造有限公司', '生产耗材、设备备件、物流服务', FALSE);
