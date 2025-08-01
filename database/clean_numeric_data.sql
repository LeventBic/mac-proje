-- Veritabanındaki sayısal verileri temizleme ve standardize etme scripti (düzeltilmiş)
-- Bu script sayısal alanları Türk formatına uygun hale getirir
-- Generated columnları hariç tutar

-- 1. Products tablosundaki sayısal verileri temizle
UPDATE products 
SET 
    cost_price = ROUND(COALESCE(cost_price, 0), 2),
    list_price = ROUND(COALESCE(list_price, 0), 2),
    dimensions_length = ROUND(COALESCE(dimensions_length, 0), 2),
    dimensions_width = ROUND(COALESCE(dimensions_width, 0), 2),
    dimensions_height = ROUND(COALESCE(dimensions_height, 0), 2)
WHERE 
    cost_price IS NOT NULL OR 
    list_price IS NOT NULL OR 
    dimensions_length IS NOT NULL OR 
    dimensions_width IS NOT NULL OR 
    dimensions_height IS NOT NULL;

-- 2. Inventory tablosundaki sayısal verileri temizle (generated columnlar hariç)
UPDATE inventory 
SET 
    quantity = ROUND(COALESCE(quantity, 0), 3),
    available_quantity = ROUND(COALESCE(available_quantity, 0), 3),
    reserved_quantity = ROUND(COALESCE(reserved_quantity, 0), 3),
    damaged_quantity = ROUND(COALESCE(damaged_quantity, 0), 3),
    -- total_quantity generated column olduğu için güncellenmez
    average_cost = ROUND(COALESCE(average_cost, 0), 2),
    last_cost = ROUND(COALESCE(last_cost, 0), 2)
    -- total_value generated column olduğu için güncellenmez
WHERE 
    quantity IS NOT NULL OR 
    available_quantity IS NOT NULL OR 
    reserved_quantity IS NOT NULL OR 
    damaged_quantity IS NOT NULL OR 
    average_cost IS NOT NULL OR 
    last_cost IS NOT NULL;

-- 3. BOM tablosundaki sayısal verileri temizle (generated columnlar hariç)
UPDATE bom 
SET 
    base_cost = ROUND(COALESCE(base_cost, 0), 2),
    labor_cost = ROUND(COALESCE(labor_cost, 0), 2),
    overhead_cost = ROUND(COALESCE(overhead_cost, 0), 2),
    -- total_cost generated column olduğu için güncellenmez
    selling_price = ROUND(COALESCE(selling_price, 0), 2),
    profit_margin = ROUND(COALESCE(profit_margin, 0), 2),
    batch_size = ROUND(COALESCE(batch_size, 0), 3),
    yield_percentage = ROUND(COALESCE(yield_percentage, 0), 2)
WHERE 
    base_cost IS NOT NULL OR 
    labor_cost IS NOT NULL OR 
    overhead_cost IS NOT NULL OR 
    selling_price IS NOT NULL OR 
    profit_margin IS NOT NULL OR 
    batch_size IS NOT NULL OR 
    yield_percentage IS NOT NULL;

-- 4. BOM Items tablosundaki sayısal verileri temizle (generated columnlar hariç)
UPDATE bom_items 
SET 
    quantity = ROUND(COALESCE(quantity, 0), 3),
    unit_cost = ROUND(COALESCE(unit_cost, 0), 2),
    -- total_cost generated column olduğu için güncellenmez
    efficiency_percentage = ROUND(COALESCE(efficiency_percentage, 0), 2),
    scrap_percentage = ROUND(COALESCE(scrap_percentage, 0), 2)
WHERE 
    quantity IS NOT NULL OR 
    unit_cost IS NOT NULL OR 
    efficiency_percentage IS NOT NULL OR 
    scrap_percentage IS NOT NULL;

-- 5. Negatif değerleri kontrol et ve düzelt
-- Miktar alanları negatif olamaz
UPDATE inventory 
SET 
    quantity = ABS(quantity),
    available_quantity = ABS(available_quantity),
    reserved_quantity = ABS(reserved_quantity),
    damaged_quantity = ABS(damaged_quantity)
WHERE 
    quantity < 0 OR 
    available_quantity < 0 OR 
    reserved_quantity < 0 OR 
    damaged_quantity < 0;

-- BOM items miktarları negatif olamaz
UPDATE bom_items 
SET quantity = ABS(quantity)
WHERE quantity < 0;

-- 6. Yüzde değerlerini 0-100 arasında sınırla
UPDATE bom 
SET 
    profit_margin = CASE 
        WHEN profit_margin > 100 THEN 100 
        WHEN profit_margin < 0 THEN 0 
        ELSE profit_margin 
    END,
    yield_percentage = CASE 
        WHEN yield_percentage > 100 THEN 100 
        WHEN yield_percentage < 0 THEN 0 
        ELSE yield_percentage 
    END
WHERE 
    profit_margin > 100 OR profit_margin < 0 OR 
    yield_percentage > 100 OR yield_percentage < 0;

UPDATE bom_items 
SET 
    efficiency_percentage = CASE 
        WHEN efficiency_percentage > 100 THEN 100 
        WHEN efficiency_percentage < 0 THEN 0 
        ELSE efficiency_percentage 
    END,
    scrap_percentage = CASE 
        WHEN scrap_percentage > 100 THEN 100 
        WHEN scrap_percentage < 0 THEN 0 
        ELSE scrap_percentage 
    END
WHERE 
    efficiency_percentage > 100 OR efficiency_percentage < 0 OR 
    scrap_percentage > 100 OR scrap_percentage < 0;

-- 7. Sonuçları kontrol et
SELECT 'Products' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN cost_price > 0 THEN 1 END) as records_with_cost,
       COUNT(CASE WHEN list_price > 0 THEN 1 END) as records_with_price
FROM products
UNION ALL
SELECT 'Inventory' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN quantity > 0 THEN 1 END) as records_with_quantity,
       COUNT(CASE WHEN total_value > 0 THEN 1 END) as records_with_value
FROM inventory
UNION ALL
SELECT 'BOM' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN total_cost > 0 THEN 1 END) as records_with_cost,
       COUNT(CASE WHEN profit_margin > 0 THEN 1 END) as records_with_margin
FROM bom
UNION ALL
SELECT 'BOM Items' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN quantity > 0 THEN 1 END) as records_with_quantity,
       COUNT(CASE WHEN total_cost > 0 THEN 1 END) as records_with_cost
FROM bom_items;

-- 8. Temizlenen verilerin örneklerini göster
SELECT 'Products Sample' as info, cost_price, list_price FROM products WHERE cost_price > 0 LIMIT 3;
SELECT 'Inventory Sample' as info, quantity, average_cost, total_value FROM inventory WHERE quantity > 0 LIMIT 3;
SELECT 'BOM Sample' as info, base_cost, profit_margin, total_cost FROM bom LIMIT 3;

-- Temizleme işlemi tamamlandı!
SELECT 'Veritabanı sayısal verileri başarıyla temizlendi ve standardize edildi!' as result;
SELECT 'Generated columnlar (total_cost, total_value, total_quantity) otomatik hesaplanır.' as note;