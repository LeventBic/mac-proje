const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm stok sayımlarını listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push('sc.status = ?');
            queryParams.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
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
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [counts] = await db.pool.execute(query, queryParams);

        // Count sorgusu
        const countQuery = `SELECT COUNT(*) as total FROM stock_counts sc WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
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
        const [result] = await db.pool.execute(`
            INSERT INTO stock_counts (count_number, location, scheduled_date, status, notes, created_by)
            VALUES (?, ?, ?, 'planned', ?, ?)
        `, [countNumber, location, scheduled_date, notes, req.user.id]);
        res.status(201).json({ success: true, message: 'Stok sayımı başlatıldı', data: { id: result.insertId, count_number: countNumber } });
    } catch (error) {
        console.error('Stok sayımı başlatma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayım detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.pool.execute(`
            SELECT * FROM stock_counts WHERE id = ?
        `, [id]);
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('Sayım detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayım ürünlerini getir
router.get('/:id/items', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.pool.execute(`
            SELECT sci.*, p.name as product_name, p.sku, p.unit
            FROM stock_count_items sci
            LEFT JOIN products p ON sci.product_id = p.id
            WHERE sci.stock_count_id = ?
        `, [id]);
        res.json({ success: true, data: items });
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
        await db.pool.execute(`
            UPDATE stock_count_items SET counted_quantity = ?, notes = ?, counted_by = ?, counted_at = NOW()
            WHERE id = ? AND stock_count_id = ?
        `, [counted_quantity, notes, req.user.id, itemId, id]);
        res.json({ success: true, message: 'Sayım kaydedildi' });
    } catch (error) {
        console.error('Sayım ürünü güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Sayımı başlat (status: in_progress, ürünleri ekle)
router.post('/:id/start', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        // Sayım var mı kontrol et
        const [count] = await connection.execute('SELECT * FROM stock_counts WHERE id = ?', [id]);
        if (count.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        // Ürünleri ekle (o lokasyondaki tüm aktif ürünler)
        const [products] = await connection.execute(`
            SELECT p.id as product_id, COALESCE(i.available_quantity, 0) as expected_quantity, p.unit
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.location = ?
            WHERE p.is_active = TRUE
        `, [count[0].location]);
        for (const prod of products) {
            await connection.execute(`
                INSERT INTO stock_count_items (stock_count_id, product_id, expected_quantity)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE expected_quantity = VALUES(expected_quantity)
            `, [id, prod.product_id, prod.expected_quantity]);
        }
        await connection.execute(`
            UPDATE stock_counts SET status = 'in_progress', started_at = NOW(), total_items = ? WHERE id = ?
        `, [products.length, id]);
        await connection.commit();
        res.json({ success: true, message: 'Sayım başlatıldı', data: { total_items: products.length } });
    } catch (error) {
        await connection.rollback();
        console.error('Sayım başlatma hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Sayımı tamamla
router.post('/:id/complete', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        // Sayım var mı kontrol et
        const [count] = await connection.execute('SELECT * FROM stock_counts WHERE id = ?', [id]);
        if (count.length === 0) {
            return res.status(404).json({ success: false, message: 'Sayım bulunamadı' });
        }
        // Farklı ürün sayısı
        const [discrepancies] = await connection.execute(`
            SELECT COUNT(*) as diff_count FROM stock_count_items WHERE stock_count_id = ? AND variance_quantity != 0
        `, [id]);
        // Sayımı tamamla
        await connection.execute(`
            UPDATE stock_counts SET status = 'completed', completed_at = NOW(), discrepancies_found = ? WHERE id = ?
        `, [discrepancies[0].diff_count, id]);
        await connection.commit();
        res.json({ success: true, message: 'Sayım tamamlandı', data: { discrepancies: discrepancies[0].diff_count } });
    } catch (error) {
        await connection.rollback();
        console.error('Sayım tamamlama hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router; 