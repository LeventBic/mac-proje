const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm satın alma siparişlerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', supplier_id = '', date_from = '', date_to = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push('po.status = ?');
            queryParams.push(status);
        }

        if (supplier_id) {
            whereConditions.push('po.supplier_id = ?');
            queryParams.push(supplier_id);
        }

        if (date_from) {
            whereConditions.push('DATE(po.order_date) >= ?');
            queryParams.push(date_from);
        }

        if (date_to) {
            whereConditions.push('DATE(po.order_date) <= ?');
            queryParams.push(date_to);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                po.id,
                po.uuid,
                po.po_number,
                po.supplier_id,
                po.order_date,
                po.required_date,
                po.delivery_date,
                po.status,
                po.total_amount,
                po.tax_amount,
                po.total_with_tax,
                po.notes,
                po.created_at,
                po.updated_at,
                s.name as supplier_name,
                s.contact_person,
                s.phone,
                u.first_name,
                u.last_name,
                COUNT(poi.id) as item_count
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE ${whereClause}
            GROUP BY po.id
            ORDER BY po.order_date DESC, po.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [orders] = await db.pool.execute(query, queryParams);

        // Count sorgusu
        const countQuery = `SELECT COUNT(DISTINCT po.id) as total FROM purchase_orders po WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Satın alma siparişi listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni satın alma siparişi oluştur
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { 
            supplier_id, 
            order_date, 
            required_date, 
            notes, 
            items 
        } = req.body;

        if (!supplier_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tedarikçi, sipariş tarihi ve ürün listesi zorunludur' 
            });
        }

        // PO numarası oluştur
        const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Toplam tutarları hesapla
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * item.unit_price);
        }

        const taxAmount = totalAmount * 0.18; // %18 KDV
        const totalWithTax = totalAmount + taxAmount;

        // Satın alma siparişi oluştur
        const [poResult] = await connection.execute(`
            INSERT INTO purchase_orders (
                po_number, supplier_id, order_date, required_date, 
                status, total_amount, tax_amount, total_with_tax, notes, created_by
            )
            VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
        `, [
            poNumber, supplier_id, order_date, required_date,
            totalAmount, taxAmount, totalWithTax, notes, req.user.id
        ]);

        const purchaseOrderId = poResult.insertId;

        // Sipariş kalemlerini ekle
        for (const item of items) {
            await connection.execute(`
                INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, unit_price, total_price
                )
                VALUES (?, ?, ?, ?, ?)
            `, [
                purchaseOrderId, item.product_id, item.quantity, 
                item.unit_price, item.quantity * item.unit_price
            ]);
        }

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Satın alma siparişi oluşturuldu', 
            data: { 
                id: purchaseOrderId, 
                po_number: poNumber,
                total_with_tax: totalWithTax
            } 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Satın alma siparişi oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Satın alma siparişi detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Sipariş bilgileri
        const [orderResult] = await db.pool.execute(`
            SELECT 
                po.*,
                s.name as supplier_name,
                s.contact_person,
                s.phone,
                s.email,
                s.address,
                u.first_name,
                u.last_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.id = ?
        `, [id]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        // Sipariş kalemleri
        const [items] = await db.pool.execute(`
            SELECT 
                poi.*,
                p.name as product_name,
                p.sku,
                p.unit,
                p.description
            FROM purchase_order_items poi
            LEFT JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
            ORDER BY poi.id
        `, [id]);

        const order = orderResult[0];
        order.items = items;

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Satın alma siparişini güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { 
            supplier_id, 
            order_date, 
            required_date, 
            delivery_date,
            notes, 
            items 
        } = req.body;

        // Mevcut siparişi kontrol et
        const [existing] = await connection.execute('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        if (existing[0].status === 'completed' || existing[0].status === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: 'Tamamlanmış veya iptal edilmiş sipariş güncellenemez' 
            });
        }

        // Toplam tutarları yeniden hesapla
        let totalAmount = 0;
        if (items && Array.isArray(items)) {
            for (const item of items) {
                totalAmount += (item.quantity * item.unit_price);
            }
        }

        const taxAmount = totalAmount * 0.18;
        const totalWithTax = totalAmount + taxAmount;

        // Siparişi güncelle
        await connection.execute(`
            UPDATE purchase_orders 
            SET supplier_id = ?, order_date = ?, required_date = ?, delivery_date = ?,
                total_amount = ?, tax_amount = ?, total_with_tax = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            supplier_id, order_date, required_date, delivery_date,
            totalAmount, taxAmount, totalWithTax, notes, id
        ]);

        // Mevcut kalemleri sil ve yenilerini ekle
        if (items && Array.isArray(items)) {
            await connection.execute('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
            
            for (const item of items) {
                await connection.execute(`
                    INSERT INTO purchase_order_items (
                        purchase_order_id, product_id, quantity, unit_price, total_price
                    )
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    id, item.product_id, item.quantity, 
                    item.unit_price, item.quantity * item.unit_price
                ]);
            }
        }

        await connection.commit();

        res.json({ success: true, message: 'Sipariş güncellendi' });
    } catch (error) {
        await connection.rollback();
        console.error('Sipariş güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Sipariş durumunu güncelle
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'pending', 'approved', 'ordered', 'partial', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum' });
        }

        const [result] = await db.pool.execute(`
            UPDATE purchase_orders 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        `, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        res.json({ success: true, message: 'Sipariş durumu güncellendi' });
    } catch (error) {
        console.error('Sipariş durumu güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sipariş onaylama
router.post('/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.pool.execute(`
            UPDATE purchase_orders 
            SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
            WHERE id = ? AND status = 'pending'
        `, [req.user.id, id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Sipariş bulunamadı veya onaylanabilir durumda değil' 
            });
        }

        res.json({ success: true, message: 'Sipariş onaylandı' });
    } catch (error) {
        console.error('Sipariş onaylama hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Mal kabul
router.post('/:id/receive', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { received_items, delivery_date = new Date().toISOString().split('T')[0] } = req.body;

        if (!Array.isArray(received_items) || received_items.length === 0) {
            return res.status(400).json({ success: false, message: 'Teslim alınan ürün listesi gerekli' });
        }

        // Sipariş bilgilerini getir
        const [order] = await connection.execute('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (order.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        // Her ürün için stok güncelle
        for (const item of received_items) {
            const { product_id, received_quantity } = item;
            
            // Envantere ekle
            await connection.execute(`
                INSERT INTO inventory (product_id, location, available_quantity, updated_at)
                VALUES (?, 'MAIN', ?, NOW())
                ON DUPLICATE KEY UPDATE
                available_quantity = available_quantity + VALUES(available_quantity),
                updated_at = NOW()
            `, [product_id, received_quantity]);
            
            // Sipariş kalemi durumunu güncelle
            await connection.execute(`
                UPDATE purchase_order_items 
                SET received_quantity = COALESCE(received_quantity, 0) + ?, 
                    last_received_date = ?
                WHERE purchase_order_id = ? AND product_id = ?
            `, [received_quantity, delivery_date, id, product_id]);
        }

        // Sipariş durumunu kontrol et ve güncelle
        const [items] = await connection.execute(`
            SELECT 
                SUM(quantity) as total_ordered,
                SUM(COALESCE(received_quantity, 0)) as total_received
            FROM purchase_order_items 
            WHERE purchase_order_id = ?
        `, [id]);

        const { total_ordered, total_received } = items[0];
        let newStatus = 'ordered';
        
        if (total_received >= total_ordered) {
            newStatus = 'completed';
        } else if (total_received > 0) {
            newStatus = 'partial';
        }

        await connection.execute(`
            UPDATE purchase_orders 
            SET status = ?, delivery_date = ?, updated_at = NOW()
            WHERE id = ?
        `, [newStatus, delivery_date, id]);

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Mal kabul işlemi tamamlandı',
            data: { status: newStatus, total_received }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Mal kabul hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Tedarikçiler listesi
router.get('/suppliers/list', authenticateToken, async (req, res) => {
    try {
        const [suppliers] = await db.pool.execute(`
            SELECT id, name, contact_person, phone, email
            FROM suppliers 
            WHERE is_active = TRUE
            ORDER BY name
        `);

        res.json({ success: true, data: suppliers });
    } catch (error) {
        console.error('Tedarikçi listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Ürünler listesi
router.get('/products/list', authenticateToken, async (req, res) => {
    try {
        const { supplier_id = '' } = req.query;
        
        let query = `
            SELECT p.id, p.name, p.sku, p.unit, p.unit_price, p.cost_price
            FROM products p
            WHERE p.is_active = TRUE
        `;
        let queryParams = [];

        if (supplier_id) {
            query += ' AND p.supplier_id = ?';
            queryParams.push(supplier_id);
        }

        query += ' ORDER BY p.name';

        const [products] = await db.pool.execute(query, queryParams);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Ürün listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sipariş sil
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Siparişin durumunu kontrol et
        const [order] = await connection.execute('SELECT status FROM purchase_orders WHERE id = ?', [id]);
        if (order.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        if (order[0].status === 'completed' || order[0].status === 'partial') {
            return res.status(400).json({ 
                success: false, 
                message: 'Tamamlanmış veya kısmen teslim alınmış sipariş silinemez' 
            });
        }

        // Sipariş kalemlerini sil
        await connection.execute('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        
        // Siparişi sil
        await connection.execute('DELETE FROM purchase_orders WHERE id = ?', [id]);

        await connection.commit();

        res.json({ success: true, message: 'Sipariş silindi' });
    } catch (error) {
        await connection.rollback();
        console.error('Sipariş silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router; 