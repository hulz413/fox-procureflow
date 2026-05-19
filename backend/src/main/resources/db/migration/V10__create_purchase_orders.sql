CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    po_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    rfq_id VARCHAR(64) NOT NULL,
    quote_id VARCHAR(80) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    approval_id VARCHAR(64) NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    procurement_user_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    supplier_service_scope VARCHAR(255) NOT NULL,
    supplier_risk_level VARCHAR(32) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    budget_account_id VARCHAR(64) NOT NULL,
    title VARCHAR(180) NOT NULL,
    status VARCHAR(32) NOT NULL,
    quote_amount DECIMAL(14, 2) NOT NULL,
    tax_rate DECIMAL(6, 4) NOT NULL,
    tax_amount DECIMAL(14, 2) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    expected_delivery_date DATE NOT NULL,
    quote_delivery_date DATE NOT NULL,
    quote_updated_at TIMESTAMP NOT NULL,
    upstream_snapshot_json JSON NOT NULL,
    issued_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_orders_po_id (po_id),
    UNIQUE KEY uk_purchase_orders_rfq_id (rfq_id),
    KEY idx_purchase_orders_company_status_created (company_id, status, created_at),
    KEY idx_purchase_orders_rfq_id (rfq_id),
    KEY idx_purchase_orders_quote_id (quote_id),
    KEY idx_purchase_orders_request_id (request_id),
    KEY idx_purchase_orders_supplier_id (supplier_id),
    CONSTRAINT fk_purchase_orders_rfq_id
        FOREIGN KEY (rfq_id) REFERENCES rfqs (rfq_id),
    CONSTRAINT fk_purchase_orders_quote_id
        FOREIGN KEY (quote_id) REFERENCES rfq_quotes (quote_id),
    CONSTRAINT fk_purchase_orders_request_id
        FOREIGN KEY (request_id) REFERENCES purchase_requests (request_id),
    CONSTRAINT fk_purchase_orders_approval_id
        FOREIGN KEY (approval_id) REFERENCES approval_instances (approval_id)
);

CREATE TABLE purchase_order_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    line_id VARCHAR(80) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    line_no INT NOT NULL,
    item_name VARCHAR(160) NOT NULL,
    specification VARCHAR(255) NULL,
    quantity DECIMAL(14, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    category_id VARCHAR(64) NULL,
    estimated_unit_price DECIMAL(14, 2) NOT NULL,
    estimated_amount DECIMAL(14, 2) NOT NULL,
    confirmed_unit_price DECIMAL(14, 2) NOT NULL,
    confirmed_amount DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_order_lines_line_id (line_id),
    UNIQUE KEY uk_purchase_order_lines_po_line_no (po_id, line_no),
    KEY idx_purchase_order_lines_po_id (po_id),
    CONSTRAINT fk_purchase_order_lines_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
        ON DELETE CASCADE
);

CREATE TABLE purchase_order_delivery_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id VARCHAR(80) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    planned_delivery_date DATE NOT NULL,
    delivery_location VARCHAR(255) NOT NULL,
    contact_person VARCHAR(80) NOT NULL,
    contact_phone VARCHAR(64) NOT NULL,
    delivery_note VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_order_delivery_schedules_schedule_id (schedule_id),
    UNIQUE KEY uk_purchase_order_delivery_schedules_po_id (po_id),
    CONSTRAINT fk_purchase_order_delivery_schedules_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
        ON DELETE CASCADE
);

CREATE TABLE purchase_order_status_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_id VARCHAR(96) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    from_status VARCHAR(32) NULL,
    to_status VARCHAR(32) NOT NULL,
    comment_text VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_order_status_records_record_id (record_id),
    KEY idx_purchase_order_status_records_po_created (po_id, created_at),
    KEY idx_purchase_order_status_records_company_created (company_id, created_at),
    CONSTRAINT fk_purchase_order_status_records_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
        ON DELETE CASCADE
);
