UPDATE demo_suppliers
SET status = 'inactive'
WHERE supplier_id IN (
    'supplier-borui-spares',
    'supplier-lianyunda-logistics',
    'supplier-xingqiao-electronics'
);
