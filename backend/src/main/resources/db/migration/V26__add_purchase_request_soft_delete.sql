ALTER TABLE purchase_requests
    ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at,
    ADD COLUMN deleted_by VARCHAR(64) NULL AFTER deleted_at,
    ADD COLUMN delete_reason VARCHAR(255) NULL AFTER deleted_by,
    ADD KEY idx_purchase_requests_deleted_at (deleted_at),
    ADD KEY idx_purchase_requests_company_deleted_created (company_id, deleted_at, created_at);
