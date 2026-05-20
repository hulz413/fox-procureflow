INSERT IGNORE INTO demo_suppliers (supplier_id, supplier_name, service_scope, location, status, risk_level, shared_scope)
VALUES
    ('supplier-qiming-cloud', '北京启明云服科技有限公司', '云服务 / SaaS 集成 / IT 运维', '北京', 'active', 'low', 'group-shared'),
    ('supplier-nanyi-auto', '广州南仪自动化设备有限公司', '工控设备 / 传感器 / 自动化备件', '广州', 'active', 'medium', 'group-shared'),
    ('supplier-jincheng-logistics', '成都锦程物流供应链有限公司', '干线运输 / 仓储配送 / 西南区域配送', '成都', 'active', 'medium', 'group-shared'),
    ('supplier-huace-office', '武汉华策办公集采有限公司', '办公耗材 / 行政物资 / 员工福利物料', '武汉', 'active', 'low', 'group-shared'),
    ('supplier-hailian-materials', '青岛海联工业材料有限公司', '生产辅料 / 包装耗材 / 现场低值易耗品', '青岛', 'active', 'medium', 'group-shared'),
    ('supplier-zhiwei-software', '厦门智维软件服务有限公司', '协同软件 / 软件许可 / 技术支持', '厦门', 'active', 'low', 'group-shared'),
    ('supplier-borui-spares', '天津博锐精密配件有限公司', '精密备件 / 维修件 / 设备保养服务', '天津', 'active', 'high', 'group-shared'),
    ('supplier-shuzhan-it', '南京数栈信息系统有限公司', '网络设备 / 信息安全服务 / 系统集成', '南京', 'active', 'medium', 'group-shared'),
    ('supplier-lianyunda-logistics', '佛山联运达物流有限公司', '城配运输 / 零担运输 / 华南仓配服务', '佛山', 'active', 'low', 'group-shared'),
    ('supplier-xingqiao-electronics', '西安星桥电子贸易有限公司', '外设配件 / 会议室设备 / 办公电子耗材', '西安', 'active', 'medium', 'group-shared');

INSERT IGNORE INTO demo_supplier_categories (supplier_id, category_id)
VALUES
    ('supplier-qiming-cloud', 'category-software-subscription'),
    ('supplier-qiming-cloud', 'category-it-hardware'),
    ('supplier-nanyi-auto', 'category-equipment-spares'),
    ('supplier-nanyi-auto', 'category-production-consumables'),
    ('supplier-jincheng-logistics', 'category-logistics-service'),
    ('supplier-huace-office', 'category-office-supplies'),
    ('supplier-hailian-materials', 'category-production-consumables'),
    ('supplier-hailian-materials', 'category-office-supplies'),
    ('supplier-zhiwei-software', 'category-software-subscription'),
    ('supplier-borui-spares', 'category-equipment-spares'),
    ('supplier-borui-spares', 'category-production-consumables'),
    ('supplier-shuzhan-it', 'category-it-hardware'),
    ('supplier-shuzhan-it', 'category-software-subscription'),
    ('supplier-lianyunda-logistics', 'category-logistics-service'),
    ('supplier-xingqiao-electronics', 'category-it-hardware'),
    ('supplier-xingqiao-electronics', 'category-office-supplies');
