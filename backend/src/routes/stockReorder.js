const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Yeniden sipariş edilmesi gereken ürünleri listele
router.get('/needed', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', supplier_id = '', category_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['p.is_active = TRUE', 'p.reorder_point > 0', 'i.available_quantity <= p.reorder_point'];
        let queryParams = [];

        // Arama filtresi
        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Tedarikçi filtresi
        if (supplier_id) {
            whereConditions.push('p.supplier_id = ?');
            queryParams.push(supplier_id);
        }

        // Kategori filtresi
        if (category_id) {
            whereConditions.push('p.category_id = ?');
            queryParams.push(category_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                p.id,
                p.uuid,
                p.sku,
                p.name,
                p.description,
                p.unit,
                p.location,
                p.min_stock_level,
                p.reorder_point,
                p.reorder_quantity,
                p.lead_time_days,
                p.cost_price,
                p.unit_price,
                COALESCE(i.available_quantity, 0) as current_stock,
                (p.reorder_point - COALESCE(i.available_quantity, 0)) as shortage_quantity,
                p.reorder_quantity as suggested_quantity,
                (p.reorder_quantity * p.cost_price) as estimated_cost,
                pc.name as category_name,
                s.name as supplier_name,
                s.supplier_code,
                s.contact_person as supplier_contact,
                s.phone as supplier_phone,
                s.email as supplier_email,
                s.payment_terms,
                s.currency,
                CASE 
                    WHEN COALESCE(i.available_quantity, 0) = 0 THEN 'critical'
                    WHEN COALESCE(i.available_quantity, 0) <= (p.reorder_point * 0.5) THEN 'urgent'
                    ELSE 'normal'
                END as priority,
                DATE_ADD(CURDATE(), INTERVAL COALESCE(p.lead_time_days, 7) DAY) as expected_delivery,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE ${whereClause}
            ORDER BY 
                CASE 
                    WHEN COALESCE(i.available_quantity, 0) = 0 THEN 1
                    WHEN COALESCE(i.available_quantity, 0) <= (p.reorder_point * 0.5) THEN 2
                    ELSE 3
                END,
                (p.reorder_point - COALESCE(i.available_quantity, 0)) DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        // Count sorgusu
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE ${whereClause}
        `;

        const [reorderItems] = await db.pool.execute(query, queryParams);
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Özet istatistikler
        const [statsResult] = await db.pool.execute(`
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN COALESCE(i.available_quantity, 0) = 0 THEN 1 END) as critical_items,
                COUNT(CASE WHEN COALESCE(i.available_quantity, 0) <= (p.reorder_point * 0.5) AND COALESCE(i.available_quantity, 0) > 0 THEN 1 END) as urgent_items,
                SUM(p.reorder_quantity * p.cost_price) as total_estimated_cost
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
            WHERE p.is_active = TRUE 
              AND p.reorder_point > 0 
              AND i.available_quantity <= p.reorder_point
        `);

        res.json({
            success: true,
            data: {
                items: reorderItems,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                stats: statsResult[0]
            }
        });

    } catch (error) {
        console.error('Yeniden sipariş listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Toplu sipariş önerisi oluştur
router.post('/create-orders', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { items } = req.body; // [{ product_id, quantity, supplier_id }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'En az bir ürün seçilmelidir'
            });
        }

        // Tedarikçilere göre grupla
        const supplierGroups = {};
        for (const item of items) {
            const supplierId = item.supplier_id || 'no_supplier';
            if (!supplierGroups[supplierId]) {
                supplierGroups[supplierId] = [];
            }
            supplierGroups[supplierId].push(item);
        }

        const createdOrders = [];

        // Her tedarikçi için ayrı sipariş oluştur
        for (const [supplierId, supplierItems] of Object.entries(supplierGroups)) {
            // Sipariş numarası oluştur
            const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            
            let totalAmount = 0;
            
            // Toplam tutarı hesapla
            for (const item of supplierItems) {
                const [productResult] = await connection.execute(
                    'SELECT cost_price FROM products WHERE id = ?',
                    [item.product_id]
                );
                
                if (productResult.length > 0) {
                    totalAmount += (productResult[0].cost_price || 0) * item.quantity;
                }
            }

            // Sipariş kaydı oluştur (purchase_orders tablosu yoksa basit log tutalım)
            const [orderResult] = await connection.execute(`
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, reference_type, 
                    supplier_id, notes, created_by, created_at
                ) VALUES (?, 'in', 0, 'purchase', ?, ?, ?, NOW())
            `, [
                supplierItems[0].product_id,
                supplierId === 'no_supplier' ? null : supplierId,
                `Toplu sipariş: ${orderNumber} - ${supplierItems.length} ürün`,
                req.user.id
            ]);

            // Her ürün için sipariş kaydı
            for (const item of supplierItems) {
                await connection.execute(`
                    INSERT INTO stock_movements (
                        product_id, movement_type, quantity, reference_type, 
                        supplier_id, notes, created_by, created_at
                    ) VALUES (?, 'in', ?, 'purchase', ?, ?, ?, NOW())
                `, [
                    item.product_id,
                    item.quantity,
                    supplierId === 'no_supplier' ? null : supplierId,
                    `Sipariş: ${orderNumber}`,
                    req.user.id
                ]);
            }

            createdOrders.push({
                orderNumber,
                supplierId: supplierId === 'no_supplier' ? null : supplierId,
                itemCount: supplierItems.length,
                totalAmount
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: `${createdOrders.length} adet sipariş başarıyla oluşturuldu`,
            data: {
                orders: createdOrders
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Toplu sipariş oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Ürünün yeniden sipariş ayarlarını güncelle
router.put('/settings/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reorder_point, reorder_quantity, lead_time_days } = req.body;

        // Ürün var mı kontrol et
        const [existingProduct] = await db.pool.execute(
            'SELECT id, name FROM products WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        // Ayarları güncelle
        await db.pool.execute(`
            UPDATE products SET
                reorder_point = COALESCE(?, reorder_point),
                reorder_quantity = COALESCE(?, reorder_quantity),
                lead_time_days = COALESCE(?, lead_time_days),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [reorder_point, reorder_quantity, lead_time_days, id]);

        // Güncellenmiş ürünü getir
        const [updatedProduct] = await db.pool.execute(`
            SELECT 
                p.*,
                COALESCE(i.available_quantity, 0) as current_stock
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
            WHERE p.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Yeniden sipariş ayarları başarıyla güncellendi',
            data: updatedProduct[0]
        });

    } catch (error) {
        console.error('Yeniden sipariş ayarları güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Sipariş geçmişi
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, product_id } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ["sm.reference_type = 'purchase'", "sm.movement_type = 'in'"];
        let queryParams = [];

        if (product_id) {
            whereConditions.push('sm.product_id = ?');
            queryParams.push(product_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                sm.id,
                sm.uuid,
                sm.quantity,
                sm.unit_cost,
                sm.notes,
                sm.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                s.name as supplier_name,
                s.supplier_code,
                u.first_name,
                u.last_name
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            LEFT JOIN suppliers s ON sm.supplier_id = s.id
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE ${whereClause}
            ORDER BY sm.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [history] = await db.pool.execute(query, queryParams);

        // Count sorgusu
        const countQuery = `
            SELECT COUNT(*) as total
            FROM stock_movements sm
            WHERE ${whereClause}
        `;

        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Sipariş geçmişi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tedarikçiler listesi (dropdown için)
router.get('/suppliers', authenticateToken, async (req, res) => {
    try {
        const [suppliers] = await db.pool.execute(`
            SELECT id, name, supplier_code, contact_person, phone, email
            FROM suppliers 
            WHERE is_active = TRUE 
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            data: suppliers
        });

    } catch (error) {
        console.error('Tedarikçi listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router; 