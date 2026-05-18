CREATE TABLE demo_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(64) NOT NULL,
    group_name VARCHAR(128) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_demo_groups_group_id (group_id)
);

CREATE TABLE demo_companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    business_scope VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_demo_companies_company_id (company_id),
    KEY idx_demo_companies_group_id (group_id)
);

CREATE TABLE demo_departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL,
    department_name VARCHAR(128) NOT NULL,
    function_scope VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_demo_departments_department_id (department_id),
    KEY idx_demo_departments_company_id (company_id)
);

CREATE TABLE demo_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(160) NOT NULL,
    position_title VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uk_demo_users_user_id (user_id),
    UNIQUE KEY uk_demo_users_email (email),
    KEY idx_demo_users_company_id (company_id),
    KEY idx_demo_users_department_id (department_id)
);

CREATE TABLE demo_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id VARCHAR(64) NOT NULL,
    role_name VARCHAR(128) NOT NULL,
    role_type VARCHAR(64) NOT NULL,
    description VARCHAR(255) NOT NULL,
    UNIQUE KEY uk_demo_roles_role_id (role_id)
);

CREATE TABLE demo_user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_demo_user_roles_user_role (user_id, role_id),
    KEY idx_demo_user_roles_role_id (role_id)
);

CREATE TABLE demo_suppliers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supplier_id VARCHAR(64) NOT NULL,
    supplier_name VARCHAR(160) NOT NULL,
    service_scope VARCHAR(255) NOT NULL,
    location VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    shared_scope VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_demo_suppliers_supplier_id (supplier_id)
);

CREATE TABLE demo_procurement_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id VARCHAR(64) NOT NULL,
    category_name VARCHAR(128) NOT NULL,
    business_scope VARCHAR(255) NOT NULL,
    group_level BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_demo_procurement_categories_category_id (category_id)
);

CREATE TABLE demo_supplier_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supplier_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_demo_supplier_categories_supplier_category (supplier_id, category_id),
    KEY idx_demo_supplier_categories_category_id (category_id)
);

CREATE TABLE demo_budget_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(64) NOT NULL,
    budget_account_id VARCHAR(64) NOT NULL,
    account_name VARCHAR(128) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    annual_budget_amount DECIMAL(14, 2) NOT NULL,
    available_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_demo_budget_accounts_budget_account_id (budget_account_id),
    KEY idx_demo_budget_accounts_company_id (company_id),
    KEY idx_demo_budget_accounts_category_id (category_id)
);

INSERT INTO demo_groups (group_id, group_name, description)
VALUES
    ('group-xinghe', '星河控股集团', 'MVP 演示用集团主体');

INSERT INTO demo_companies (group_id, company_id, company_name, business_scope, active)
VALUES
    ('group-xinghe', 'company-digital', '星河数字科技有限公司', 'IT 设备、软件订阅、办公采购', TRUE),
    ('group-xinghe', 'company-manufacturing', '星河智能制造有限公司', '生产耗材、设备备件、物流服务', FALSE);

INSERT INTO demo_departments (company_id, department_id, department_name, function_scope, sort_order)
VALUES
    ('company-digital', 'dept-digital-admin', '综合管理部', '办公采购、演示运营和行政支持', 10),
    ('company-digital', 'dept-digital-it', '信息技术部', 'IT 设备、软件订阅和技术服务申请', 20),
    ('company-digital', 'dept-digital-finance', '财务部', '预算复核、发票和付款协同', 30),
    ('company-digital', 'dept-digital-procurement', '采购部', '询报价、供应商协同和采购订单', 40),
    ('company-manufacturing', 'dept-mfg-production', '生产运营部', '生产耗材、设备备件和维修服务申请', 10),
    ('company-manufacturing', 'dept-mfg-warehouse', '仓储物流部', '收货、库存协同和物流服务', 20),
    ('company-manufacturing', 'dept-mfg-finance', '财务部', '预算复核、发票和三单匹配协同', 30),
    ('company-manufacturing', 'dept-mfg-procurement', '采购部', '供应商询价、订单和交付跟踪', 40);

INSERT INTO demo_roles (role_id, role_name, role_type, description)
VALUES
    ('role-applicant', '申请人', 'business', '提交采购需求和补充业务说明'),
    ('role-approver', '审批人', 'business', '按公司、金额和品类审批采购申请'),
    ('role-procurement', '采购员', 'business', '执行询报价、比价和订单协同'),
    ('role-finance', '财务人员', 'business', '处理预算、发票和三单匹配异常'),
    ('role-warehouse', '仓储人员', 'business', '登记收货和物流相关信息'),
    ('role-admin', '系统管理员', 'platform', '维护基础配置和演示环境'),
    ('role-demo-operator', '演示人员', 'platform', '执行面试或产品演示流程');

INSERT INTO demo_users (company_id, department_id, user_id, display_name, email, position_title, active)
VALUES
    ('company-digital', 'dept-digital-it', 'user-digital-applicant', '林晓晨', 'lin.xiaochen@xinghe.com', 'IT 设备申请人', TRUE),
    ('company-digital', 'dept-digital-it', 'user-digital-approver', '周明远', 'zhou.mingyuan@xinghe.com', '信息技术部负责人', TRUE),
    ('company-digital', 'dept-digital-procurement', 'user-digital-buyer', '王然', 'wang.ran@xinghe.com', '采购经理', TRUE),
    ('company-digital', 'dept-digital-finance', 'user-digital-finance', '陈思雨', 'chen.siyu@xinghe.com', '财务审批专员', TRUE),
    ('company-digital', 'dept-digital-admin', 'user-digital-admin', '赵启航', 'zhao.qihang@xinghe.com', '系统管理员', TRUE),
    ('company-digital', 'dept-digital-admin', 'user-demo-operator', '许安宁', 'xu.anning@xinghe.com', '演示运营专员', TRUE),
    ('company-manufacturing', 'dept-mfg-production', 'user-mfg-applicant', '顾言', 'gu.yan@xinghe.com', '设备备件申请人', TRUE),
    ('company-manufacturing', 'dept-mfg-production', 'user-mfg-approver', '韩立峰', 'han.lifeng@xinghe.com', '生产负责人', TRUE),
    ('company-manufacturing', 'dept-mfg-procurement', 'user-mfg-buyer', '沈嘉禾', 'shen.jiahe@xinghe.com', '制造采购员', TRUE),
    ('company-manufacturing', 'dept-mfg-finance', 'user-mfg-finance', '唐若溪', 'tang.ruoxi@xinghe.com', '财务复核专员', TRUE),
    ('company-manufacturing', 'dept-mfg-warehouse', 'user-mfg-warehouse', '陆景行', 'lu.jingxing@xinghe.com', '仓储收货专员', TRUE);

INSERT INTO demo_user_roles (user_id, role_id)
VALUES
    ('user-digital-applicant', 'role-applicant'),
    ('user-digital-approver', 'role-approver'),
    ('user-digital-buyer', 'role-procurement'),
    ('user-digital-finance', 'role-finance'),
    ('user-digital-admin', 'role-admin'),
    ('user-demo-operator', 'role-demo-operator'),
    ('user-mfg-applicant', 'role-applicant'),
    ('user-mfg-approver', 'role-approver'),
    ('user-mfg-buyer', 'role-procurement'),
    ('user-mfg-finance', 'role-finance'),
    ('user-mfg-warehouse', 'role-warehouse');

INSERT INTO demo_procurement_categories (category_id, category_name, business_scope, group_level, sort_order)
VALUES
    ('category-it-hardware', 'IT 设备', '笔记本、显示器、配件等办公 IT 硬件', TRUE, 10),
    ('category-software-subscription', '软件订阅', 'SaaS 订阅、软件许可和 IT 服务', TRUE, 20),
    ('category-office-supplies', '办公用品', '日常办公耗材和行政用品', TRUE, 30),
    ('category-production-consumables', '生产耗材', '制造现场生产耗材和辅料', TRUE, 40),
    ('category-equipment-spares', '设备备件', '设备备件、维修件和维保服务', TRUE, 50),
    ('category-logistics-service', '物流服务', '运输、仓储和配送服务', TRUE, 60);

INSERT INTO demo_suppliers (supplier_id, supplier_name, service_scope, location, status, risk_level, shared_scope)
VALUES
    ('supplier-yunzhou', '上海云舟信息技术有限公司', '软件订阅 / IT 服务', '上海', 'active', 'low', 'group-shared'),
    ('supplier-bluechip', '深圳蓝芯电子科技有限公司', '笔记本 / 显示器 / 配件', '深圳', 'active', 'medium', 'group-shared'),
    ('supplier-hengrun', '苏州恒润工业设备有限公司', '设备备件 / 维修服务', '苏州', 'active', 'medium', 'group-shared'),
    ('supplier-chengcai', '杭州诚采办公用品有限公司', '办公用品', '杭州', 'active', 'low', 'group-shared'),
    ('supplier-anjie', '宁波安捷物流有限公司', '物流服务', '宁波', 'active', 'low', 'group-shared');

INSERT INTO demo_supplier_categories (supplier_id, category_id)
VALUES
    ('supplier-yunzhou', 'category-software-subscription'),
    ('supplier-yunzhou', 'category-it-hardware'),
    ('supplier-bluechip', 'category-it-hardware'),
    ('supplier-hengrun', 'category-equipment-spares'),
    ('supplier-hengrun', 'category-production-consumables'),
    ('supplier-chengcai', 'category-office-supplies'),
    ('supplier-anjie', 'category-logistics-service');

INSERT INTO demo_budget_accounts (
    company_id,
    budget_account_id,
    account_name,
    category_id,
    annual_budget_amount,
    available_amount,
    currency,
    active,
    sort_order
)
VALUES
    ('company-digital', 'budget-digital-it-equipment', '数字科技 IT 设备预算', 'category-it-hardware', 1200000.00, 840000.00, 'CNY', TRUE, 10),
    ('company-digital', 'budget-digital-software', '数字科技 软件订阅预算', 'category-software-subscription', 900000.00, 610000.00, 'CNY', TRUE, 20),
    ('company-digital', 'budget-digital-office', '数字科技 办公采购预算', 'category-office-supplies', 260000.00, 185000.00, 'CNY', TRUE, 30),
    ('company-manufacturing', 'budget-mfg-consumables', '智能制造 生产耗材预算', 'category-production-consumables', 1500000.00, 980000.00, 'CNY', TRUE, 10),
    ('company-manufacturing', 'budget-mfg-spares', '智能制造 设备备件预算', 'category-equipment-spares', 1800000.00, 1260000.00, 'CNY', TRUE, 20),
    ('company-manufacturing', 'budget-mfg-logistics', '智能制造 物流服务预算', 'category-logistics-service', 720000.00, 430000.00, 'CNY', TRUE, 30);
