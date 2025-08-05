-- Migration: Add brand and supplier_name columns to products table
-- Date: 2024-01-XX
-- Description: Add brand (string) and supplier_name (string) columns to products table
--              to support direct text input from frontend forms

-- Add brand column (text field for brand name)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Add supplier_name column (text field for supplier name)
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(200);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_supplier_name ON products(supplier_name);

-- Add comments for documentation
COMMENT ON COLUMN products.brand IS 'Brand name as text (alternative to brand_id for direct input)';
COMMENT ON COLUMN products.supplier_name IS 'Supplier name as text (alternative to supplier_id for direct input)';