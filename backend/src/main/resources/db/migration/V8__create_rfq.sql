INSERT IGNORE INTO demo_supplier_categories (supplier_id, category_id)
VALUES
    ('supplier-chengcai', 'category-it-hardware');

CREATE TABLE rfqs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rfq_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    approval_id VARCHAR(64) NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    procurement_user_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    budget_account_id VARCHAR(64) NOT NULL,
    title VARCHAR(180) NOT NULL,
    status VARCHAR(32) NOT NULL,
    request_total_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    expected_delivery_date DATE NOT NULL,
    request_snapshot_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rfqs_rfq_id (rfq_id),
    UNIQUE KEY uk_rfqs_request_id (request_id),
    KEY idx_rfqs_company_status_created (company_id, status, created_at),
    KEY idx_rfqs_request_id (request_id),
    KEY idx_rfqs_approval_id (approval_id),
    KEY idx_rfqs_procurement_user_id (procurement_user_id),
    CONSTRAINT fk_rfqs_request_id
        FOREIGN KEY (request_id) REFERENCES purchase_requests (request_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rfqs_approval_id
        FOREIGN KEY (approval_id) REFERENCES approval_instances (approval_id)
        ON DELETE CASCADE
);

CREATE TABLE rfq_suppliers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rfq_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    service_scope VARCHAR(255) NOT NULL,
    location VARCHAR(128) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    shared_scope VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    category_coverage_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rfq_suppliers_rfq_supplier (rfq_id, supplier_id),
    KEY idx_rfq_suppliers_supplier_id (supplier_id),
    CONSTRAINT fk_rfq_suppliers_rfq_id
        FOREIGN KEY (rfq_id) REFERENCES rfqs (rfq_id)
        ON DELETE CASCADE
);

CREATE TABLE rfq_quotes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    quote_id VARCHAR(80) NOT NULL,
    rfq_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    quote_amount DECIMAL(14, 2) NOT NULL,
    tax_rate DECIMAL(6, 4) NOT NULL,
    tax_amount DECIMAL(14, 2) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL,
    delivery_date DATE NOT NULL,
    supplier_score DECIMAL(5, 2) NOT NULL,
    risk_note VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rfq_quotes_quote_id (quote_id),
    UNIQUE KEY uk_rfq_quotes_rfq_supplier (rfq_id, supplier_id),
    KEY idx_rfq_quotes_rfq_id (rfq_id),
    KEY idx_rfq_quotes_supplier_id (supplier_id),
    CONSTRAINT fk_rfq_quotes_rfq_id
        FOREIGN KEY (rfq_id) REFERENCES rfqs (rfq_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rfq_quotes_rfq_supplier
        FOREIGN KEY (rfq_id, supplier_id) REFERENCES rfq_suppliers (rfq_id, supplier_id)
        ON DELETE CASCADE
);

CREATE TABLE rfq_quote_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id VARCHAR(96) NOT NULL,
    quote_id VARCHAR(80) NOT NULL,
    rfq_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    content_type VARCHAR(128) NULL,
    size_bytes BIGINT NULL,
    storage_object_key VARCHAR(512) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rfq_quote_attachments_attachment_id (attachment_id),
    KEY idx_rfq_quote_attachments_quote_id (quote_id),
    KEY idx_rfq_quote_attachments_rfq_supplier (rfq_id, supplier_id),
    CONSTRAINT fk_rfq_quote_attachments_quote_id
        FOREIGN KEY (quote_id) REFERENCES rfq_quotes (quote_id)
        ON DELETE CASCADE
);
