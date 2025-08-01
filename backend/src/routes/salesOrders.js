const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm satış siparişlerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', customer_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push(`so.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        if (customer_id) {
            whereConditions.push(`so.customer_id = $${queryParams.length + 1}`);
            queryParams.push(customer_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const queryText = `
            SELECT 
                so.id,
                so.order_number,
                so.customer_id,
                so.order_date,
                so.delivery_date,
                so.status,
                so.total_amount,
                so.tax_amount,
                so.total_with_tax,
                so.created_at,
                c.name as customer_name,
                c.contact_person,
                u.first_name,
                u.last_name,
                COUNT(soi.id) as item_count
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            LEFT JOIN users u ON so.created_by = u.id
            LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
            WHERE ${whereClause}
            GROUP BY so.id
            ORDER BY so.order_date DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const ordersResult = await query(queryText, queryParams);
        const orders = ordersResult.rows;

        const countQuery = `SELECT COUNT(DISTINCT so.id) as total FROM sales_orders so WHERE ${whereClause}`;
        const countResult = await query(countQuery, queryParams.slice(0, -2));

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult.rows[0].total / limit),
                    totalItems: countResult.rows[0].total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Satış siparişi listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni satış siparişi oluştur
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { customer_id, order_date, delivery_date, notes, items } = req.body;

        if (!customer_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Müşteri, sipariş tarihi ve ürün listesi zorunludur' 
            });
        }

        const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * item.unit_price);
        }

        const taxAmount = totalAmount * 0.18;
        const totalWithTax = totalAmount + taxAmount;

        const [orderResult] = await connection.execute(`
            INSERT INTO sales_orders (
                order_number, customer_id, order_date, delivery_date, 
                status, total_amount, tax_amount, total_with_tax, notes, created_by
            )
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9) RETURNING id
        `, [orderNumber, customer_id, order_date, delivery_date, totalAmount, taxAmount, totalWithTax, notes, req.user.id]);

        const salesOrderId = orderResult.insertId;

        for (const item of items) {
            await connection.execute(`
                INSERT INTO sales_order_items (
                    sales_order_id, product_id, quantity, unit_price, total_price
                )
                VALUES ($1, $2, $3, $4, $5)
            `, [salesOrderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
        }

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Satış siparişi oluşturuldu', 
            data: { id: salesOrderId, order_number: orderNumber } 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Satış siparişi oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Sipariş detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [orderResult] = await db.pool.execute(`
            SELECT so.*, c.name as customer_name, c.email, c.phone, c.address
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.id = $1
        `, [id]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        const [items] = await db.pool.execute(`
            SELECT soi.*, p.name as product_name, p.sku, p.unit
            FROM sales_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.sales_order_id = $1
        `, [id]);

        const order = orderResult[0];
        order.items = items;

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sipariş durumunu güncelle
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum' });
        }

        await db.pool.execute(`
            UPDATE sales_orders 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
        `, [status, id]);

        res.json({ success: true, message: 'Sipariş durumu güncellendi' });
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;