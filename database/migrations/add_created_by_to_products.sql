-- Migration: Add created_by column to products table
-- Date: 2024-01-01
-- Description: Add created_by column to track who created the product

ALTER TABLE products ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_products_created_by ON products(created_by);

-- Add comment
COMMENT ON COLUMN products.created_by IS 'User ID who created this product';

-- Update existing products to have a default created_by value (admin user)
UPDATE products 
SET created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL;