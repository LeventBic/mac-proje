-- inFlow ERP Sistemi - PostgreSQL Database Schema
-- Profesyonel ERP sistemi için gelişmiş veritabanı yapısı
-- MySQL'den PostgreSQL'e geçiş ve ERP özellikleri eklendi

-- UUID extension'ını aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================
-- ENUM TYPES
-- =======================

-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer', 'accountant', 'sales', 'purchasing');

-- Stok hareket tipleri
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'production_in', 'production_out', 'return', 'waste');
CREATE TYPE stock_reference_type AS ENUM ('purchase', 'sale', 'production', 'adjustment', 'transfer', 'return', 'waste');

-- Sipariş durumları
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');

-- Üretim durumları
CREATE TYPE production_status AS ENUM ('planned', 'in_progress', 'paused', 'completed', 'cancelled', 'quality_check');

-- Stok sayım durumları
CREATE TYPE stock_count_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Uyarı tipleri
CREATE TYPE alert_type AS ENUM ('low_stock', 'production_delay', 'quality_issue', 'system', 'financial', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- Ödeme durumları
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'cancelled');

-- Proje durumları
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- Görev durumları
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled');

-- BOM item tipleri
CREATE TYPE bom_item_type AS ENUM ('material', 'sub_bom', 'service', 'labor');

-- =======================
-- UTILITY FUNCTIONS
-- =======================

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Otomatik kod üretme fonksiyonu
CREATE OR REPLACE FUNCTION generate_code(prefix TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    code TEXT;
BEGIN
    EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM LENGTH(%L) + 2) AS INTEGER)), 0) + 1 FROM %I WHERE %I LIKE %L',
                   column_name, prefix, table_name, column_name, prefix || '%')
    INTO next_number;
    
    code := prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    RETURN code;
END;
$$ language 'plpgsql';

-- =======================
-- KULLANICI YÖNETİMİ
-- =======================

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
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(20),
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ NULL,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    password_changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcılar için indexler
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department ON users(department);

-- Users tablosu için trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kullanıcı oturumları
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Kullanıcı izinleri
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_name ON permissions(name);

-- Rol izinleri
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- Kullanıcı aktivite logları
CREATE TABLE user_activity_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON user_activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_date ON user_activity_logs(created_at);

-- =======================
-- ŞİRKET VE LOKASYON YÖNETİMİ
-- =======================

-- Şirket bilgileri
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_number VARCHAR(50) UNIQUE,
    tax_office VARCHAR(100),
    trade_registry_number VARCHAR(50),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo_url VARCHAR(500),
    currency VARCHAR(3) DEFAULT 'TRY',
    fiscal_year_start INTEGER DEFAULT 1, -- Ay (1-12)
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_tax_number ON companies(tax_number);
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lokasyonlar/Depolar
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'warehouse', -- warehouse, store, production, office
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    capacity_m3 DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_company ON locations(company_id);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_type ON locations(type);
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
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
    legal_name VARCHAR(200),
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(200),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    tax_number VARCHAR(50),
    tax_office VARCHAR(100),
    payment_terms INTEGER DEFAULT 30, -- Ödeme vadesi gün
    credit_limit DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    iban VARCHAR(50),
    swift_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 arası rating
    quality_rating DECIMAL(3,2) DEFAULT 0,
    delivery_rating DECIMAL(3,2) DEFAULT 0,
    price_rating DECIMAL(3,2) DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers için indexler
CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_uuid ON suppliers(uuid);
CREATE INDEX idx_suppliers_tax_number ON suppliers(tax_number);
CREATE INDEX idx_suppliers_tags ON suppliers USING GIN(tags);

-- Suppliers tablosu için trigger
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tedarikçi iletişim kişileri
CREATE TABLE supplier_contacts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    department VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);
CREATE TRIGGER update_supplier_contacts_updated_at BEFORE UPDATE ON supplier_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- MÜŞTERİ YÖNETİMİ (CRM)
-- =======================

-- Müşteriler tablosu
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(200),
    type VARCHAR(50) DEFAULT 'corporate', -- individual, corporate
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(200),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    tax_number VARCHAR(50),
    tax_office VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- Ödeme vadesi gün
    currency VARCHAR(3) DEFAULT 'TRY',
    sales_rep_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 arası rating
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customers için indexler
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_uuid ON customers(uuid);
CREATE INDEX idx_customers_sales_rep ON customers(sales_rep_id);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);

-- Customers tablosu için trigger
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Müşteri iletişim kişileri
CREATE TABLE customer_contacts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    department VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE TRIGGER update_customer_contacts_updated_at BEFORE UPDATE ON customer_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ÜRÜN YÖNETİMİ
-- =======================

-- Ürün kategorileri
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    path VARCHAR(500), -- Hiyerarşik path (örn: /1/3/7/)
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product categories için indexler
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_product_categories_uuid ON product_categories(uuid);
CREATE INDEX idx_product_categories_code ON product_categories(code);
CREATE INDEX idx_product_categories_path ON product_categories(path);

-- Product categories tablosu için trigger
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürün tipleri
CREATE TABLE product_types (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}', -- Tip özelliklerini JSON olarak sakla
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

-- Ürün markaları
CREATE TABLE product_brands (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_brands_name ON product_brands(name);
CREATE TRIGGER update_product_brands_updated_at BEFORE UPDATE ON product_brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürünler tablosu
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(200),
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    product_type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES product_brands(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Fiyat bilgileri
    unit_price DECIMAL(12,4) DEFAULT 0,
    cost_price DECIMAL(12,4) DEFAULT 0,
    list_price DECIMAL(12,4) DEFAULT 0,
    wholesale_price DECIMAL(12,4) DEFAULT 0,
    
    -- Birim ve ölçü bilgileri
    unit VARCHAR(20) DEFAULT 'pcs', -- pcs, kg, lt, m, m2, m3, etc.
    weight DECIMAL(10,3),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions_length DECIMAL(10,2),
    dimensions_width DECIMAL(10,2),
    dimensions_height DECIMAL(10,2),
    dimensions_unit VARCHAR(10) DEFAULT 'cm',
    
    -- Stok bilgileri
    location VARCHAR(100),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    shelf_life_days INTEGER,
    
    -- Ürün özellikleri
    is_active BOOLEAN DEFAULT TRUE,
    is_raw_material BOOLEAN DEFAULT FALSE,
    is_finished_product BOOLEAN DEFAULT FALSE,
    is_service BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    is_serialized BOOLEAN DEFAULT FALSE,
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    is_expiry_tracked BOOLEAN DEFAULT FALSE,
    
    -- Kalite ve sertifikasyon
    quality_grade VARCHAR(20),
    certifications TEXT[],
    
    -- SEO ve e-ticaret
    slug VARCHAR(200) UNIQUE,
    meta_title VARCHAR(200),
    meta_description TEXT,
    keywords TEXT[],
    
    -- Medya
    image_urls TEXT[],
    document_urls TEXT[],
    
    -- Özel alanlar
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products için indexler
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_product_type ON products(product_type_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_type ON products(is_raw_material, is_finished_product, is_service);
CREATE INDEX idx_products_uuid ON products(uuid);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_keywords ON products USING GIN(keywords);
CREATE INDEX idx_products_custom_fields ON products USING GIN(custom_fields);

-- Products tablosu için trigger
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürün varyantları
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    parent_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200),
    attributes JSONB NOT NULL, -- Renk, beden, model vb.
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    cost_adjustment DECIMAL(10,2) DEFAULT 0,
    weight_adjustment DECIMAL(10,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_parent ON product_variants(parent_product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN(attributes);
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ürün fiyat geçmişi
CREATE TABLE product_price_history (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_type VARCHAR(50) NOT NULL, -- unit_price, cost_price, list_price, wholesale_price
    old_price DECIMAL(12,4),
    new_price DECIMAL(12,4) NOT NULL,
    change_reason VARCHAR(200),
    effective_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_price_history_product ON product_price_history(product_id);
CREATE INDEX idx_product_price_history_date ON product_price_history(effective_date);
CREATE INDEX idx_product_price_history_type ON product_price_history(price_type);

-- =======================
-- STOK YÖNETİMİ
-- =======================

-- Envanter tablosu
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    available_quantity DECIMAL(12,6) DEFAULT 0,
    reserved_quantity DECIMAL(12,6) DEFAULT 0,
    damaged_quantity DECIMAL(12,6) DEFAULT 0,
    total_quantity DECIMAL(12,6) GENERATED ALWAYS AS (available_quantity + reserved_quantity + damaged_quantity) STORED,
    
    -- Maliyet bilgileri
    average_cost DECIMAL(12,4) DEFAULT 0,
    last_cost DECIMAL(12,4) DEFAULT 0,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS ((available_quantity + reserved_quantity + damaged_quantity) * average_cost) STORED,
    
    -- Tarih bilgileri
    last_count_date TIMESTAMPTZ NULL,
    last_movement_date TIMESTAMPTZ NULL,
    last_purchase_date TIMESTAMPTZ NULL,
    last_sale_date TIMESTAMPTZ NULL,
    
    -- Lot/Seri takibi
    lot_numbers JSONB DEFAULT '[]',
    serial_numbers JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, location_id)
);

-- Inventory için indexler
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_uuid ON inventory(uuid);
CREATE INDEX idx_inventory_quantities ON inventory(available_quantity, reserved_quantity);
CREATE INDEX idx_inventory_lot_numbers ON inventory USING GIN(lot_numbers);
CREATE INDEX idx_inventory_serial_numbers ON inventory USING GIN(serial_numbers);

-- Inventory tablosu için trigger
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stok hareketleri
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity DECIMAL(12,6) NOT NULL,
    unit_cost DECIMAL(12,4),
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
    
    -- Referans bilgileri
    reference_type stock_reference_type NULL,
    reference_id INTEGER NULL,
    reference_number VARCHAR(100),
    
    -- Lokasyon bilgileri
    location_from_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    location_to_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Tedarikçi/Müşteri bilgileri
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Lot/Seri bilgileri
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),
    serial_number VARCHAR(100),
    expiry_date DATE NULL,
    
    -- Ek bilgiler
    notes TEXT,
    reason VARCHAR(200),
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements için indexler
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_location ON stock_movements(location_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_supplier ON stock_movements(supplier_id);
CREATE INDEX idx_stock_movements_customer ON stock_movements(customer_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_uuid ON stock_movements(uuid);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_number);
CREATE INDEX idx_stock_movements_lot ON stock_movements(lot_number);
CREATE INDEX idx_stock_movements_serial ON stock_movements(serial_number);

-- Stok sayımları
CREATE TABLE stock_counts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    count_number VARCHAR(50) UNIQUE NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    status stock_count_status DEFAULT 'planned',
    count_type VARCHAR(50) DEFAULT 'full', -- full, partial, cycle
    scheduled_date DATE NOT NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    total_items INTEGER DEFAULT 0,
    counted_items INTEGER DEFAULT 0,
    discrepancies_found INTEGER DEFAULT 0,
    total_variance_value DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock counts için indexler
CREATE INDEX idx_stock_counts_location ON stock_counts(location_id);
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
    expected_quantity DECIMAL(12,6) DEFAULT 0,
    counted_quantity DECIMAL(12,6) DEFAULT 0,
    variance_quantity DECIMAL(12,6) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
    unit_cost DECIMAL(12,4) DEFAULT 0,
    variance_value DECIMAL(15,2) GENERATED ALWAYS AS ((counted_quantity - expected_quantity) * unit_cost) STORED,
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),
    serial_number VARCHAR(100),
    notes TEXT,
    counted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stock_count_id, product_id, batch_number, lot_number, serial_number)
);

-- Stock count items için indexler
CREATE INDEX idx_stock_count_items_count ON stock_count_items(stock_count_id);
CREATE INDEX idx_stock_count_items_product ON stock_count_items(product_id);
CREATE INDEX idx_stock_count_items_uuid ON stock_count_items(uuid);

-- =======================
-- ÜRETİM YÖNETİMİ
-- =======================

-- BOM (Bill of Materials) - Malzeme Listeleri
CREATE TABLE bom (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    bom_number VARCHAR(50) UNIQUE NOT NULL,
    finished_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    parent_bom_id INTEGER REFERENCES bom(id) ON DELETE SET NULL,
    version VARCHAR(10) DEFAULT '1.0',
    name VARCHAR(200),
    description TEXT,
    
    -- Maliyet bilgileri
    base_cost DECIMAL(15,4) DEFAULT 0,
    labor_cost DECIMAL(15,4) DEFAULT 0,
    overhead_cost DECIMAL(15,4) DEFAULT 0,
    total_cost DECIMAL(15,4) GENERATED ALWAYS AS (base_cost + labor_cost + overhead_cost) STORED,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    selling_price DECIMAL(15,4),
    
    -- Üretim bilgileri
    production_time_minutes INTEGER DEFAULT 0,
    setup_time_minutes INTEGER DEFAULT 0,
    batch_size DECIMAL(10,3) DEFAULT 1,
    yield_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Durum bilgileri
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ NULL,
    
    -- Ek bilgiler
    notes TEXT,
    instructions TEXT,
    quality_requirements TEXT,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BOM için indexler
CREATE INDEX idx_bom_number ON bom(bom_number);
CREATE INDEX idx_bom_product ON bom(finished_product_id);
CREATE INDEX idx_bom_parent ON bom(parent_bom_id);
CREATE INDEX idx_bom_uuid ON bom(uuid);
CREATE INDEX idx_bom_version ON bom(finished_product_id, version);

-- BOM tablosu için trigger
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON bom
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BOM Kalemleri
CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    bom_id INTEGER NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    item_type bom_item_type NOT NULL DEFAULT 'material',
    
    -- Malzeme bilgileri
    raw_material_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sub_bom_id INTEGER REFERENCES bom(id) ON DELETE CASCADE,
    
    -- Miktar ve birim bilgileri
    quantity DECIMAL(12,6) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_cost DECIMAL(12,4) DEFAULT 0,
    total_cost DECIMAL(15,4) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    
    -- Üretim bilgileri
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    scrap_percentage DECIMAL(5,2) DEFAULT 0,
    efficiency_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Operasyon bilgileri
    operation_sequence INTEGER DEFAULT 1,
    operation_description TEXT,
    required_skills TEXT[],
    
    -- Kalite kontrol
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_specifications TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Malzeme, alt reçete veya servis seçilmeli
    CONSTRAINT chk_bom_item_type CHECK (
        (item_type = 'material' AND raw_material_id IS NOT NULL AND sub_bom_id IS NULL) OR
        (item_type = 'sub_bom' AND sub_bom_id IS NOT NULL AND raw_material_id IS NULL) OR
        (item_type IN ('service', 'labor'))
    )
);

-- BOM items için indexler
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(raw_material_id);
CREATE INDEX idx_bom_items_sub_bom ON bom_items(sub_bom_id);
CREATE INDEX idx_bom_items_type ON bom_items(item_type);
CREATE INDEX idx_bom_items_uuid ON bom_items(uuid);
CREATE INDEX idx_bom_items_sequence ON bom_items(bom_id, operation_sequence);

-- BOM items tablosu için trigger
CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Üretim Emirleri
CREATE TABLE production_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    bom_id INTEGER NOT NULL REFERENCES bom(id) ON DELETE RESTRICT,
    
    -- Miktar bilgileri
    planned_quantity DECIMAL(12,6) NOT NULL,
    produced_quantity DECIMAL(12,6) DEFAULT 0,
    good_quantity DECIMAL(12,6) DEFAULT 0,
    scrap_quantity DECIMAL(12,6) DEFAULT 0,
    
    -- Durum ve öncelik
    status production_status DEFAULT 'planned',
    priority priority_level DEFAULT 'medium',
    
    -- Tarih bilgileri
    planned_start_date TIMESTAMPTZ NULL,
    planned_end_date TIMESTAMPTZ NULL,
    actual_start_date TIMESTAMPTZ NULL,
    actual_end_date TIMESTAMPTZ NULL,
    
    -- Maliyet bilgileri
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    material_cost DECIMAL(15,2) DEFAULT 0,
    labor_cost DECIMAL(15,2) DEFAULT 0,
    overhead_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Lokasyon ve kaynak bilgileri
    production_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Referans bilgileri
    sales_order_id INTEGER, -- Foreign key sales_orders tablosuna
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Ek bilgiler
    notes TEXT,
    special_instructions TEXT,
    quality_requirements TEXT,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Production orders için indexler
CREATE INDEX idx_production_orders_number ON production_orders(order_number);
CREATE INDEX idx_production_orders_bom ON production_orders(bom_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_priority ON production_orders(priority);
CREATE INDEX idx_production_orders_dates ON production_orders(planned_start_date, planned_end_date);
CREATE INDEX idx_production_orders_location ON production_orders(production_location_id);
CREATE INDEX idx_production_orders_assigned ON production_orders(assigned_to);
CREATE INDEX idx_production_orders_customer ON production_orders(customer_id);
CREATE INDEX idx_production_orders_uuid ON production_orders(uuid);

-- Production orders tablosu için trigger
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Üretim Hareketleri
CREATE TABLE production_movements (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    
    -- Miktar ve maliyet
    quantity DECIMAL(12,6) NOT NULL,
    unit_cost DECIMAL(12,4),
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
    
    -- Lokasyon bilgileri
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Lot/Seri bilgileri
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),
    serial_number VARCHAR(100),
    
    -- Kalite bilgileri
    quality_grade VARCHAR(20),
    quality_notes TEXT,
    
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Production movements için indexler
CREATE INDEX idx_production_movements_order ON production_movements(production_order_id);
CREATE INDEX idx_production_movements_product ON production_movements(product_id);
CREATE INDEX idx_production_movements_type ON production_movements(movement_type);
CREATE INDEX idx_production_movements_location ON production_movements(location_id);
CREATE INDEX idx_production_movements_uuid ON production_movements(uuid);

-- =======================
-- SATIN ALMA YÖNETİMİ
-- =======================

-- Satın alma talepleri
CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status order_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department VARCHAR(100),
    budget_code VARCHAR(50),
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    required_date DATE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_requests_number ON purchase_requests(request_number);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_requested_by ON purchase_requests(requested_by);
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON purchase_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satın alma talebi kalemleri
CREATE TABLE purchase_request_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    purchase_request_id INTEGER NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(12,6) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    estimated_unit_price DECIMAL(12,4),
    estimated_total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * COALESCE(estimated_unit_price, 0)) STORED,
    required_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_request_items_request ON purchase_request_items(purchase_request_id);
CREATE INDEX idx_purchase_request_items_product ON purchase_request_items(product_id);

-- Satın alma siparişleri
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE SET NULL,
    
    -- Tarih bilgileri
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Durum ve öncelik
    status order_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    
    -- Finansal bilgiler
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    exchange_rate DECIMAL(10,6) DEFAULT 1,
    
    -- Ödeme bilgileri
    payment_terms INTEGER DEFAULT 30,
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    
    -- Teslimat bilgileri
    delivery_address TEXT,
    delivery_contact VARCHAR(100),
    delivery_phone VARCHAR(20),
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    
    -- Ek bilgiler
    notes TEXT,
    terms_conditions TEXT,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders için indexler
CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_payment_status ON purchase_orders(payment_status);
CREATE INDEX idx_purchase_orders_uuid ON purchase_orders(uuid);

-- Purchase orders tablosu için trigger
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satın alma sipariş kalemleri
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    
    -- Miktar ve birim
    quantity DECIMAL(12,6) NOT NULL,
    received_quantity DECIMAL(12,6) DEFAULT 0,
    remaining_quantity DECIMAL(12,6) GENERATED ALWAYS AS (quantity - received_quantity) STORED,
    unit VARCHAR(20) DEFAULT 'pcs',
    
    -- Fiyat bilgileri
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount_amount, 0)) STORED,
    
    -- Tarih bilgileri
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Kalite ve spesifikasyon
    specifications TEXT,
    quality_requirements TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items için indexler
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX idx_purchase_order_items_uuid ON purchase_order_items(uuid);

-- =======================
-- SATIŞ YÖNETİMİ
-- =======================

-- Satış teklifleri
CREATE TABLE sales_quotes (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Tarih bilgileri
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Durum bilgileri
    status order_status DEFAULT 'draft',
    
    -- Finansal bilgiler
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Ödeme ve teslimat
    payment_terms INTEGER DEFAULT 30,
    delivery_terms VARCHAR(200),
    delivery_time_days INTEGER,
    
    -- Ek bilgiler
    notes TEXT,
    terms_conditions TEXT,
    
    sales_rep_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales quotes için indexler
CREATE INDEX idx_sales_quotes_number ON sales_quotes(quote_number);
CREATE INDEX idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX idx_sales_quotes_date ON sales_quotes(quote_date);
CREATE INDEX idx_sales_quotes_sales_rep ON sales_quotes(sales_rep_id);
CREATE INDEX idx_sales_quotes_uuid ON sales_quotes(uuid);

-- Sales quotes tablosu için trigger
CREATE TRIGGER update_sales_quotes_updated_at BEFORE UPDATE ON sales_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satış teklifi kalemleri
CREATE TABLE sales_quote_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    sales_quote_id INTEGER NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    
    -- Miktar ve birim
    quantity DECIMAL(12,6) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    
    -- Fiyat bilgileri
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount_amount, 0)) STORED,
    
    -- Teslimat
    delivery_time_days INTEGER,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales quote items için indexler
CREATE INDEX idx_sales_quote_items_quote ON sales_quote_items(sales_quote_id);
CREATE INDEX idx_sales_quote_items_product ON sales_quote_items(product_id);
CREATE INDEX idx_sales_quote_items_uuid ON sales_quote_items(uuid);

-- Satış siparişleri
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sales_quote_id INTEGER REFERENCES sales_quotes(id) ON DELETE SET NULL,
    
    -- Tarih bilgileri
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_delivery_date DATE,
    promised_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Durum ve öncelik
    status order_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    
    -- Finansal bilgiler
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Ödeme bilgileri
    payment_terms INTEGER DEFAULT 30,
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    
    -- Teslimat bilgileri
    delivery_address TEXT,
    delivery_contact VARCHAR(100),
    delivery_phone VARCHAR(20),
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    
    -- Ek bilgiler
    notes TEXT,
    special_instructions TEXT,
    
    sales_rep_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales orders için indexler
CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_payment_status ON sales_orders(payment_status);
CREATE INDEX idx_sales_orders_sales_rep ON sales_orders(sales_rep_id);
CREATE INDEX idx_sales_orders_uuid ON sales_orders(uuid);

-- Sales orders tablosu için trigger
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satış sipariş kalemleri
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    
    -- Miktar ve birim
    quantity DECIMAL(12,6) NOT NULL,
    delivered_quantity DECIMAL(12,6) DEFAULT 0,
    remaining_quantity DECIMAL(12,6) GENERATED ALWAYS AS (quantity - delivered_quantity) STORED,
    unit VARCHAR(20) DEFAULT 'pcs',
    
    -- Fiyat bilgileri
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount_amount, 0)) STORED,
    
    -- Tarih bilgileri
    requested_delivery_date DATE,
    promised_delivery_date DATE,
    actual_delivery_date DATE,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales order items için indexler
CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_product ON sales_order_items(product_id);
CREATE INDEX idx_sales_order_items_uuid ON sales_order_items(uuid);

-- =======================
-- PROJE YÖNETİMİ
-- =======================

-- Projeler tablosu
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    project_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status project_status DEFAULT 'planning',
    priority priority_level DEFAULT 'medium',
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Projects için indexler
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, planned_end_date);
CREATE INDEX idx_projects_uuid ON projects(uuid);

-- Projects tablosu için trigger
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Proje Görevleri
CREATE TABLE project_tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status task_status DEFAULT 'not_started',
    priority priority_level DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    dependencies TEXT, -- JSON array of dependent task IDs
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project tasks için indexler
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_dates ON project_tasks(start_date, due_date);
CREATE INDEX idx_project_tasks_uuid ON project_tasks(uuid);

-- Project tasks tablosu için trigger
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Proje Maliyetleri
CREATE TABLE project_costs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL, -- material, labor, equipment, overhead, other
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    cost_date DATE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project costs için indexler
CREATE INDEX idx_project_costs_project ON project_costs(project_id);
CREATE INDEX idx_project_costs_type ON project_costs(cost_type);
CREATE INDEX idx_project_costs_date ON project_costs(cost_date);
CREATE INDEX idx_project_costs_uuid ON project_costs(uuid);

-- =======================
-- UYARI SİSTEMİ
-- =======================

-- Uyarılar
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    type alert_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50) NULL,
    related_entity_id INTEGER NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alerts için indexler
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(is_read, is_resolved);
CREATE INDEX idx_alerts_entity ON alerts(related_entity_type, related_entity_id);
CREATE INDEX idx_alerts_assigned ON alerts(assigned_to);
CREATE INDEX idx_alerts_uuid ON alerts(uuid);

-- Alerts tablosu için trigger
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- MALİ YÖNETİM
-- =======================

-- Faturalar
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) NOT NULL, -- sales, purchase
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    
    -- Tarih bilgileri
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Finansal bilgiler
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Durum
    status order_status DEFAULT 'draft',
    payment_status payment_status DEFAULT 'pending',
    
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Invoices için indexler
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_uuid ON invoices(uuid);

-- Invoices tablosu için trigger
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fatura kalemleri
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12,6) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(12,4) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount_amount, 0)) STORED,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_invoice_items_uuid ON invoice_items(uuid);

-- Ödemeler
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- received, paid
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Ödeme bilgileri
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50), -- cash, bank_transfer, credit_card, check
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Banka bilgileri
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    transaction_reference VARCHAR(100),
    
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_uuid ON payments(uuid);

-- =======================
-- RAPORLAMA VE ANALİTİK
-- =======================

-- Dashboard için özet view'ları
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND is_raw_material = TRUE) as raw_materials_count,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND is_finished_product = TRUE) as finished_products_count,
    (SELECT COUNT(*) FROM production_orders WHERE status IN ('planned', 'in_progress')) as active_production_orders,
    (SELECT COUNT(*) FROM sales_orders WHERE status IN ('confirmed', 'in_production', 'ready')) as active_sales_orders,
    (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('confirmed', 'pending')) as active_purchase_orders,
    (SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE) as unresolved_alerts,
    (SELECT SUM(i.total_value) FROM inventory i WHERE i.total_quantity > 0) as total_inventory_value;

-- Düşük stok uyarıları view
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.uuid,
    p.sku,
    p.name,
    p.min_stock_level,
    COALESCE(SUM(i.available_quantity), 0) as total_available_quantity,
    pc.name as category_name,
    s.name as supplier_name,
    (p.min_stock_level - COALESCE(SUM(i.available_quantity), 0)) as shortage_quantity
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE 
  AND p.min_stock_level > 0
GROUP BY p.id, p.uuid, p.sku, p.name, p.min_stock_level, pc.name, s.name
HAVING COALESCE(SUM(i.available_quantity), 0) <= p.min_stock_level;

-- Mevcut stok durumu view
CREATE VIEW current_stock_view AS
SELECT 
    p.id,
    p.uuid,
    p.sku,
    p.name,
    p.barcode,
    p.unit,
    p.min_stock_level,
    p.max_stock_level,
    p.reorder_point,
    p.reorder_quantity,
    p.unit_price,
    p.cost_price,
    COALESCE(SUM(i.available_quantity), 0) as total_available_quantity,
    COALESCE(SUM(i.reserved_quantity), 0) as total_reserved_quantity,
    COALESCE(SUM(i.total_quantity), 0) as total_quantity,
    COALESCE(SUM(i.total_value), 0) as total_stock_value,
    pc.name as category_name,
    s.name as supplier_name,
    s.supplier_code,
    CASE 
        WHEN COALESCE(SUM(i.available_quantity), 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(i.available_quantity), 0) <= p.min_stock_level THEN 'low_stock'
        WHEN p.max_stock_level IS NOT NULL AND COALESCE(SUM(i.available_quantity), 0) >= p.max_stock_level THEN 'overstock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.uuid, p.sku, p.name, p.barcode, p.unit, p.min_stock_level, 
         p.max_stock_level, p.reorder_point, p.reorder_quantity, p.unit_price, 
         p.cost_price, pc.name, s.name, s.supplier_code;

-- Üretim durumu özeti
CREATE VIEW production_summary AS
SELECT 
    po.id,
    po.uuid,
    po.order_number,
    p.name as product_name,
    po.planned_quantity,
    po.produced_quantity,
    po.good_quantity,
    po.scrap_quantity,
    po.status,
    po.priority,
    po.planned_start_date,
    po.planned_end_date,
    po.actual_start_date,
    po.actual_end_date,
    CASE 
        WHEN po.planned_quantity > 0 THEN 
            ROUND((po.produced_quantity / po.planned_quantity) * 100, 2)
        ELSE 0 
    END as completion_percentage,
    l.name as production_location,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM production_orders po
JOIN bom b ON po.bom_id = b.id
JOIN products p ON b.finished_product_id = p.id
LEFT JOIN locations l ON po.production_location_id = l.id
LEFT JOIN users u ON po.assigned_to = u.id
WHERE po.status IN ('planned', 'in_progress', 'completed');

-- =======================
-- TRİGGER'LAR VE FONKSİYONLAR
-- =======================

-- Stok hareketi sonrası envanter güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_inventory_after_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Stok hareketine göre envanter güncelle
    IF NEW.movement_type IN ('in', 'production_in', 'return') THEN
        INSERT INTO inventory (product_id, location_id, available_quantity, average_cost, last_cost, last_movement_date)
        VALUES (NEW.product_id, NEW.location_id, NEW.quantity, COALESCE(NEW.unit_cost, 0), COALESCE(NEW.unit_cost, 0), NEW.created_at)
        ON CONFLICT (product_id, location_id) 
        DO UPDATE SET 
            available_quantity = inventory.available_quantity + NEW.quantity,
            last_cost = COALESCE(NEW.unit_cost, inventory.last_cost),
            average_cost = CASE 
                WHEN inventory.total_quantity + NEW.quantity > 0 THEN
                    ((inventory.average_cost * inventory.total_quantity) + (COALESCE(NEW.unit_cost, 0) * NEW.quantity)) / (inventory.total_quantity + NEW.quantity)
                ELSE inventory.average_cost
            END,
            last_movement_date = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP;
    ELSIF NEW.movement_type IN ('out', 'production_out', 'waste') THEN
        UPDATE inventory 
        SET 
            available_quantity = GREATEST(0, available_quantity - NEW.quantity),
            last_movement_date = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.product_id AND location_id = NEW.location_id;
    ELSIF NEW.movement_type = 'adjustment' THEN
        INSERT INTO inventory (product_id, location_id, available_quantity, last_movement_date)
        VALUES (NEW.product_id, NEW.location_id, NEW.quantity, NEW.created_at)
        ON CONFLICT (product_id, location_id) 
        DO UPDATE SET 
            available_quantity = NEW.quantity,
            last_movement_date = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stok hareketi trigger'ı
CREATE TRIGGER trigger_update_inventory_after_stock_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_inventory_after_stock_movement();

-- Düşük stok kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    min_level INTEGER;
    product_name VARCHAR(200);
BEGIN
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
            'Ürün: ' || product_name || ' stok seviyesi minimum seviyenin altına düştü. Mevcut: ' || NEW.available_quantity || ', Minimum: ' || min_level,
            'warning',
            'product',
            NEW.product_id
        )
        ON CONFLICT DO NOTHING; -- Aynı ürün için tekrar uyarı oluşturma
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Düşük stok kontrolü trigger'ı
CREATE TRIGGER trigger_check_low_stock
    AFTER UPDATE OF available_quantity ON inventory
    FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- Otomatik kod üretme trigger fonksiyonları
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_code('PO', 'purchase_orders', 'order_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_purchase_order_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION generate_purchase_order_number();

CREATE OR REPLACE FUNCTION generate_sales_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_code('SO', 'sales_orders', 'order_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_sales_order_number
    BEFORE INSERT ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION generate_sales_order_number();

CREATE OR REPLACE FUNCTION generate_production_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_code('MO', 'production_orders', 'order_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_production_order_number
    BEFORE INSERT ON production_orders
    FOR EACH ROW EXECUTE FUNCTION generate_production_order_number();

-- =======================
-- İNDEKSLER VE OPTİMİZASYON
-- =======================

-- Performans için ek indeksler
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX idx_production_orders_status_priority ON production_orders(status, priority);
CREATE INDEX idx_alerts_created_unresolved ON alerts(created_at, is_resolved);
CREATE INDEX idx_invoices_date_status ON invoices(invoice_date, status);
CREATE INDEX idx_payments_date_type ON payments(payment_date, payment_type);

-- =======================
-- BAŞLANGIÇ VERİLERİ
-- =======================

-- Varsayılan şirket
INSERT INTO companies (name, legal_name, tax_number, currency, settings) VALUES 
('inFlow ERP', 'inFlow ERP Teknoloji A.Ş.', '1234567890', 'TRY', '{"default_location": "MAIN"}');

-- Varsayılan lokasyon
INSERT INTO locations (company_id, code, name, type, is_active) VALUES 
(1, 'MAIN', 'Ana Depo', 'warehouse', TRUE),
(1, 'PROD', 'Üretim Alanı', 'production', TRUE),
(1, 'QC', 'Kalite Kontrol', 'warehouse', TRUE);

-- Varsayılan izinler
INSERT INTO permissions (name, description, module, action) VALUES 
('users.view', 'Kullanıcıları görüntüleme', 'users', 'view'),
('users.create', 'Kullanıcı oluşturma', 'users', 'create'),
('users.edit', 'Kullanıcı düzenleme', 'users', 'edit'),
('users.delete', 'Kullanıcı silme', 'users', 'delete'),
('products.view', 'Ürünleri görüntüleme', 'products', 'view'),
('products.create', 'Ürün oluşturma', 'products', 'create'),
('products.edit', 'Ürün düzenleme', 'products', 'edit'),
('products.delete', 'Ürün silme', 'products', 'delete'),
('inventory.view', 'Stok görüntüleme', 'inventory', 'view'),
('inventory.manage', 'Stok yönetimi', 'inventory', 'manage'),
('production.view', 'Üretim görüntüleme', 'production', 'view'),
('production.manage', 'Üretim yönetimi', 'production', 'manage'),
('sales.view', 'Satış görüntüleme', 'sales', 'view'),
('sales.manage', 'Satış yönetimi', 'sales', 'manage'),
('purchasing.view', 'Satın alma görüntüleme', 'purchasing', 'view'),
('purchasing.manage', 'Satın alma yönetimi', 'purchasing', 'manage'),
('reports.view', 'Raporları görüntüleme', 'reports', 'view'),
('settings.manage', 'Sistem ayarları', 'settings', 'manage');

-- Admin rolü için tüm izinleri ver
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'admin', id, TRUE FROM permissions;

-- Manager rolü için çoğu izinleri ver (kullanıcı silme hariç)
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'manager', id, TRUE FROM permissions WHERE name != 'users.delete' AND name != 'settings.manage';

-- Operator rolü için operasyonel izinleri ver
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'operator', id, TRUE FROM permissions 
WHERE name IN ('products.view', 'inventory.view', 'inventory.manage', 'production.view', 'production.manage');

-- Varsayılan ürün kategorileri
INSERT INTO product_categories (code, name, description, level, path) VALUES 
('HAM', 'Hammaddeler', 'Üretimde kullanılan temel malzemeler', 1, '/1/'),
('YAR', 'Yarı Mamuller', 'İşlenmiş ama henüz bitmiş olmayan ürünler', 1, '/2/'),
('MAM', 'Bitmiş Ürünler', 'Satışa hazır nihai ürünler', 1, '/3/'),
('AMB', 'Ambalaj Malzemeleri', 'Ambalajlama için kullanılan malzemeler', 1, '/4/'),
('YRD', 'Yardımcı Malzemeler', 'Üretim sürecinde kullanılan yardımcı malzemeler', 1, '/5/');

-- Varsayılan ürün tipleri
INSERT INTO product_types (name, description, properties) VALUES 
('Malzeme', 'Fiziksel malzemeler', '{"trackable": true, "serialized": false}'),
('Hizmet', 'Hizmet kalemleri', '{"trackable": false, "serialized": false}'),
('Dijital', 'Dijital ürünler', '{"trackable": false, "serialized": true}');

-- Kullanıcılar seed dosyasında oluşturulacak

-- Schema oluşturma tamamlandı
SELECT 'PostgreSQL ERP Database Schema created successfully!' as status;