CREATE TABLE purchase_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    budget_account_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    status VARCHAR(32) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    expected_delivery_date DATE NOT NULL,
    submitted_at TIMESTAMP NULL,
    field_snapshot_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_requests_request_id (request_id),
    KEY idx_purchase_requests_company_status_created (company_id, status, created_at),
    KEY idx_purchase_requests_requester_id (requester_id),
    KEY idx_purchase_requests_budget_account_id (budget_account_id),
    KEY idx_purchase_requests_category_id (category_id)
);

CREATE TABLE purchase_request_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(64) NOT NULL,
    line_no INT NOT NULL,
    item_name VARCHAR(160) NOT NULL,
    specification VARCHAR(255) NULL,
    quantity DECIMAL(14, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    estimated_unit_price DECIMAL(14, 2) NOT NULL,
    estimated_amount DECIMAL(14, 2) NOT NULL,
    category_id VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_request_lines_request_line (request_id, line_no),
    KEY idx_purchase_request_lines_request_id (request_id),
    CONSTRAINT fk_purchase_request_lines_request_id
        FOREIGN KEY (request_id) REFERENCES purchase_requests (request_id)
        ON DELETE CASCADE
);
