const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm stok transferlerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', location_from = '', location_to = '', product_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['st.movement_type = "transfer"'];
        let queryParams = [];

        // Status filtresi
        if (status) {
            switch (status) {
                case 'pending':
                    whereConditions.push('st.notes NOT LIKE "%completed%"');
                    break;
                case 'completed':
                    whereConditions.push('st.notes LIKE "%completed%"');
                    break;
            }
        }

        // Lokasyon filtreleri
        if (location_from) {
            whereConditions.push('st.location_from LIKE ?');
            queryParams.push(`%${location_from}%`);
        }

        if (location_to) {
            whereConditions.push(`st.location_to ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${location_to}%`);
        }

        // Ürün filtresi
        if (product_id) {
            whereConditions.push(`st.product_id = $${queryParams.length + 1}`);
            queryParams.push(product_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const queryText = `
            SELECT 
                st.id,
                st.uuid,
                st.product_id,
                st.quantity,
                st.location_from,
                st.location_to,
                st.notes,
                st.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                p.barcode,
                pc.name as category_name,
                u.first_name,
                u.last_name,
                CASE 
                    WHEN st.notes LIKE '%completed%' THEN 'completed'
                    ELSE 'pending'
                END as status
            FROM stock_movements st
            LEFT JOIN products p ON st.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN users u ON st.created_by = u.id
            WHERE ${whereClause}
            ORDER BY st.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const transfersResult = await query(queryText, queryParams);
        const transfers = transfersResult.rows;

        // Count sorgusu
        const countQuery = `
            SELECT COUNT(*) as total
            FROM stock_movements st
            LEFT JOIN products p ON st.product_id = p.id
            WHERE ${whereClause}
        `;

        const countResult = await query(countQuery, queryParams.slice(0, -2));

        const total = countResult.rows[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                transfers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Stok transfer listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Yeni stok transferi oluştur
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { product_id, quantity, location_from, location_to, notes } = req.body;

        // Validasyon
        if (!product_id || !quantity || !location_from || !location_to) {
            return res.status(400).json({
                success: false,
                message: 'Ürün, miktar ve lokasyon bilgileri zorunludur'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Transfer miktarı pozitif olmalıdır'
            });
        }

        if (location_from === location_to) {
            return res.status(400).json({
                success: false,
                message: 'Kaynak ve hedef lokasyon aynı olamaz'
            });
        }

        // Ürün var mı kontrol et
        const [product] = await connection.execute(
            'SELECT id, name, unit FROM products WHERE id = ? AND is_active = TRUE',
            [product_id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        // Kaynak lokasyonda yeterli stok var mı kontrol et
        const [sourceStock] = await connection.execute(
            'SELECT available_quantity FROM inventory WHERE product_id = ? AND location = ?',
            [product_id, location_from]
        );

        const availableQuantity = sourceStock.length > 0 ? sourceStock[0].available_quantity : 0;

        if (availableQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Yetersiz stok. ${location_from} lokasyonunda mevcut: ${availableQuantity} ${product[0].unit}`
            });
        }

        // Transfer numarası oluştur
        const transferNumber = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Çıkış hareketi (Kaynak lokasyondan çıkış)
        await connection.execute(`
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, location_from, location_to,
                reference_type, notes, created_by
            ) VALUES (?, 'transfer', ?, ?, ?, 'transfer', ?, ?)
        `, [
            product_id, 
            quantity, 
            location_from, 
            location_to,
            `Transfer: ${transferNumber} - ${notes || 'Stok transferi'}`,
            req.user.id
        ]);

        // Kaynak lokasyon stoğunu güncelle (azalt)
        await connection.execute(`
            UPDATE inventory 
            SET available_quantity = available_quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ? AND location = ?
        `, [quantity, product_id, location_from]);

        // Hedef lokasyon stoğunu güncelle (artır) veya oluştur
        await connection.execute(`
            INSERT INTO inventory (product_id, location, available_quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                available_quantity = available_quantity + VALUES(available_quantity),
                updated_at = CURRENT_TIMESTAMP
        `, [product_id, location_to, quantity]);

        await connection.commit();

        // Transfer detaylarını getir
        const [newTransfer] = await connection.execute(`
            SELECT 
                st.id,
                st.uuid,
                st.product_id,
                st.quantity,
                st.location_from,
                st.location_to,
                st.notes,
                st.created_at,
                p.name as product_name,
                p.sku,
                p.unit
            FROM stock_movements st
            LEFT JOIN products p ON st.product_id = p.id
            WHERE st.product_id = ? AND st.created_by = ? AND st.notes LIKE ?
            ORDER BY st.created_at DESC
            LIMIT 1
        `, [product_id, req.user.id, `%${transferNumber}%`]);

        res.status(201).json({
            success: true,
            message: 'Stok transferi başarıyla oluşturuldu',
            data: newTransfer[0]
        });

    } catch (error) {
        await connection.rollback();
        console.error('Stok transfer oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Transfer durumunu güncelle (tamamla/iptal et)
router.put('/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { status, notes } = req.body; // 'completed', 'cancelled'

        // Transfer var mı kontrol et
        const [existingTransfer] = await connection.execute(`
            SELECT st.*, p.name as product_name
            FROM stock_movements st
            LEFT JOIN products p ON st.product_id = p.id
            WHERE st.id = ? AND st.movement_type = 'transfer'
        `, [id]);

        if (existingTransfer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transfer bulunamadı'
            });
        }

        const transfer = existingTransfer[0];

        // Zaten tamamlanmış veya iptal edilmiş mi kontrol et
        if (transfer.notes && (transfer.notes.includes('completed') || transfer.notes.includes('cancelled'))) {
            return res.status(400).json({
                success: false,
                message: 'Bu transfer zaten işlem görmüş'
            });
        }

        let updatedNotes = transfer.notes || '';

        if (status === 'completed') {
            updatedNotes += ` - Transfer tamamlandı: ${new Date().toLocaleString('tr-TR')}`;
            if (notes) updatedNotes += ` - ${notes}`;
        } else if (status === 'cancelled') {
            updatedNotes += ` - Transfer iptal edildi: ${new Date().toLocaleString('tr-TR')}`;
            if (notes) updatedNotes += ` - İptal nedeni: ${notes}`;

            // İptal durumunda stok hareketini geri al
            // Kaynak lokasyona geri ekle
            await connection.execute(`
                UPDATE inventory 
                SET available_quantity = available_quantity + ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ? AND location = ?
            `, [transfer.quantity, transfer.product_id, transfer.location_from]);

            // Hedef lokasyondan düş
            await connection.execute(`
                UPDATE inventory 
                SET available_quantity = available_quantity - ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ? AND location = ?
            `, [transfer.quantity, transfer.product_id, transfer.location_to]);
        }

        // Transfer notunu güncelle
        await connection.execute(`
            UPDATE stock_movements 
            SET notes = ?
            WHERE id = ?
        `, [updatedNotes, id]);

        await connection.commit();

        res.json({
            success: true,
            message: status === 'completed' ? 'Transfer tamamlandı' : 'Transfer iptal edildi'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Transfer durum güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Transfer detayını getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.execute(`
            SELECT 
                st.id,
                st.uuid,
                st.product_id,
                st.quantity,
                st.location_from,
                st.location_to,
                st.notes,
                st.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                p.barcode,
                pc.name as category_name,
                u.first_name,
                u.last_name,
                CASE 
                    WHEN st.notes LIKE '%completed%' THEN 'completed'
                    WHEN st.notes LIKE '%cancelled%' THEN 'cancelled'
                    ELSE 'pending'
                END as status
            FROM stock_movements st
            LEFT JOIN products p ON st.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN users u ON st.created_by = u.id
            WHERE st.id = ? AND st.movement_type = 'transfer'
        `, [id]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transfer bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Transfer detayı getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Lokasyonları listele
router.get('/locations/list', authenticateToken, async (req, res) => {
    try {
        const [locations] = await db.pool.execute(`
            SELECT DISTINCT location as name, COUNT(*) as product_count
            FROM inventory 
            WHERE available_quantity > 0
            GROUP BY location
            ORDER BY location ASC
        `);

        // Varsayılan lokasyonları ekle
        const defaultLocations = ['MAIN', 'WAREHOUSE-A', 'WAREHOUSE-B', 'PRODUCTION', 'QUALITY-CHECK', 'SHIPPING'];
        
        const allLocations = [...new Set([
            ...defaultLocations,
            ...locations.map(l => l.name)
        ])].map(name => {
            const existing = locations.find(l => l.name === name);
            return {
                name,
                product_count: existing ? existing.product_count : 0
            };
        });

        res.json({
            success: true,
            data: allLocations
        });

    } catch (error) {
        console.error('Lokasyon listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Ürünlerin lokasyon bazlı stok durumu
router.get('/products/stock-by-location', authenticateToken, async (req, res) => {
    try {
        const { product_id } = req.query;

        let whereCondition = 'i.available_quantity > 0';
        let queryParams = [];

        if (product_id) {
            whereCondition += ' AND i.product_id = ?';
            queryParams.push(product_id);
        }

        const [stockByLocation] = await db.pool.execute(`
            SELECT 
                i.product_id,
                i.location,
                i.available_quantity,
                p.name as product_name,
                p.sku,
                p.unit
            FROM inventory i
            LEFT JOIN products p ON i.product_id = p.id
            WHERE ${whereCondition}
            ORDER BY p.name ASC, i.location ASC
        `, queryParams);

        res.json({
            success: true,
            data: stockByLocation
        });

    } catch (error) {
        console.error('Lokasyon bazlı stok getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;