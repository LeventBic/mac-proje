const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth: authenticateToken } = require('../middleware/auth');

// Tüm ürün tiplerini listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;

        let whereCondition = '';
        if (active_only === 'true') {
            whereCondition = 'WHERE is_active = TRUE';
        }

        const queryText = `
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

        const result = await query(queryText);
        const productTypes = result.rows;

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

        const result = await query(
            'SELECT * FROM product_types WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
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
router.post('/', authenticateToken, async (req, res) => {
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
        const existingName = await query(
            'SELECT id FROM product_types WHERE name = $1 AND is_active = TRUE',
            [name]
        );

        if (existingName.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu ürün tipi adı zaten kullanılıyor'
            });
        }

        const result = await query(`
            INSERT INTO product_types (name, description)
            VALUES ($1, $2) RETURNING *
        `, [name, description]);

        const newProductType = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Ürün tipi başarıyla eklendi',
            data: newProductType
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
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        // Ürün tipi var mı kontrol et
        const existing = await query(
            'SELECT id FROM product_types WHERE id = $1',
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        // Ürün tipi adı benzersizlik kontrolü (kendi ID'si hariç)
        if (name) {
            const existingName = await query(
                'SELECT id FROM product_types WHERE name = $1 AND id != $2 AND is_active = TRUE',
                [name, id]
            );

            if (existingName.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu ürün tipi adı zaten kullanılıyor'
                });
            }
        }

        await query(`
            UPDATE product_types SET
                name = COALESCE($1, name),
            description = $2,
            is_active = COALESCE($3, is_active),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [name, description, is_active, id]);

        // Güncellenmiş ürün tipini getir
        const updatedProductType = await query(
            'SELECT * FROM product_types WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Ürün tipi başarıyla güncellendi',
            data: updatedProductType.rows[0]
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
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Ürün tipi var mı kontrol et
        const existing = await query(
            'SELECT id, name FROM product_types WHERE id = $1',
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün tipi bulunamadı'
            });
        }

        // Soft delete
        await query(
            'UPDATE product_types SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: `${existing.rows[0].name} ürün tipi başarıyla silindi`
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