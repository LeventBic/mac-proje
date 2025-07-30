const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm satın alma tekliflerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', supplier_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push('pq.status = ?');
            queryParams.push(status);
        }

        if (supplier_id) {
            whereConditions.push('pq.supplier_id = ?');
            queryParams.push(supplier_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                pq.id,
                pq.quote_number,
                pq.supplier_id,
                pq.request_date,
                pq.due_date,
                pq.status,
                pq.total_amount,
                pq.notes,
                pq.created_at,
                s.name as supplier_name,
                s.contact_person,
                u.first_name,
                u.last_name,
                COUNT(pqi.id) as item_count
            FROM purchase_quotes pq
            LEFT JOIN suppliers s ON pq.supplier_id = s.id
            LEFT JOIN users u ON pq.created_by = u.id
            LEFT JOIN purchase_quote_items pqi ON pq.id = pqi.purchase_quote_id
            WHERE ${whereClause}
            GROUP BY pq.id
            ORDER BY pq.request_date DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const [quotes] = await db.pool.execute(query, queryParams);

        const countQuery = `SELECT COUNT(DISTINCT pq.id) as total FROM purchase_quotes pq WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        res.json({
            success: true,
            data: {
                quotes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total / limit),
                    totalItems: countResult[0].total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Teklif listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni teklif talebi oluştur
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { supplier_id, request_date, due_date, notes, items } = req.body;

        if (!supplier_id || !request_date || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tedarikçi, tarih ve ürün listesi zorunludur' 
            });
        }

        const quoteNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        const [quoteResult] = await connection.execute(`
            INSERT INTO purchase_quotes (
                quote_number, supplier_id, request_date, due_date, 
                status, notes, created_by
            )
            VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `, [quoteNumber, supplier_id, request_date, due_date, notes, req.user.id]);

        const quoteId = quoteResult.insertId;

        for (const item of items) {
            await connection.execute(`
                INSERT INTO purchase_quote_items (
                    purchase_quote_id, product_id, quantity, requested_price
                )
                VALUES (?, ?, ?, ?)
            `, [quoteId, item.product_id, item.quantity, item.requested_price || 0]);
        }

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Teklif talebi oluşturuldu', 
            data: { id: quoteId, quote_number: quoteNumber } 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Teklif oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Teklif detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [quoteResult] = await db.pool.execute(`
            SELECT pq.*, s.name as supplier_name, s.email, s.phone
            FROM purchase_quotes pq
            LEFT JOIN suppliers s ON pq.supplier_id = s.id
            WHERE pq.id = ?
        `, [id]);

        if (quoteResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Teklif bulunamadı' });
        }

        const [items] = await db.pool.execute(`
            SELECT pqi.*, p.name as product_name, p.sku, p.unit
            FROM purchase_quote_items pqi
            LEFT JOIN products p ON pqi.product_id = p.id
            WHERE pqi.purchase_quote_id = ?
        `, [id]);

        const quote = quoteResult[0];
        quote.items = items;

        res.json({ success: true, data: quote });
    } catch (error) {
        console.error('Teklif detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Teklif güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { supplier_id, request_date, due_date, notes, items } = req.body;

        await connection.execute(`
            UPDATE purchase_quotes 
            SET supplier_id = ?, request_date = ?, due_date = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [supplier_id, request_date, due_date, notes, id]);

        if (items && Array.isArray(items)) {
            await connection.execute('DELETE FROM purchase_quote_items WHERE purchase_quote_id = ?', [id]);
            
            for (const item of items) {
                await connection.execute(`
                    INSERT INTO purchase_quote_items (
                        purchase_quote_id, product_id, quantity, requested_price, quoted_price
                    )
                    VALUES (?, ?, ?, ?, ?)
                `, [id, item.product_id, item.quantity, item.requested_price || 0, item.quoted_price || 0]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Teklif güncellendi' });
    } catch (error) {
        await connection.rollback();
        console.error('Teklif güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Teklif durumunu güncelle
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'sent', 'received', 'accepted', 'rejected', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Geçersiz durum' });
        }

        await db.pool.execute(`
            UPDATE purchase_quotes 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        `, [status, id]);

        res.json({ success: true, message: 'Teklif durumu güncellendi' });
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Teklifi siparişe çevir
router.post('/:id/convert-to-order', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Teklif bilgilerini getir
        const [quote] = await connection.execute('SELECT * FROM purchase_quotes WHERE id = ?', [id]);
        if (quote.length === 0) {
            return res.status(404).json({ success: false, message: 'Teklif bulunamadı' });
        }

        if (quote[0].status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Sadece kabul edilmiş teklifler siparişe çevrilebilir' });
        }

        // Teklif kalemlerini getir
        const [items] = await connection.execute('SELECT * FROM purchase_quote_items WHERE purchase_quote_id = ?', [id]);

        // PO numarası oluştur
        const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Toplam tutarı hesapla
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity * (item.quoted_price || item.requested_price));
        }

        const taxAmount = totalAmount * 0.18;
        const totalWithTax = totalAmount + taxAmount;

        // Satın alma siparişi oluştur
        const [poResult] = await connection.execute(`
            INSERT INTO purchase_orders (
                po_number, supplier_id, order_date, required_date, 
                status, total_amount, tax_amount, total_with_tax, notes, created_by
            )
            VALUES (?, ?, NOW(), ?, 'draft', ?, ?, ?, ?, ?)
        `, [
            poNumber, quote[0].supplier_id, quote[0].due_date,
            totalAmount, taxAmount, totalWithTax, quote[0].notes, req.user.id
        ]);

        const purchaseOrderId = poResult.insertId;

        // Sipariş kalemlerini ekle
        for (const item of items) {
            const unitPrice = item.quoted_price || item.requested_price;
            await connection.execute(`
                INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, unit_price, total_price
                )
                VALUES (?, ?, ?, ?, ?)
            `, [purchaseOrderId, item.product_id, item.quantity, unitPrice, item.quantity * unitPrice]);
        }

        // Teklif durumunu güncelle
        await connection.execute('UPDATE purchase_quotes SET status = ? WHERE id = ?', ['converted', id]);

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Teklif siparişe çevrildi',
            data: { purchase_order_id: purchaseOrderId, po_number: poNumber }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Siparişe çevirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router; 