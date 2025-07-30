const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm ürün tiplerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;

        let whereCondition = '';
        if (active_only === 'true') {
            whereCondition = 'WHERE is_active = TRUE';
        }

        const query = `
            SELECT 
                id,
                uuid,
                name,
                description,
                is_active,
                created_at,
                updated_at
            FROM product_types
            ${whereCondition}
            ORDER BY name ASC
        `;

        const [productTypes] = await db.pool.execute(query);

        res.json({
            success: true,
            data: productTypes
        });

    } catch (error) {
        console.error('Ürün tipi listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tek ürün tipi getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.execute(
            'SELECT * FROM product_types WHERE id = ?',
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Ürün tipi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Yeni ürün tipi ekle
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validasyon
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Ürün tipi adı zorunludur'
            });
        }

        // Ürün tipi adı benzersizlik kontrolü
        const [existingName] = await db.pool.execute(
            'SELECT id FROM product_types WHERE name = ? AND is_active = TRUE',
            [name]
        );

        if (existingName.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu ürün tipi adı zaten kullanılıyor'
            });
        }

        const [result] = await db.pool.execute(`
            INSERT INTO product_types (name, description)
            VALUES (?, ?)
        `, [name, description]);

        // Yeni eklenen ürün tipini getir
        const [newProductType] = await db.pool.execute(
            'SELECT * FROM product_types WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Ürün tipi başarıyla eklendi',
            data: newProductType[0]
        });

    } catch (error) {
        console.error('Ürün tipi ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Ürün tipi güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        // Ürün tipi var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id FROM product_types WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        // Ürün tipi adı benzersizlik kontrolü (kendi ID'si hariç)
        if (name) {
            const [existingName] = await db.pool.execute(
                'SELECT id FROM product_types WHERE name = ? AND id != ? AND is_active = TRUE',
                [name, id]
            );

            if (existingName.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu ürün tipi adı zaten kullanılıyor'
                });
            }
        }

        await db.pool.execute(`
            UPDATE product_types SET
                name = COALESCE(?, name),
                description = ?,
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, description, is_active, id]);

        // Güncellenmiş ürün tipini getir
        const [updatedProductType] = await db.pool.execute(
            'SELECT * FROM product_types WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Ürün tipi başarıyla güncellendi',
            data: updatedProductType[0]
        });

    } catch (error) {
        console.error('Ürün tipi güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Ürün tipi sil (soft delete)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Ürün tipi var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id, name FROM product_types WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        // Bu ürün tipine bağlı ürün var mı kontrol et
        const [connectedProducts] = await db.pool.execute(
            'SELECT COUNT(*) as count FROM products WHERE product_type_id = ? AND is_active = TRUE',
            [id]
        );

        if (connectedProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu ürün tipine bağlı aktif ürünler bulunuyor. Önce ürünleri güncelleyin.'
            });
        }

        // Soft delete
        await db.pool.execute(
            'UPDATE product_types SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: `${existing[0].name} ürün tipi başarıyla silindi`
        });

    } catch (error) {
        console.error('Ürün tipi silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router; 