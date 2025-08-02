-- Enhanced Products Table Migration
-- Bu migration mevcut products tablosunu genişletir ve yeni alanlar ekler

-- =======================
-- YENİ TABLOLAR
-- =======================

-- Para birimleri tablosu
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL, -- TRY, USD, EUR
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Birimler tablosu
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- adet, kg, lt, m, m2, m3
    name VARCHAR(50) NOT NULL,
    category VARCHAR(20), -- weight, volume, length, area, count
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Lokasyonlar tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    warehouse_id INTEGER,
    aisle VARCHAR(10),
    shelf VARCHAR(10),
    bin VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ürün görselleri tablosu
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- PRODUCTS TABLOSU GENİŞLETME
-- =======================

-- Yeni kolonları ekle (eğer yoksa)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS currency_id INTEGER REFERENCES currencies(id),
ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id),
ADD COLUMN IF NOT EXISTS current_stock DECIMAL(12,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_supplier_id INTEGER REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(200),
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reserved_stock DECIMAL(12,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ordered_stock DECIMAL(12,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_increase_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Mevcut kolonları güncelle
ALTER TABLE products 
ALTER COLUMN name TYPE VARCHAR(200),
ALTER COLUMN unit_price TYPE DECIMAL(12,4),
ALTER COLUMN cost_price TYPE DECIMAL(12,4);

-- unit kolonunu unit_id ile değiştir (geçiş süreci)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit_legacy VARCHAR(20);

-- Mevcut unit verilerini unit_legacy'ye kopyala
UPDATE products SET unit_legacy = unit WHERE unit_legacy IS NULL;

-- =======================
-- İNDEKSLER
-- =======================

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency_id);
CREATE INDEX IF NOT EXISTS idx_products_unit ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_id);
CREATE INDEX IF NOT EXISTS idx_products_last_supplier ON products(last_supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_qr_code ON products(qr_code);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);

-- =======================
-- TRİGGERLER
-- =======================

-- Currencies tablosu için trigger
CREATE TRIGGER IF NOT EXISTS update_currencies_updated_at 
    BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Units tablosu için trigger
CREATE TRIGGER IF NOT EXISTS update_units_updated_at 
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Locations tablosu için trigger
CREATE TRIGGER IF NOT EXISTS update_locations_updated_at 
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products tablosunda last_edited_at güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_product_last_edited()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_edited_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_products_last_edited 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_last_edited();

-- =======================
-- BAŞLANGIÇ VERİLERİ
-- =======================

-- Para birimleri
INSERT INTO currencies (code, name, symbol) VALUES 
('TRY', 'Türk Lirası', '₺'),
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£')
ON CONFLICT (code) DO NOTHING;

-- Birimler
INSERT INTO units (code, name, category) VALUES 
('adet', 'Adet', 'count'),
('kg', 'Kilogram', 'weight'),
('gr', 'Gram', 'weight'),
('lt', 'Litre', 'volume'),
('ml', 'Mililitre', 'volume'),
('m', 'Metre', 'length'),
('cm', 'Santimetre', 'length'),
('mm', 'Milimetre', 'length'),
('m2', 'Metrekare', 'area'),
('m3', 'Metreküp', 'volume'),
('paket', 'Paket', 'count'),
('kutu', 'Kutu', 'count'),
('koli', 'Koli', 'count')
ON CONFLICT (code) DO NOTHING;

-- Varsayılan lokasyonlar
INSERT INTO locations (code, name, description) VALUES 
('MAIN-A1', 'Ana Depo - A1 Bölümü', 'Ana depo A1 bölümü'),
('MAIN-A2', 'Ana Depo - A2 Bölümü', 'Ana depo A2 bölümü'),
('MAIN-B1', 'Ana Depo - B1 Bölümü', 'Ana depo B1 bölümü'),
('PROD-01', 'Üretim Alanı 1', 'Üretim alanı 1'),
('QUAL-01', 'Kalite Kontrol', 'Kalite kontrol alanı'),
('SHIP-01', 'Sevkiyat Alanı', 'Sevkiyat hazırlık alanı')
ON CONFLICT (code) DO NOTHING;

-- Mevcut ürünleri varsayılan değerlerle güncelle
UPDATE products SET 
    currency_id = (SELECT id FROM currencies WHERE code = 'TRY' LIMIT 1),
    unit_id = (SELECT id FROM units WHERE code = 'adet' LIMIT 1),
    location_id = (SELECT id FROM locations WHERE code = 'MAIN-A1' LIMIT 1)
WHERE currency_id IS NULL OR unit_id IS NULL OR location_id IS NULL;

-- Migration tamamlandı mesajı
SELECT 'Enhanced Products Table Migration completed successfully!' as status;