-- inFlow Stok ve Üretim Yönetimi - PostgreSQL Database Schema
-- Bu dosya PostgreSQL veritabanı şemasını oluşturur

-- Veritabanı oluştur (gerekirse)
-- CREATE DATABASE inflow_db;
-- \c inflow_db;

-- UUID extension'ını aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- KULLANICI YÖNETİMİ
-- =======================

-- Kullanıcı rolleri için enum type
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');

-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcılar için indexler
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_uuid ON users(uuid);

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users tablosu için trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- TEDARİKÇİ YÖNETİMİ
-- =======================

-- Tedarikçiler tablosu
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    tax_number VARCHAR(50),
    payment_terms INTEGER DEFAULT 30, -- Ödeme vadesi gün
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 arası rating
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers için indexler
CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_uuid ON suppliers(uuid);

-- Suppliers tablosu için trigger
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ÜRÜN YÖNETİMİ
-- =======================

-- Ürün kategorileri
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product categories için indexler
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_product_categories_uuid ON product_categories(uuid);

-- Product categories tablosu için trigger
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürün tipleri
CREATE TABLE product_types (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product types için indexler
CREATE INDEX idx_product_types_name ON product_types(name);
CREATE INDEX idx_product_types_uuid ON product_types(uuid);

-- Product types tablosu için trigger
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürünler tablosu
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    product_type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs', -- pcs, kg, lt, m, etc.
    location VARCHAR(100),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    expiry_date DATE NULL,
    batch_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_raw_material BOOLEAN DEFAULT FALSE,
    is_finished_product BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products için indexler
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_product_type ON products(product_type_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_type ON products(is_raw_material, is_finished_product);
CREATE INDEX idx_products_uuid ON products(uuid);

-- Products tablosu için trigger
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- STOK YÖNETİMİ
-- =======================

-- Envanter tablosu
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location VARCHAR(100) DEFAULT 'MAIN',
    available_quantity DECIMAL(10,3) DEFAULT 0,
    reserved_quantity DECIMAL(10,3) DEFAULT 0,
    total_quantity DECIMAL(10,3) GENERATED ALWAYS AS (available_quantity + reserved_quantity) STORED,
    last_count_date TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, location)
);

-- Inventory için indexler
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_location ON inventory(location);
CREATE INDEX idx_inventory_uuid ON inventory(uuid);

-- Inventory tablosu için trigger
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stok hareket tipleri için enum
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'production_in', 'production_out');
CREATE TYPE stock_reference_type AS ENUM ('purchase', 'sale', 'production', 'adjustment', 'transfer');

-- Stok hareketleri
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type stock_reference_type NULL,
    reference_id INTEGER NULL,
    location_from VARCHAR(100),
    location_to VARCHAR(100),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_number VARCHAR(50),
    expiry_date DATE NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements için indexler
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_supplier ON stock_movements(supplier_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_uuid ON stock_movements(uuid);

-- Stok sayım durumları için enum
CREATE TYPE stock_count_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Stok sayımları
CREATE TABLE stock_counts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    count_number VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(100) DEFAULT 'MAIN',
    status stock_count_status DEFAULT 'planned',
    scheduled_date DATE NOT NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    total_items INTEGER DEFAULT 0,
    counted_items INTEGER DEFAULT 0,
    discrepancies_found INTEGER DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock counts için indexler
CREATE INDEX idx_stock_counts_status ON stock_counts(status);
CREATE INDEX idx_stock_counts_date ON stock_counts(scheduled_date);
CREATE INDEX idx_stock_counts_uuid ON stock_counts(uuid);

-- Stock counts tablosu için trigger
CREATE TRIGGER update_stock_counts_updated_at BEFORE UPDATE ON stock_counts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stok sayım detayları
CREATE TABLE stock_count_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    stock_count_id INTEGER NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    expected_quantity DECIMAL(10,3) DEFAULT 0,
    counted_quantity DECIMAL(10,3) DEFAULT 0,
    variance_quantity DECIMAL(10,3) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
    notes TEXT,
    counted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stock_count_id, product_id)
);

-- Stock count items için indexler
CREATE INDEX idx_stock_count_items_count ON stock_count_items(stock_count_id);
CREATE INDEX idx_stock_count_items_product ON stock_count_items(product_id);
CREATE INDEX idx_stock_count_items_uuid ON stock_count_items(uuid);

-- =======================
-- ÜRETİM YÖNETİMİ
-- =======================

-- BOM (Bill of Materials) - Malzeme Listeleri - Product Tree Yapısı
CREATE TABLE bom (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    finished_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    parent_bom_id INTEGER REFERENCES bom(id) ON DELETE SET NULL, -- Hiyerarşik yapı için üst reçete referansı
    version VARCHAR(10) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    base_cost DECIMAL(12,4) DEFAULT 0, -- Malzeme maliyeti toplamı
    profit_margin DECIMAL(5,2) DEFAULT 0, -- Kar marjı yüzdesi
    final_cost DECIMAL(12,4) GENERATED ALWAYS AS (base_cost * (1 + profit_margin / 100)) STORED, -- Kar marjı dahil nihai maliyet
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(finished_product_id, version)
);

-- BOM için indexler
CREATE INDEX idx_bom_product ON bom(finished_product_id);
CREATE INDEX idx_bom_parent ON bom(parent_bom_id);
CREATE INDEX idx_bom_uuid ON bom(uuid);

-- BOM tablosu için trigger
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON bom
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BOM item tipleri için enum
CREATE TYPE bom_item_type AS ENUM ('material', 'sub_bom');

-- BOM Kalemleri - Malzeme ve Alt Reçete Desteği
CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    bom_id INTEGER NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    item_type bom_item_type NOT NULL DEFAULT 'material', -- Malzeme mi alt reçete mi
    raw_material_id INTEGER REFERENCES products(id) ON DELETE CASCADE, -- Malzeme referansı
    sub_bom_id INTEGER REFERENCES bom(id) ON DELETE CASCADE, -- Alt reçete referansı
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_cost DECIMAL(12,4) DEFAULT 0, -- Birim maliyet
    total_cost DECIMAL(12,4) GENERATED ALWAYS AS (quantity * unit_cost) STORED, -- Toplam maliyet
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Malzeme veya alt reçete seçilmeli, ikisi birden değil
    CONSTRAINT chk_bom_item_type CHECK (
        (item_type = 'material' AND raw_material_id IS NOT NULL AND sub_bom_id IS NULL) OR
        (item_type = 'sub_bom' AND sub_bom_id IS NOT NULL AND raw_material_id IS NULL)
    )
);

-- BOM items için indexler
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(raw_material_id);
CREATE INDEX idx_bom_items_sub_bom ON bom_items(sub_bom_id);
CREATE INDEX idx_bom_items_type ON bom_items(item_type);
CREATE INDEX idx_bom_items_uuid ON bom_items(uuid);

-- BOM items tablosu için trigger
CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Üretim emri durumları için enum
CREATE TYPE production_order_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled', 'on_hold');

-- Üretim Emirleri
CREATE TABLE production_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    bom_id INTEGER NOT NULL REFERENCES bom(id),
    finished_product_id INTEGER NOT NULL REFERENCES products(id),
    planned_quantity DECIMAL(10,3) NOT NULL,
    produced_quantity DECIMAL(10,3) DEFAULT 0,
    remaining_quantity DECIMAL(10,3) GENERATED ALWAYS AS (planned_quantity - produced_quantity) STORED,
    status production_order_status DEFAULT 'planned',
    priority INTEGER DEFAULT 1, -- 1=Düşük, 2=Normal, 3=Yüksek, 4=Acil
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date TIMESTAMPTZ NULL,
    actual_end_date TIMESTAMPTZ NULL,
    estimated_cost DECIMAL(12,4) DEFAULT 0,
    actual_cost DECIMAL(12,4) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Production orders için indexler
CREATE INDEX idx_production_orders_bom ON production_orders(bom_id);
CREATE INDEX idx_production_orders_product ON production_orders(finished_product_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_priority ON production_orders(priority);
CREATE INDEX idx_production_orders_dates ON production_orders(planned_start_date, planned_end_date);
CREATE INDEX idx_production_orders_uuid ON production_orders(uuid);

-- Production orders tablosu için trigger
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- PROJE YÖNETİMİ
-- =======================

-- Proje durumları için enum
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Projeler
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'planning',
    priority project_priority DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    actual_start_date DATE NULL,
    actual_end_date DATE NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_budget DECIMAL(15,2) GENERATED ALWAYS AS (budget - spent_amount) STORED,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    project_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(100),
    client_contact TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Projects için indexler
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_uuid ON projects(uuid);

-- Projects tablosu için trigger
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Görev durumları için enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Proje Görevleri
CREATE TABLE project_tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id INTEGER REFERENCES project_tasks(id) ON DELETE SET NULL,
    task_code VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    estimated_hours DECIMAL(8,2) DEFAULT 0,
    actual_hours DECIMAL(8,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_date DATE NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project tasks için indexler
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_parent ON project_tasks(parent_task_id);
CREATE INDEX idx_project_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_priority ON project_tasks(priority);
CREATE INDEX idx_project_tasks_dates ON project_tasks(start_date, due_date);
CREATE INDEX idx_project_tasks_uuid ON project_tasks(uuid);

-- Project tasks tablosu için trigger
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- MÜŞTERI YÖNETİMİ
-- =======================

-- Müşteri tipleri için enum
CREATE TYPE customer_type AS ENUM ('individual', 'corporate');

-- Müşteriler
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_type customer_type DEFAULT 'individual',
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    tax_number VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- Ödeme vadesi gün
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customers için indexler
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_uuid ON customers(uuid);

-- Customers tablosu için trigger
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- SATIŞ YÖNETİMİ
-- =======================

-- Satış teklifi durumları için enum
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- Satış Teklifleri
CREATE TABLE sales_quotes (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status quote_status DEFAULT 'draft',
    quote_date DATE NOT NULL,
    valid_until DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales quotes için indexler
CREATE INDEX idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX idx_sales_quotes_date ON sales_quotes(quote_date);
CREATE INDEX idx_sales_quotes_uuid ON sales_quotes(uuid);

-- Sales quotes tablosu için trigger
CREATE TRIGGER update_sales_quotes_updated_at BEFORE UPDATE ON sales_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satış siparişi durumları için enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled');

-- Satış Siparişleri
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    quote_id INTEGER REFERENCES sales_quotes(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    order_date DATE NOT NULL,
    delivery_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    shipping_address TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales orders için indexler
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_quote ON sales_orders(quote_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_uuid ON sales_orders(uuid);

-- Sales orders tablosu için trigger
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- SATIN ALMA YÖNETİMİ
-- =======================

-- Satın alma teklifi durumları için enum
CREATE TYPE purchase_quote_status AS ENUM ('draft', 'sent', 'received', 'accepted', 'rejected', 'expired');

-- Satın Alma Teklifleri
CREATE TABLE purchase_quotes (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    status purchase_quote_status DEFAULT 'draft',
    quote_date DATE NOT NULL,
    valid_until DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase quotes için indexler
CREATE INDEX idx_purchase_quotes_supplier ON purchase_quotes(supplier_id);
CREATE INDEX idx_purchase_quotes_status ON purchase_quotes(status);
CREATE INDEX idx_purchase_quotes_date ON purchase_quotes(quote_date);
CREATE INDEX idx_purchase_quotes_uuid ON purchase_quotes(uuid);

-- Purchase quotes tablosu için trigger
CREATE TRIGGER update_purchase_quotes_updated_at BEFORE UPDATE ON purchase_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satın alma siparişi durumları için enum
CREATE TYPE purchase_order_status AS ENUM ('pending', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled');

-- Satın Alma Siparişleri
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    quote_id INTEGER REFERENCES purchase_quotes(id) ON DELETE SET NULL,
    status purchase_order_status DEFAULT 'pending',
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders için indexler
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_quote ON purchase_orders(quote_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_uuid ON purchase_orders(uuid);

-- Purchase orders tablosu için trigger
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ORTAK KALEM TABLOLARI
-- =======================

-- Satış Teklifi Kalemleri
CREATE TABLE sales_quote_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    quote_id INTEGER NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_quote_items_quote ON sales_quote_items(quote_id);
CREATE INDEX idx_sales_quote_items_product ON sales_quote_items(product_id);
CREATE INDEX idx_sales_quote_items_uuid ON sales_quote_items(uuid);

-- Satış Siparişi Kalemleri
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,3) NOT NULL,
    delivered_quantity DECIMAL(10,3) DEFAULT 0,
    remaining_quantity DECIMAL(10,3) GENERATED ALWAYS AS (quantity - delivered_quantity) STORED,
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(order_id);
CREATE INDEX idx_sales_order_items_product ON sales_order_items(product_id);
CREATE INDEX idx_sales_order_items_uuid ON sales_order_items(uuid);

-- Satın Alma Teklifi Kalemleri
CREATE TABLE purchase_quote_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    quote_id INTEGER NOT NULL REFERENCES purchase_quotes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_quote_items_quote ON purchase_quote_items(quote_id);
CREATE INDEX idx_purchase_quote_items_product ON purchase_quote_items(product_id);
CREATE INDEX idx_purchase_quote_items_uuid ON purchase_quote_items(uuid);

-- Satın Alma Siparişi Kalemleri
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,3) NOT NULL,
    received_quantity DECIMAL(10,3) DEFAULT 0,
    remaining_quantity DECIMAL(10,3) GENERATED ALWAYS AS (quantity - received_quantity) STORED,
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX idx_purchase_order_items_uuid ON purchase_order_items(uuid);

-- =======================
-- VIEWS (Görünümler)
-- =======================

-- Stok durumu görünümü
CREATE VIEW current_stock AS
SELECT 
    p.id,
    p.uuid,
    p.sku,
    p.name,
    p.unit,
    COALESCE(i.available_quantity, 0) as available_quantity,
    COALESCE(i.reserved_quantity, 0) as reserved_quantity,
    COALESCE(i.total_quantity, 0) as total_quantity,
    p.min_stock_level,
    p.reorder_point,
    CASE 
        WHEN COALESCE(i.available_quantity, 0) <= p.reorder_point THEN 'LOW'
        WHEN COALESCE(i.available_quantity, 0) <= p.min_stock_level THEN 'CRITICAL'
        ELSE 'OK'
    END as stock_status,
    i.location,
    i.last_count_date,
    p.cost_price,
    COALESCE(i.total_quantity, 0) * p.cost_price as total_value
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.is_active = true;

-- Proje özet görünümü
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.uuid,
    p.project_code,
    p.name,
    p.status,
    p.priority,
    p.start_date,
    p.end_date,
    p.budget,
    p.spent_amount,
    p.remaining_budget,
    p.progress_percentage,
    u.first_name || ' ' || u.last_name as project_manager_name,
    COUNT(pt.id) as total_tasks,
    COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN pt.status = 'in_progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN pt.due_date < CURRENT_DATE AND pt.status != 'completed' THEN 1 END) as overdue_tasks
FROM projects p
LEFT JOIN users u ON p.project_manager_id = u.id
LEFT JOIN project_tasks pt ON p.id = pt.project_id
GROUP BY p.id, p.uuid, p.project_code, p.name, p.status, p.priority, 
         p.start_date, p.end_date, p.budget, p.spent_amount, p.remaining_budget, 
         p.progress_percentage, u.first_name, u.last_name;

-- =======================
-- BAŞLANGIÇ VERİLERİ
-- =======================

-- Varsayılan admin kullanıcısı (şifre: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES ('admin', 'admin@inflow.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin');

-- Varsayılan ürün kategorileri
INSERT INTO product_categories (name, description) VALUES 
('Hammaddeler', 'Üretimde kullanılan temel malzemeler'),
('Yarı Mamuller', 'İşlenmiş ancak henüz bitmiş ürün olmayan malzemeler'),
('Bitmiş Ürünler', 'Satışa hazır nihai ürünler'),
('Yardımcı Malzemeler', 'Üretim sürecinde kullanılan yardımcı malzemeler');

-- Varsayılan ürün tipleri
INSERT INTO product_types (name, description) VALUES 
('Malzeme', 'Fiziksel malzemeler'),
('Hizmet', 'Hizmet kalemleri'),
('Dijital', 'Dijital ürünler');

-- Varsayılan lokasyon
INSERT INTO inventory (product_id, location, available_quantity) 
SELECT id, 'MAIN', 0 FROM products WHERE id = 0; -- Bu satır hiçbir ürün yoksa çalışmayacak, sadece örnek

COMMIT;

-- Schema oluşturma tamamlandı
SELECT 'PostgreSQL Schema created successfully!' as status;