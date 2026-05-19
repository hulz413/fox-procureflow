CREATE TABLE purchase_receipts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    receipt_id VARCHAR(80) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    received_by VARCHAR(64) NOT NULL,
    received_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL,
    note VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_receipts_receipt_id (receipt_id),
    KEY idx_purchase_receipts_company_created (company_id, created_at),
    KEY idx_purchase_receipts_po_created (po_id, created_at),
    KEY idx_purchase_receipts_supplier_id (supplier_id),
    CONSTRAINT fk_purchase_receipts_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
);

CREATE TABLE purchase_receipt_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    receipt_line_id VARCHAR(96) NOT NULL,
    receipt_id VARCHAR(80) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    po_line_id VARCHAR(80) NOT NULL,
    line_no INT NOT NULL,
    item_name VARCHAR(160) NOT NULL,
    specification VARCHAR(255) NULL,
    received_quantity DECIMAL(14, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_receipt_lines_line_id (receipt_line_id),
    UNIQUE KEY uk_purchase_receipt_lines_receipt_po_line (receipt_id, po_line_id),
    KEY idx_purchase_receipt_lines_receipt_id (receipt_id),
    KEY idx_purchase_receipt_lines_po_id (po_id),
    KEY idx_purchase_receipt_lines_po_line_id (po_line_id),
    CONSTRAINT fk_purchase_receipt_lines_receipt_id
        FOREIGN KEY (receipt_id) REFERENCES purchase_receipts (receipt_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_purchase_receipt_lines_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id),
    CONSTRAINT fk_purchase_receipt_lines_po_line_id
        FOREIGN KEY (po_line_id) REFERENCES purchase_order_lines (line_id)
);

CREATE TABLE purchase_receipt_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id VARCHAR(96) NOT NULL,
    receipt_id VARCHAR(80) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_object_key VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purchase_receipt_attachments_attachment_id (attachment_id),
    KEY idx_purchase_receipt_attachments_receipt_id (receipt_id),
    CONSTRAINT fk_purchase_receipt_attachments_receipt_id
        FOREIGN KEY (receipt_id) REFERENCES purchase_receipts (receipt_id)
        ON DELETE CASCADE
);

CREATE TABLE supplier_invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(80) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    invoice_number VARCHAR(96) NOT NULL,
    invoice_date DATE NOT NULL,
    registered_by VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    untaxed_amount DECIMAL(14, 2) NOT NULL,
    tax_amount DECIMAL(14, 2) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    note VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_supplier_invoices_invoice_id (invoice_id),
    UNIQUE KEY uk_supplier_invoices_company_supplier_number (company_id, supplier_id, invoice_number),
    KEY idx_supplier_invoices_company_created (company_id, created_at),
    KEY idx_supplier_invoices_po_created (po_id, created_at),
    KEY idx_supplier_invoices_supplier_id (supplier_id),
    CONSTRAINT fk_supplier_invoices_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id)
);

CREATE TABLE supplier_invoice_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_line_id VARCHAR(96) NOT NULL,
    invoice_id VARCHAR(80) NOT NULL,
    po_id VARCHAR(64) NOT NULL,
    po_line_id VARCHAR(80) NOT NULL,
    line_no INT NOT NULL,
    item_name VARCHAR(160) NOT NULL,
    specification VARCHAR(255) NULL,
    invoiced_quantity DECIMAL(14, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    untaxed_amount DECIMAL(14, 2) NOT NULL,
    tax_rate DECIMAL(6, 4) NOT NULL,
    tax_amount DECIMAL(14, 2) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_supplier_invoice_lines_line_id (invoice_line_id),
    UNIQUE KEY uk_supplier_invoice_lines_invoice_po_line (invoice_id, po_line_id),
    KEY idx_supplier_invoice_lines_invoice_id (invoice_id),
    KEY idx_supplier_invoice_lines_po_id (po_id),
    KEY idx_supplier_invoice_lines_po_line_id (po_line_id),
    CONSTRAINT fk_supplier_invoice_lines_invoice_id
        FOREIGN KEY (invoice_id) REFERENCES supplier_invoices (invoice_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_supplier_invoice_lines_po_id
        FOREIGN KEY (po_id) REFERENCES purchase_orders (po_id),
    CONSTRAINT fk_supplier_invoice_lines_po_line_id
        FOREIGN KEY (po_line_id) REFERENCES purchase_order_lines (line_id)
);

CREATE TABLE supplier_invoice_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id VARCHAR(96) NOT NULL,
    invoice_id VARCHAR(80) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_object_key VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_supplier_invoice_attachments_attachment_id (attachment_id),
    KEY idx_supplier_invoice_attachments_invoice_id (invoice_id),
    CONSTRAINT fk_supplier_invoice_attachments_invoice_id
        FOREIGN KEY (invoice_id) REFERENCES supplier_invoices (invoice_id)
        ON DELETE CASCADE
);
