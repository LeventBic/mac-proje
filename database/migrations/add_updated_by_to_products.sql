-- Migration: Add updated_by column to products table
-- Date: 2024-01-01
-- Description: Add updated_by column to track who last updated the product

ALTER TABLE products ADD COLUMN updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_products_updated_by ON products(updated_by);

-- Add comment
COMMENT ON COLUMN products.updated_by IS 'User ID who last updated this product';