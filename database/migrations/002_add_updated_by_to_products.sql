-- Add updated_by column to products table
-- This migration adds the missing updated_by column that is referenced in the controller

-- Add updated_by column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_updated_by ON products(updated_by);

-- Update existing products to have a default updated_by value (admin user)
UPDATE products 
SET updated_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE updated_by IS NULL;

-- Migration completed
SELECT 'Added updated_by column to products table successfully!' as status;