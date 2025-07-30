const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm kategorileri listele
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
                parent_id,
                is_active,
                created_at,
                updated_at
            FROM product_categories
            ${whereCondition}
            ORDER BY name ASC
        `;

        const [categories] = await db.pool.execute(query);

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Kategori listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tek kategori getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.execute(
            'SELECT * FROM product_categories WHERE id = ?',
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Kategori getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Yeni kategori ekle
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;

        // Validasyon
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Kategori adı zorunludur'
            });
        }

        // Kategori adı benzersizlik kontrolü
        const [existingName] = await db.pool.execute(
            'SELECT id FROM product_categories WHERE name = ? AND is_active = TRUE',
            [name]
        );

        if (existingName.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu kategori adı zaten kullanılıyor'
            });
        }

        const [result] = await db.pool.execute(`
            INSERT INTO product_categories (name, description, parent_id)
            VALUES (?, ?, ?)
        `, [name, description, parent_id]);

        // Yeni eklenen kategoriyi getir
        const [newCategory] = await db.pool.execute(
            'SELECT * FROM product_categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Kategori başarıyla eklendi',
            data: newCategory[0]
        });

    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Kategori güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent_id, is_active } = req.body;

        // Kategori var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id FROM product_categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        // Kategori adı benzersizlik kontrolü (kendi ID'si hariç)
        if (name) {
            const [existingName] = await db.pool.execute(
                'SELECT id FROM product_categories WHERE name = ? AND id != ? AND is_active = TRUE',
                [name, id]
            );

            if (existingName.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu kategori adı zaten kullanılıyor'
                });
            }
        }

        await db.pool.execute(`
            UPDATE product_categories SET
                name = COALESCE(?, name),
                description = ?,
                parent_id = ?,
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, description, parent_id, is_active, id]);

        // Güncellenmiş kategoriyi getir
        const [updatedCategory] = await db.pool.execute(
            'SELECT * FROM product_categories WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Kategori başarıyla güncellendi',
            data: updatedCategory[0]
        });

    } catch (error) {
        console.error('Kategori güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Kategori sil (soft delete)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Kategori var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id, name FROM product_categories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        // Bu kategoriye bağlı ürün var mı kontrol et
        const [connectedProducts] = await db.pool.execute(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = TRUE',
            [id]
        );

        if (connectedProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu kategoriye bağlı aktif ürünler bulunuyor. Önce ürünleri güncelleyin.'
            });
        }

        // Soft delete
        await db.pool.execute(
            'UPDATE product_categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: `${existing[0].name} kategorisi başarıyla silindi`
        });

    } catch (error) {
        console.error('Kategori silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router; 