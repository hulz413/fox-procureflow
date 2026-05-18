DELETE FROM approval_records
WHERE approval_id IN (
    SELECT approval_id
    FROM approval_instances
    WHERE request_id = 'PR-20260518-0001'
);

DELETE FROM approval_nodes
WHERE approval_id IN (
    SELECT approval_id
    FROM approval_instances
    WHERE request_id = 'PR-20260518-0001'
);

DELETE FROM approval_instances
WHERE request_id = 'PR-20260518-0001';

DELETE FROM purchase_request_lines
WHERE request_id = 'PR-20260518-0001';

DELETE FROM purchase_requests
WHERE request_id = 'PR-20260518-0001';
