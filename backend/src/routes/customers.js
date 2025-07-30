const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm müşterileri listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', is_active = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (search) {
            whereConditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (is_active) {
            whereConditions.push('c.is_active = ?');
            queryParams.push(is_active === 'true');
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                c.*,
                COUNT(DISTINCT so.id) as total_orders,
                SUM(so.total_with_tax) as total_spent
            FROM customers c
            LEFT JOIN sales_orders so ON c.id = so.customer_id
            WHERE ${whereClause}
            GROUP BY c.id
            ORDER BY c.name
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const [customers] = await db.pool.execute(query, queryParams);

        const countQuery = `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        res.json({
            success: true,
            data: {
                customers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total / limit),
                    totalItems: countResult[0].total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Müşteri listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni müşteri ekle
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { 
            name, 
            contact_person, 
            email, 
            phone, 
            address, 
            tax_number, 
            tax_office,
            credit_limit,
            payment_terms,
            notes 
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Müşteri adı ve e-posta zorunludur' 
            });
        }

        const [result] = await db.pool.execute(`
            INSERT INTO customers (
                name, contact_person, email, phone, address, 
                tax_number, tax_office, credit_limit, payment_terms, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, contact_person, email, phone, address,
            tax_number, tax_office, credit_limit || 0, payment_terms || 30, notes
        ]);

        res.status(201).json({ 
            success: true, 
            message: 'Müşteri eklendi', 
            data: { id: result.insertId } 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kullanılıyor' });
        }
        console.error('Müşteri ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Müşteri detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [customerResult] = await db.pool.execute(`
            SELECT * FROM customers WHERE id = ?
        `, [id]);

        if (customerResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
        }

        // Son siparişleri getir
        const [orders] = await db.pool.execute(`
            SELECT order_number, order_date, status, total_with_tax
            FROM sales_orders 
            WHERE customer_id = ?
            ORDER BY order_date DESC
            LIMIT 10
        `, [id]);

        const customer = customerResult[0];
        customer.recent_orders = orders;

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Müşteri detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Müşteri güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            contact_person, 
            email, 
            phone, 
            address, 
            tax_number, 
            tax_office,
            credit_limit,
            payment_terms,
            notes,
            is_active 
        } = req.body;

        await db.pool.execute(`
            UPDATE customers 
            SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?,
                tax_number = ?, tax_office = ?, credit_limit = ?, payment_terms = ?,
                notes = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            name, contact_person, email, phone, address,
            tax_number, tax_office, credit_limit, payment_terms,
            notes, is_active, id
        ]);

        res.json({ success: true, message: 'Müşteri güncellendi' });
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Müşteri sil
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Siparişi olan müşteri silinemez
        const [orders] = await db.pool.execute('SELECT COUNT(*) as count FROM sales_orders WHERE customer_id = ?', [id]);
        if (orders[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Siparişi olan müşteri silinemez. Önce müşteriyi pasif hale getirin.' 
            });
        }

        await db.pool.execute('DELETE FROM customers WHERE id = ?', [id]);

        res.json({ success: true, message: 'Müşteri silindi' });
    } catch (error) {
        console.error('Müşteri silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router; 