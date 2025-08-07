-- Migration: Fix missing tables and inconsistencies
-- Date: 2024-01-XX
-- Description: Create missing tables that are referenced in the code

-- Create current_stock table
CREATE TABLE IF NOT EXISTS current_stock (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    current_quantity DECIMAL(12,6) DEFAULT 0,
    reserved_quantity DECIMAL(12,6) DEFAULT 0,
    available_quantity DECIMAL(12,6) GENERATED ALWAYS AS (current_quantity - reserved_quantity) STORED,
    last_movement_date TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, location_id)
);

-- Create indexes for current_stock
CREATE INDEX IF NOT EXISTS idx_current_stock_product ON current_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_current_stock_location ON current_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_current_stock_uuid ON current_stock(uuid);

-- Create trigger for current_stock
CREATE TRIGGER update_current_stock_updated_at BEFORE UPDATE ON current_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create product_pricing_logs table
CREATE TABLE IF NOT EXISTS product_pricing_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_unit_price DECIMAL(12,4),
    new_unit_price DECIMAL(12,4),
    old_cost_price DECIMAL(12,4),
    new_cost_price DECIMAL(12,4),
    change_reason VARCHAR(200),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_pricing_logs
CREATE INDEX IF NOT EXISTS idx_product_pricing_logs_product ON product_pricing_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_logs_date ON product_pricing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_product_pricing_logs_uuid ON product_pricing_logs(uuid);

-- Create categories view to fix naming inconsistency
CREATE OR REPLACE VIEW categories AS
SELECT 
    id,
    uuid,
    code,
    name,
    description,
    parent_id,
    level,
    path,
    image_url,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM product_categories;

-- Add comments for documentation
COMMENT ON TABLE current_stock IS 'Current stock levels for products at different locations';
COMMENT ON TABLE product_pricing_logs IS 'Log of product price changes for audit trail';
COMMENT ON VIEW categories IS 'View to maintain backward compatibility with categories table name';

-- Migration completed
SELECT 'Fixed missing tables and naming inconsistencies successfully!' as status;