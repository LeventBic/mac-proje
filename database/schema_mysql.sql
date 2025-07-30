-- inFlow Stok ve Üretim Yönetimi - MySQL Database Schema
-- Bu dosya MySQL veritabanı şemasını oluşturur

-- Veritabanı oluştur
CREATE DATABASE IF NOT EXISTS inflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inflow_db;

-- UUID fonksiyonu için extension (MySQL 8.0+)
-- MySQL'de UUID() fonksiyonu built-in olarak gelir

-- =======================
-- KULLANICI YÖNETİMİ
-- =======================

-- Kullanıcılar tablosu
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_uuid (uuid)
);

-- =======================
-- TEDARİKÇİ YÖNETİMİ
-- =======================

-- Tedarikçiler tablosu
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    tax_number VARCHAR(50),
    payment_terms INT DEFAULT 30, -- Ödeme vadesi gün
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 arası rating
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_suppliers_code (supplier_code),
    INDEX idx_suppliers_name (name),
    INDEX idx_suppliers_uuid (uuid)
);

-- =======================
-- ÜRÜN YÖNETİMİ
-- =======================

-- Ürün kategorileri
CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_product_categories_parent (parent_id),
    INDEX idx_product_categories_uuid (uuid)
);

-- Ürün tipleri
CREATE TABLE product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_product_types_name (name),
    INDEX idx_product_types_uuid (uuid)
);

-- Ürünler tablosu
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    category_id INT,
    product_type_id INT,
    supplier_id INT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs', -- pcs, kg, lt, m, etc.
    location VARCHAR(100),
    min_stock_level INT DEFAULT 0,
    max_stock_level INT,
    reorder_point INT DEFAULT 0,
    reorder_quantity INT DEFAULT 0,
    lead_time_days INT DEFAULT 0,
    expiry_date DATE NULL,
    batch_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_raw_material BOOLEAN DEFAULT FALSE,
    is_finished_product BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_products_sku (sku),
    INDEX idx_products_barcode (barcode),
    INDEX idx_products_category (category_id),
    INDEX idx_products_product_type (product_type_id),
    INDEX idx_products_supplier (supplier_id),
    INDEX idx_products_type (is_raw_material, is_finished_product),
    INDEX idx_products_uuid (uuid)
);

-- =======================
-- STOK YÖNETİMİ
-- =======================

-- Envanter tablosu
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    product_id INT NOT NULL,
    location VARCHAR(100) DEFAULT 'MAIN',
    available_quantity DECIMAL(10,3) DEFAULT 0,
    reserved_quantity DECIMAL(10,3) DEFAULT 0,
    total_quantity DECIMAL(10,3) GENERATED ALWAYS AS (available_quantity + reserved_quantity) STORED,
    last_count_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_location (product_id, location),
    INDEX idx_inventory_product (product_id),
    INDEX idx_inventory_location (location),
    INDEX idx_inventory_uuid (uuid)
);

-- Stok hareketleri
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    product_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment', 'transfer', 'production_in', 'production_out') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type ENUM('purchase', 'sale', 'production', 'adjustment', 'transfer') NULL,
    reference_id INT NULL,
    location_from VARCHAR(100),
    location_to VARCHAR(100),
    supplier_id INT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE NULL,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stock_movements_product (product_id),
    INDEX idx_stock_movements_type (movement_type),
    INDEX idx_stock_movements_supplier (supplier_id),
    INDEX idx_stock_movements_reference (reference_type, reference_id),
    INDEX idx_stock_movements_date (created_at),
    INDEX idx_stock_movements_uuid (uuid)
);

-- Stok sayımları
CREATE TABLE stock_counts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    count_number VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(100) DEFAULT 'MAIN',
    status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    scheduled_date DATE NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    total_items INT DEFAULT 0,
    counted_items INT DEFAULT 0,
    discrepancies_found INT DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stock_counts_status (status),
    INDEX idx_stock_counts_date (scheduled_date),
    INDEX idx_stock_counts_uuid (uuid)
);

-- Stok sayım detayları
CREATE TABLE stock_count_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    stock_count_id INT NOT NULL,
    product_id INT NOT NULL,
    expected_quantity DECIMAL(10,3) DEFAULT 0,
    counted_quantity DECIMAL(10,3) DEFAULT 0,
    variance_quantity DECIMAL(10,3) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
    notes TEXT,
    counted_by INT NULL,
    counted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (counted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_count_product (stock_count_id, product_id),
    INDEX idx_stock_count_items_count (stock_count_id),
    INDEX idx_stock_count_items_product (product_id),
    INDEX idx_stock_count_items_uuid (uuid)
);

-- =======================
-- ÜRETİM YÖNETİMİ
-- =======================

-- BOM (Bill of Materials) - Malzeme Listeleri - Product Tree Yapısı
CREATE TABLE bom (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    finished_product_id INT NOT NULL,
    parent_bom_id INT NULL, -- Hiyerarşik yapı için üst reçete referansı
    version VARCHAR(10) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    base_cost DECIMAL(12,4) DEFAULT 0, -- Malzeme maliyeti toplamı
    profit_margin DECIMAL(5,2) DEFAULT 0, -- Kar marjı yüzdesi
    final_cost DECIMAL(12,4) GENERATED ALWAYS AS (base_cost * (1 + profit_margin / 100)) STORED, -- Kar marjı dahil nihai maliyet
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (finished_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_bom_id) REFERENCES bom(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_product_version (finished_product_id, version),
    INDEX idx_bom_product (finished_product_id),
    INDEX idx_bom_parent (parent_bom_id),
    INDEX idx_bom_uuid (uuid)
);

-- BOM Kalemleri - Malzeme ve Alt Reçete Desteği
CREATE TABLE bom_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    bom_id INT NOT NULL,
    item_type ENUM('material', 'sub_bom') NOT NULL DEFAULT 'material', -- Malzeme mi alt reçete mi
    raw_material_id INT NULL, -- Malzeme referansı
    sub_bom_id INT NULL, -- Alt reçete referansı
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_cost DECIMAL(12,4) DEFAULT 0, -- Birim maliyet
    total_cost DECIMAL(12,4) GENERATED ALWAYS AS (quantity * unit_cost) STORED, -- Toplam maliyet
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bom_id) REFERENCES bom(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (sub_bom_id) REFERENCES bom(id) ON DELETE CASCADE,
    INDEX idx_bom_items_bom (bom_id),
    INDEX idx_bom_items_material (raw_material_id),
    INDEX idx_bom_items_sub_bom (sub_bom_id),
    INDEX idx_bom_items_type (item_type),
    INDEX idx_bom_items_uuid (uuid),
    
    -- Constraint: Malzeme veya alt reçete seçilmeli, ikisi birden değil
    CONSTRAINT chk_bom_item_type CHECK (
        (item_type = 'material' AND raw_material_id IS NOT NULL AND sub_bom_id IS NULL) OR
        (item_type = 'sub_bom' AND sub_bom_id IS NOT NULL AND raw_material_id IS NULL)
    )
);

-- BOM Maliyet Hesaplama Fonksiyonu için Trigger
DELIMITER //
CREATE TRIGGER update_bom_cost_after_item_change
AFTER INSERT ON bom_items
FOR EACH ROW
BEGIN
    UPDATE bom 
    SET base_cost = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN bi.item_type = 'material' THEN bi.total_cost
                WHEN bi.item_type = 'sub_bom' THEN bi.quantity * (SELECT b.final_cost FROM bom b WHERE b.id = bi.sub_bom_id)
                ELSE 0
            END
        ), 0)
        FROM bom_items bi 
        WHERE bi.bom_id = NEW.bom_id
    )
    WHERE id = NEW.bom_id;
END//

CREATE TRIGGER update_bom_cost_after_item_update
AFTER UPDATE ON bom_items
FOR EACH ROW
BEGIN
    UPDATE bom 
    SET base_cost = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN bi.item_type = 'material' THEN bi.total_cost
                WHEN bi.item_type = 'sub_bom' THEN bi.quantity * (SELECT b.final_cost FROM bom b WHERE b.id = bi.sub_bom_id)
                ELSE 0
            END
        ), 0)
        FROM bom_items bi 
        WHERE bi.bom_id = NEW.bom_id
    )
    WHERE id = NEW.bom_id;
END//

CREATE TRIGGER update_bom_cost_after_item_delete
AFTER DELETE ON bom_items
FOR EACH ROW
BEGIN
    UPDATE bom 
    SET base_cost = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN bi.item_type = 'material' THEN bi.total_cost
                WHEN bi.item_type = 'sub_bom' THEN bi.quantity * (SELECT b.final_cost FROM bom b WHERE b.id = bi.sub_bom_id)
                ELSE 0
            END
        ), 0)
        FROM bom_items bi 
        WHERE bi.bom_id = OLD.bom_id
    )
    WHERE id = OLD.bom_id;
END//
DELIMITER ;

-- Üretim Emirleri
CREATE TABLE production_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    bom_id INT NOT NULL,
    planned_quantity DECIMAL(10,3) NOT NULL,
    produced_quantity DECIMAL(10,3) DEFAULT 0,
    status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    planned_start_date TIMESTAMP NULL,
    planned_end_date TIMESTAMP NULL,
    actual_start_date TIMESTAMP NULL,
    actual_end_date TIMESTAMP NULL,
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bom_id) REFERENCES bom(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_production_orders_status (status),
    INDEX idx_production_orders_priority (priority),
    INDEX idx_production_orders_dates (planned_start_date, planned_end_date),
    INDEX idx_production_orders_bom (bom_id),
    INDEX idx_production_orders_uuid (uuid)
);

-- Üretim Hareketleri
CREATE TABLE production_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    production_order_id INT NOT NULL,
    product_id INT NOT NULL,
    movement_type ENUM('material_consumed', 'product_produced', 'waste_recorded') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    location VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_production_movements_order (production_order_id),
    INDEX idx_production_movements_product (product_id),
    INDEX idx_production_movements_type (movement_type),
    INDEX idx_production_movements_uuid (uuid)
);

-- =======================
-- UYARI SİSTEMİ
-- =======================

-- Uyarılar
CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    type ENUM('low_stock', 'production_delay', 'system', 'quality') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    related_entity_type ENUM('product', 'production_order', 'user', 'system') NULL,
    related_entity_id INT NULL,
    assigned_to INT NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_alerts_type (type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_status (is_read, is_resolved),
    INDEX idx_alerts_entity (related_entity_type, related_entity_id),
    INDEX idx_alerts_assigned (assigned_to),
    INDEX idx_alerts_uuid (uuid)
);

-- =======================
-- MÜŞTERİ YÖNETİMİ (CRM)
-- =======================

-- Müşteriler tablosu
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    tax_number VARCHAR(50),
    tax_office VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INT DEFAULT 30, -- Ödeme vadesi gün
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 arası rating
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customers_code (customer_code),
    INDEX idx_customers_name (name),
    INDEX idx_customers_email (email),
    INDEX idx_customers_uuid (uuid)
);

-- Satış Siparişleri
CREATE TABLE sales_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status ENUM('draft', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_with_tax DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_terms INT DEFAULT 30,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sales_orders_customer (customer_id),
    INDEX idx_sales_orders_status (status),
    INDEX idx_sales_orders_date (order_date),
    INDEX idx_sales_orders_uuid (uuid)
);

-- Satış Sipariş Kalemleri
CREATE TABLE sales_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    sales_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_sales_order_items_order (sales_order_id),
    INDEX idx_sales_order_items_product (product_id),
    INDEX idx_sales_order_items_uuid (uuid)
);

-- Projeler tablosu
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    customer_id INT,
    project_manager_id INT,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_projects_customer (customer_id),
    INDEX idx_projects_manager (project_manager_id),
    INDEX idx_projects_status (status),
    INDEX idx_projects_dates (start_date, planned_end_date),
    INDEX idx_projects_uuid (uuid)
);

-- Proje Görevleri
CREATE TABLE project_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    project_id INT NOT NULL,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to INT,
    status ENUM('not_started', 'in_progress', 'completed', 'blocked') DEFAULT 'not_started',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    dependencies TEXT, -- JSON array of dependent task IDs
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_project_tasks_project (project_id),
    INDEX idx_project_tasks_assigned (assigned_to),
    INDEX idx_project_tasks_status (status),
    INDEX idx_project_tasks_dates (start_date, due_date),
    INDEX idx_project_tasks_uuid (uuid)
);

-- Proje Maliyetleri
CREATE TABLE project_costs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    project_id INT NOT NULL,
    cost_type ENUM('material', 'labor', 'equipment', 'overhead', 'other') NOT NULL,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    cost_date DATE NOT NULL,
    supplier_id INT,
    invoice_number VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_project_costs_project (project_id),
    INDEX idx_project_costs_type (cost_type),
    INDEX idx_project_costs_date (cost_date),
    INDEX idx_project_costs_uuid (uuid)
);

-- =======================
-- RAPORLAMA VE ANALİTİK
-- =======================

-- Dashboard için özet view'ları
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND is_raw_material = TRUE) as raw_materials_count,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND is_finished_product = TRUE) as finished_products_count,
    (SELECT COUNT(*) FROM production_orders WHERE status IN ('planned', 'in_progress')) as active_orders,
    (SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE) as unresolved_alerts,
    (SELECT SUM(i.available_quantity * p.unit_price) 
     FROM inventory i 
     JOIN products p ON i.product_id = p.id 
     WHERE p.is_active = TRUE) as total_inventory_value;

-- Düşük stok uyarıları view
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.uuid,
    p.sku,
    p.name,
    p.min_stock_level,
    i.available_quantity,
    pc.name as category_name,
    s.name as supplier_name,
    (p.min_stock_level - i.available_quantity) as shortage_quantity
FROM products p
JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE 
  AND i.available_quantity <= p.min_stock_level
  AND p.min_stock_level > 0;

-- Mevcut stok durumu view
CREATE VIEW current_stock_view AS
SELECT 
    p.id,
    p.uuid,
    p.sku,
    p.name,
    p.barcode,
    p.unit,
    p.location,
    p.min_stock_level,
    p.max_stock_level,
    p.reorder_point,
    p.reorder_quantity,
    p.unit_price,
    p.cost_price,
    p.expiry_date,
    p.batch_number,
    i.available_quantity,
    i.reserved_quantity,
    i.total_quantity,
    i.last_count_date,
    pc.name as category_name,
    s.name as supplier_name,
    s.supplier_code,
    s.contact_person as supplier_contact,
    s.phone as supplier_phone,
    (i.available_quantity * p.unit_price) as stock_value,
    CASE 
        WHEN i.available_quantity <= 0 THEN 'out_of_stock'
        WHEN i.available_quantity <= p.min_stock_level THEN 'low_stock'
        WHEN i.available_quantity >= p.max_stock_level THEN 'overstock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE;

-- Üretim durumu özeti
CREATE VIEW production_summary AS
SELECT 
    po.id,
    po.uuid,
    po.order_number,
    p.name as product_name,
    po.planned_quantity,
    po.produced_quantity,
    po.status,
    po.priority,
    po.planned_start_date,
    po.planned_end_date,
    CASE 
        WHEN po.planned_quantity > 0 THEN 
            ROUND((po.produced_quantity / po.planned_quantity) * 100, 2)
        ELSE 0 
    END as completion_percentage
FROM production_orders po
JOIN bom b ON po.bom_id = b.id
JOIN products p ON b.finished_product_id = p.id
WHERE po.status IN ('planned', 'in_progress', 'completed');

-- =======================
-- TRİGGER'LAR
-- =======================

-- Stok hareketi sonrası envanter güncelleme
DELIMITER //
CREATE TRIGGER update_inventory_after_stock_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
BEGIN
    DECLARE current_available DECIMAL(10,3) DEFAULT 0;
    
    -- Mevcut stok miktarını al
    SELECT COALESCE(available_quantity, 0) INTO current_available
    FROM inventory 
    WHERE product_id = NEW.product_id 
      AND location = COALESCE(NEW.location_to, NEW.location_from, 'MAIN');
    
    -- Stok hareketine göre güncelle
    IF NEW.movement_type IN ('in', 'production_in', 'adjustment') THEN
        SET current_available = current_available + NEW.quantity;
    ELSEIF NEW.movement_type IN ('out', 'production_out') THEN
        SET current_available = current_available - NEW.quantity;
    END IF;
    
    -- Envanter tablosunu güncelle veya oluştur
    INSERT INTO inventory (product_id, location, available_quantity)
    VALUES (NEW.product_id, COALESCE(NEW.location_to, NEW.location_from, 'MAIN'), current_available)
    ON DUPLICATE KEY UPDATE 
        available_quantity = current_available,
        updated_at = CURRENT_TIMESTAMP;
END//

-- Düşük stok kontrolü
CREATE TRIGGER check_low_stock
    AFTER UPDATE ON inventory
    FOR EACH ROW
BEGIN
    DECLARE min_level INT DEFAULT 0;
    DECLARE product_name VARCHAR(100);
    
    -- Ürünün minimum stok seviyesini al
    SELECT min_stock_level, name INTO min_level, product_name
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Eğer stok minimum seviyenin altına düştüyse uyarı oluştur
    IF NEW.available_quantity <= min_level AND min_level > 0 THEN
        INSERT INTO alerts (type, title, message, severity, related_entity_type, related_entity_id)
        VALUES (
            'low_stock',
            'Düşük Stok Uyarısı',
            CONCAT('Ürün: ', product_name, ' stok seviyesi minimum seviyenin altına düştü. Mevcut: ', NEW.available_quantity, ', Minimum: ', min_level),
            'warning',
            'product',
            NEW.product_id
        );
    END IF;
END//

-- Üretim emri tamamlandığında stok güncelleme
CREATE TRIGGER update_production_completion
    AFTER UPDATE ON production_orders
    FOR EACH ROW
BEGIN
    DECLARE finished_product_id INT;
    
    -- Eğer durum 'completed' olarak değiştiyse
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Bitmiş ürünün ID'sini al
        SELECT b.finished_product_id INTO finished_product_id
        FROM bom b
        WHERE b.id = NEW.bom_id;
        
        -- Stok hareketini kaydet
        INSERT INTO stock_movements (
            product_id, 
            movement_type, 
            quantity, 
            reference_type, 
            reference_id, 
            location_to, 
            notes, 
            created_by
        )
        VALUES (
            finished_product_id,
            'production_in',
            NEW.produced_quantity,
            'production',
            NEW.id,
            'MAIN',
            CONCAT('Üretim emri tamamlandı: ', NEW.order_number),
            NEW.created_by
        );
    END IF;
END//

DELIMITER ;

-- =======================
-- İNDEKSLER VE OPTİMİZASYON
-- =======================

-- Performans için ek indeksler
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX idx_production_orders_status_priority ON production_orders(status, priority);
CREATE INDEX idx_alerts_created_unresolved ON alerts(created_at, is_resolved);

-- =======================
-- İNİTİAL DATA
-- =======================

-- Varsayılan kategori
INSERT INTO product_categories (name, description) VALUES 
('Genel', 'Genel kategori'),
('Hammadde', 'Ham maddeler'),
('Yarı Mamul', 'Yarı mamul ürünler'),
('Mamul', 'Bitmiş ürünler');

-- Varsayılan tedarikçiler
INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, city, country) VALUES
('SUP001', 'ABC Tedarik A.Ş.', 'Ahmet Yılmaz', 'ahmet@abctedarik.com', '+90 212 555 0001', 'İstanbul', 'Türkiye'),
('SUP002', 'XYZ Malzeme Ltd.', 'Fatma Kaya', 'fatma@xyzmalzeme.com', '+90 312 555 0002', 'Ankara', 'Türkiye'),
('SUP003', 'Global Supplies Inc.', 'John Smith', 'john@globalsupplies.com', '+1 555 0003', 'New York', 'USA');

-- Varsayılan admin kullanıcısı (şifre: password123)
INSERT INTO users (uuid, username, email, password_hash, first_name, last_name, role) VALUES 
(UUID(), 'admin', 'admin@inflow.com', '$2b$10$rOzJAXJEWCkGj5K5Qx5r2.F8QJ5J5J5J5J5J5J5J5J5J5J5J5J5J5O', 'Admin', 'User', 'admin'),
(UUID(), 'operator1', 'operator@inflow.com', '$2b$10$rOzJAXJEWCkGj5K5Qx5r2.F8QJ5J5J5J5J5J5J5J5J5J5J5J5J5J5O', 'Operator', 'User', 'operator'),
(UUID(), 'viewer1', 'viewer@inflow.com', '$2b$10$rOzJAXJEWCkGj5K5Qx5r2.F8QJ5J5J5J5J5J5J5J5J5J5J5J5J5J5O', 'Viewer', 'User', 'viewer');

-- Örnek ürünler
INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, cost_price, unit, location, min_stock_level, max_stock_level, reorder_point, reorder_quantity, is_raw_material) VALUES
('RAW001', 'Çelik Levha 2mm', '2mm kalınlığında çelik levha', 2, 1, 150.00, 120.00, 'kg', 'A-01', 100, 1000, 150, 500, TRUE),
('RAW002', 'Plastik Granül ABS', 'ABS plastik granül ham madde', 2, 2, 25.50, 20.00, 'kg', 'B-02', 200, 2000, 300, 1000, TRUE),
('FIN001', 'Hidrolik Silindir HS-100', 'Hidrolik silindir 100mm', 4, NULL, 850.00, 650.00, 'pcs', 'C-01', 10, 100, 15, 50, FALSE);

-- Schema oluşturma tamamlandı
SELECT 'MySQL Database Schema with Suppliers created successfully!' as status;