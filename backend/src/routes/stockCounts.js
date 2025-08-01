const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm stok sayımlarını listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push(`sc.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        const queryText = `
            SELECT 
                sc.id,
                sc.uuid,
                sc.count_number,
                sc.location,
                sc.status,
                sc.scheduled_date,
                sc.started_at,
                sc.completed_at,
                sc.total_items,
                sc.counted_items,
                sc.discrepancies_found,
                sc.notes,
                sc.created_at,
                sc.updated_at,
                u.first_name,
                u.last_name
            FROM stock_counts sc
            LEFT JOIN users u ON sc.created_by = u.id
            WHERE ${whereClause}
            ORDER BY sc.scheduled_date DESC, sc.created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const countsResult = await query(queryText, queryParams);
        const counts = countsResult.rows;

        // Count sorgusu
        const countQuery = `SELECT COUNT(*) as total FROM stock_counts sc WHERE ${whereClause}`;
        const countResult = await query(countQuery, queryParams.slice(0, -2));

        const total = countResult.rows[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                counts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Stok sayımı listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni stok sayımı başlat
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { location = 'MAIN', scheduled_date, notes } = req.body;
        if (!scheduled_date) {
            return res.status(400).json({ success: false, message: 'Planlanan tarih zorunludur' });
        }
        const countNumber = `COUNT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const result = await query(`
            INSERT INTO stock_counts (count_number, location, scheduled_date, status, notes, created_by)
            VALUES ($1, $2, $3, 'planned', $4, $5) RETURNING id
        `, [countNumber, location, scheduled_date, notes, req.user.id]);
        res.status(201).json({ success: true, message: 'Stok sayımı başlatıldı', data: { id: result.rows[0].id, count_number: countNumber } });
    } catch (error) {
        console.error('Stok sayımı başlatma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayım detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT * FROM stock_counts WHERE id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Sayım detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayım ürünlerini getir
router.get('/:id/items', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT sci.*, p.name as product_name, p.sku, p.unit
            FROM stock_count_items sci
            LEFT JOIN products p ON sci.product_id = p.id
            WHERE sci.stock_count_id = $1
        `, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Sayım ürünleri getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayım ürününü güncelle (sayım yap)
router.put('/:id/items/:itemId', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { counted_quantity, notes } = req.body;
        if (counted_quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Sayım miktarı zorunludur' });
        }
        await query(`
            UPDATE stock_count_items SET counted_quantity = $1, notes = $2, counted_by = $3, counted_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND stock_count_id = $5
        `, [counted_quantity, notes, req.user.id, itemId, id]);
        res.json({ success: true, message: 'Sayım kaydedildi' });
    } catch (error) {
        console.error('Sayım ürünü güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayımı başlat (status: in_progress, ürünleri ekle)
router.post('/:id/start', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        // Sayım var mı kontrol et
        const countResult = await query('SELECT * FROM stock_counts WHERE id = $1', [id]);
        if (countResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        const count = countResult.rows[0];
        // Ürünleri ekle (o lokasyondaki tüm aktif ürünler)
        const productsResult = await query(`
            SELECT p.id as product_id, COALESCE(i.available_quantity, 0) as expected_quantity, p.unit
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = $1
            WHERE p.is_active = TRUE
        `, [count.location]);
        const products = productsResult.rows;
        for (const prod of products) {
            await query(`
                INSERT INTO stock_count_items (stock_count_id, product_id, expected_quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (stock_count_id, product_id) DO UPDATE SET expected_quantity = EXCLUDED.expected_quantity
            `, [id, prod.product_id, prod.expected_quantity]);
        }
        await query(`
            UPDATE stock_counts SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, total_items = $1 WHERE id = $2
        `, [products.length, id]);
        res.json({ success: true, message: 'Sayım başlatıldı', data: { total_items: products.length } });
    } catch (error) {
        console.error('Sayım başlatma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayımı tamamla
router.post('/:id/complete', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        // Sayım var mı kontrol et
        const countResult = await query('SELECT * FROM stock_counts WHERE id = $1', [id]);
        if (countResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        // Farklı ürün sayısı
        const discrepanciesResult = await query(`
            SELECT COUNT(*) as diff_count FROM stock_count_items WHERE stock_count_id = $1 AND variance_quantity != 0
        `, [id]);
        const discrepancies = discrepanciesResult.rows[0];
        // Sayımı tamamla
        await query(`
            UPDATE stock_counts SET status = 'completed', completed_at = CURRENT_TIMESTAMP, discrepancies_found = $1 WHERE id = $2
        `, [discrepancies.diff_count, id]);
        res.json({ success: true, message: 'Sayım tamamlandı', data: { discrepancies: discrepancies.diff_count } });
    } catch (error) {
        console.error('Sayım tamamlama hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;