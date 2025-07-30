const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm depo taramalarını listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, location = '', scan_type = '', date_from = '', date_to = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (location) {
            whereConditions.push('ss.location = ?');
            queryParams.push(location);
        }

        if (scan_type) {
            whereConditions.push('ss.scan_type = ?');
            queryParams.push(scan_type);
        }

        if (date_from) {
            whereConditions.push('DATE(ss.scan_date) >= ?');
            queryParams.push(date_from);
        }

        if (date_to) {
            whereConditions.push('DATE(ss.scan_date) <= ?');
            queryParams.push(date_to);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                ss.id,
                ss.uuid,
                ss.scan_type,
                ss.location,
                ss.barcode,
                ss.quantity_found,
                ss.expected_quantity,
                ss.variance_quantity,
                ss.scan_date,
                ss.notes,
                ss.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                u.first_name,
                u.last_name
            FROM stockroom_scans ss
            LEFT JOIN products p ON ss.product_id = p.id
            LEFT JOIN users u ON ss.scanned_by = u.id
            WHERE ${whereClause}
            ORDER BY ss.scan_date DESC, ss.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [scans] = await db.pool.execute(query, queryParams);

        // Count sorgusu
        const countQuery = `SELECT COUNT(*) as total FROM stockroom_scans ss WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                scans,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Depo tarama listesi getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Yeni tarama kaydet
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { 
            scan_type, 
            location, 
            barcode, 
            product_id, 
            quantity_found, 
            expected_quantity = 0, 
            notes 
        } = req.body;

        if (!scan_type || !location || !barcode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tarama türü, lokasyon ve barkod zorunludur' 
            });
        }

        const variance_quantity = quantity_found - expected_quantity;

        const [result] = await db.pool.execute(`
            INSERT INTO stockroom_scans (
                scan_type, location, barcode, product_id, quantity_found, 
                expected_quantity, variance_quantity, scan_date, notes, scanned_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            scan_type, location, barcode, product_id, quantity_found, 
            expected_quantity, variance_quantity, notes, req.user.id
        ]);

        res.status(201).json({ 
            success: true, 
            message: 'Tarama kaydedildi', 
            data: { id: result.insertId } 
        });
    } catch (error) {
        console.error('Tarama kaydetme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Tarama detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.pool.execute(`
            SELECT 
                ss.*,
                p.name as product_name,
                p.sku,
                p.unit,
                u.first_name,
                u.last_name
            FROM stockroom_scans ss
            LEFT JOIN products p ON ss.product_id = p.id
            LEFT JOIN users u ON ss.scanned_by = u.id
            WHERE ss.id = ?
        `, [id]);

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Tarama bulunamadı' });
        }

        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('Tarama detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Barkod ile ürün ara
router.get('/lookup/:barcode', authenticateToken, async (req, res) => {
    try {
        const { barcode } = req.params;
        const { location = '' } = req.query;

        // Ürünü bul
        const [products] = await db.pool.execute(`
            SELECT id, name, sku, barcode, unit, unit_price
            FROM products 
            WHERE barcode = ? AND is_active = TRUE
        `, [barcode]);

        if (products.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Barkod bulunamadı',
                data: { barcode }
            });
        }

        const product = products[0];

        // Stok bilgisini al
        let stockInfo = null;
        if (location) {
            const [inventory] = await db.pool.execute(`
                SELECT available_quantity, location
                FROM inventory 
                WHERE product_id = ? AND location = ?
            `, [product.id, location]);

            if (inventory.length > 0) {
                stockInfo = inventory[0];
            }
        }

        res.json({ 
            success: true, 
            data: {
                product,
                stock: stockInfo,
                expected_quantity: stockInfo ? stockInfo.available_quantity : 0
            }
        });
    } catch (error) {
        console.error('Barkod arama hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Tarama güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity_found, notes } = req.body;

        if (quantity_found === undefined) {
            return res.status(400).json({ success: false, message: 'Bulunan miktar zorunludur' });
        }

        // Mevcut kayıt
        const [existing] = await db.pool.execute('SELECT * FROM stockroom_scans WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Tarama bulunamadı' });
        }

        const variance_quantity = quantity_found - existing[0].expected_quantity;

        await db.pool.execute(`
            UPDATE stockroom_scans 
            SET quantity_found = ?, variance_quantity = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [quantity_found, variance_quantity, notes, id]);

        res.json({ success: true, message: 'Tarama güncellendi' });
    } catch (error) {
        console.error('Tarama güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Toplu tarama (çoklu barkod)
router.post('/bulk', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { scans, scan_type, location } = req.body;
        
        if (!Array.isArray(scans) || scans.length === 0) {
            return res.status(400).json({ success: false, message: 'Tarama verileri gerekli' });
        }

        const results = [];
        
        for (const scan of scans) {
            const { barcode, quantity_found, expected_quantity = 0, notes = '' } = scan;
            
            // Ürünü bul
            const [products] = await connection.execute(`
                SELECT id FROM products WHERE barcode = ? AND is_active = TRUE
            `, [barcode]);
            
            const product_id = products.length > 0 ? products[0].id : null;
            const variance_quantity = quantity_found - expected_quantity;
            
            const [result] = await connection.execute(`
                INSERT INTO stockroom_scans (
                    scan_type, location, barcode, product_id, quantity_found, 
                    expected_quantity, variance_quantity, scan_date, notes, scanned_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
            `, [
                scan_type, location, barcode, product_id, quantity_found,
                expected_quantity, variance_quantity, notes, req.user.id
            ]);
            
            results.push({
                barcode,
                scan_id: result.insertId,
                product_found: !!product_id,
                variance: variance_quantity
            });
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            message: `${results.length} tarama kaydedildi`,
            data: results
        });
    } catch (error) {
        await connection.rollback();
        console.error('Toplu tarama hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    } finally {
        connection.release();
    }
});

// Lokasyon istatistikleri
router.get('/stats/:location', authenticateToken, async (req, res) => {
    try {
        const { location } = req.params;
        const { date_from = '', date_to = '' } = req.query;

        let dateCondition = '1=1';
        let queryParams = [location];

        if (date_from && date_to) {
            dateCondition = 'DATE(scan_date) BETWEEN ? AND ?';
            queryParams.push(date_from, date_to);
        }

        const [stats] = await db.pool.execute(`
            SELECT 
                COUNT(*) as total_scans,
                COUNT(DISTINCT barcode) as unique_items,
                SUM(CASE WHEN variance_quantity = 0 THEN 1 ELSE 0 END) as accurate_scans,
                SUM(CASE WHEN variance_quantity != 0 THEN 1 ELSE 0 END) as discrepancy_scans,
                AVG(ABS(variance_quantity)) as avg_variance
            FROM stockroom_scans 
            WHERE location = ? AND ${dateCondition}
        `, queryParams);

        res.json({ success: true, data: stats[0] });
    } catch (error) {
        console.error('Lokasyon istatistik hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

// Tarama sil
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.pool.execute('DELETE FROM stockroom_scans WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Tarama bulunamadı' });
        }

        res.json({ success: true, message: 'Tarama silindi' });
    } catch (error) {
        console.error('Tarama silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router; 