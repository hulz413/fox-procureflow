CREATE TABLE three_way_match_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    match_id VARCHAR(80) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    po_title VARCHAR(180) NOT NULL,
    status VARCHAR(32) NOT NULL,
    po_total_amount DECIMAL(14, 2) NOT NULL,
    ordered_total_quantity DECIMAL(14, 2) NOT NULL,
    received_total_quantity DECIMAL(14, 2) NOT NULL,
    invoiced_total_quantity DECIMAL(14, 2) NOT NULL,
    invoice_total_amount DECIMAL(14, 2) NOT NULL,
    invoice_variance_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    difference_count INT NOT NULL DEFAULT 0,
    highest_severity VARCHAR(32) NULL,
    last_calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_three_way_match_results_match_id (match_id),
    UNIQUE KEY uk_three_way_match_results_po_id (po_id),
    KEY idx_three_way_match_results_company_status_updated (company_id, status, updated_at),
    KEY idx_three_way_match_results_company_updated (company_id, updated_at),
    KEY idx_three_way_match_results_supplier_id (supplier_id),
    CONSTRAINT fk_three_way_match_results_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
);

CREATE TABLE three_way_match_differences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    difference_id VARCHAR(96) NOT NULL,
    match_id VARCHAR(80) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    po_line_id VARCHAR(80) NULL,
    line_no INT NULL,
    item_name VARCHAR(160) NULL,
    specification VARCHAR(255) NULL,
    difference_type VARCHAR(48) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    ordered_quantity DECIMAL(14, 2) NULL,
    received_quantity DECIMAL(14, 2) NULL,
    invoiced_quantity DECIMAL(14, 2) NULL,
    unit VARCHAR(32) NULL,
    po_amount DECIMAL(14, 2) NULL,
    invoice_amount DECIMAL(14, 2) NULL,
    difference_amount DECIMAL(14, 2) NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    description VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_three_way_match_differences_difference_id (difference_id),
    KEY idx_three_way_match_differences_match_id (match_id),
    KEY idx_three_way_match_differences_company_po (company_id, po_id),
    KEY idx_three_way_match_differences_type_severity (difference_type, severity),
    CONSTRAINT fk_three_way_match_differences_match_id
        FOREIGN KEY (match_id) REFERENCES three_way_match_results (match_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_three_way_match_differences_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id),
    CONSTRAINT fk_three_way_match_differences_po_line_id
        FOREIGN KEY (po_line_id) REFERENCES purchase_order_lines (line_id)
);

CREATE TABLE three_way_match_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    action_id VARCHAR(96) NOT NULL,
    match_id VARCHAR(80) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    note VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_three_way_match_actions_action_id (action_id),
    KEY idx_three_way_match_actions_match_created (match_id, created_at),
    KEY idx_three_way_match_actions_company_created (company_id, created_at),
    KEY idx_three_way_match_actions_actor_id (actor_id),
    CONSTRAINT fk_three_way_match_actions_match_id
        FOREIGN KEY (match_id) REFERENCES three_way_match_results (match_id)
        ON DELETE CASCADE
);
