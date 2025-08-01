const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm satış tekliflerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', customer_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push(`sq.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        if (customer_id) {
            whereConditions.push(`sq.customer_id = $${queryParams.length + 1}`);
            queryParams.push(customer_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const queryText = `
            SELECT 
                sq.id,
                sq.quote_number,
                sq.customer_id,
                sq.quote_date,
                sq.valid_until,
                sq.status,
                sq.total_amount,
                sq.created_at,
                c.name as customer_name,
                c.contact_person,
                u.first_name,
                u.last_name,
                COUNT(sqi.id) as item_count
            FROM sales_quotes sq
            LEFT JOIN customers c ON sq.customer_id = c.id
            LEFT JOIN users u ON sq.created_by = u.id
            LEFT JOIN sales_quote_items sqi ON sq.id = sqi.sales_quote_id
            WHERE ${whereClause}
            GROUP BY sq.id
            ORDER BY sq.quote_date DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const quotesResult = await query(queryText, queryParams);
        const quotes = quotesResult.rows;

        const countQuery = `SELECT COUNT(DISTINCT sq.id) as total FROM sales_quotes sq WHERE ${whereClause}`;
        const countResult = await query(countQuery, queryParams.slice(0, -2));

        res.json({
            success: true,
            data: {
                quotes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult.rows[0].total / limit),
                    totalItems: countResult.rows[0].total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Satış teklifi listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni satış teklifi oluştur
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { customer_id, quote_date, valid_until, notes, items } = req.body;

        if (!customer_id || !quote_date || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Müşteri, teklif tarihi ve ürün listesi zorunludur' 
            });
        }

        const quoteNumber = `SQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * item.unit_price);
        }

        const quoteResult = await query(`
            INSERT INTO sales_quotes (
                quote_number, customer_id, quote_date, valid_until, 
                status, total_amount, notes, created_by
            )
            VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7) RETURNING id
        `, [quoteNumber, customer_id, quote_date, valid_until, totalAmount, notes, req.user.id]);

        const salesQuoteId = quoteResult.rows[0].id;

        for (const item of items) {
            await query(`
                INSERT INTO sales_quote_items (
                    sales_quote_id, product_id, quantity, unit_price, total_price
                )
                VALUES ($1, $2, $3, $4, $5)
            `, [salesQuoteId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
        }

        res.status(201).json({ 
            success: true, 
            message: 'Satış teklifi oluşturuldu',
            data: { id: salesQuoteId, quote_number: quoteNumber }
        });
    } catch (error) {
        console.error('Satış teklifi oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Teklif durumunu güncelle
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum' });
        }

        await query(`
            UPDATE sales_quotes 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
        `, [status, id]);

        res.json({ success: true, message: 'Teklif durumu güncellendi' });
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;