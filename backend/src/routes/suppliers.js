const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');

// Tüm tedarikçileri listele
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', active_only = 'true' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];
        let queryParams = [];

        // Aktif tedarikçi filtresi
        if (active_only === 'true') {
            whereConditions.push('is_active = TRUE');
        }

        // Arama filtresi
        if (search) {
            whereConditions.push('(name LIKE ? OR supplier_code LIKE ? OR contact_person LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                id,
                uuid,
                supplier_code,
                name,
                contact_person,
                email,
                phone,
                address,
                city,
                country,
                tax_number,
                payment_terms,
                currency,
                rating,
                is_active,
                notes,
                created_at,
                updated_at
            FROM suppliers
            WHERE ${whereClause}
            ORDER BY name ASC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [suppliers] = await db.pool.execute(query, queryParams);

        // Count sorgusu
        const countQuery = `SELECT COUNT(*) as total FROM suppliers WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams.slice(0, -2));

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                suppliers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Tedarikçi listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tek tedarikçi getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.execute(
            'SELECT * FROM suppliers WHERE id = ?',
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Tedarikçi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Yeni tedarikçi ekle
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const {
            supplier_code,
            name,
            contact_person,
            email,
            phone,
            address,
            city,
            country,
            tax_number,
            payment_terms = 30,
            currency = 'TRY',
            rating = 0,
            notes
        } = req.body;

        // Validasyon
        if (!supplier_code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Tedarikçi kodu ve adı zorunludur'
            });
        }

        // Tedarikçi kodu benzersizlik kontrolü
        const [existingCode] = await db.pool.execute(
            'SELECT id FROM suppliers WHERE supplier_code = ?',
            [supplier_code]
        );

        if (existingCode.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu tedarikçi kodu zaten kullanılıyor'
            });
        }

        const [result] = await db.pool.execute(`
            INSERT INTO suppliers (
                supplier_code, name, contact_person, email, phone, address,
                city, country, tax_number, payment_terms, currency, rating, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            supplier_code, name, contact_person, email, phone, address,
            city, country, tax_number, payment_terms, currency, rating, notes
        ]);

        // Yeni eklenen tedarikçiyi getir
        const [newSupplier] = await db.pool.execute(
            'SELECT * FROM suppliers WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Tedarikçi başarıyla eklendi',
            data: newSupplier[0]
        });

    } catch (error) {
        console.error('Tedarikçi ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tedarikçi güncelle
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            supplier_code,
            name,
            contact_person,
            email,
            phone,
            address,
            city,
            country,
            tax_number,
            payment_terms,
            currency,
            rating,
            notes,
            is_active
        } = req.body;

        // Tedarikçi var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id FROM suppliers WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        // Tedarikçi kodu benzersizlik kontrolü (kendi ID'si hariç)
        if (supplier_code) {
            const [existingCode] = await db.pool.execute(
                'SELECT id FROM suppliers WHERE supplier_code = ? AND id != ?',
                [supplier_code, id]
            );

            if (existingCode.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu tedarikçi kodu zaten kullanılıyor'
                });
            }
        }

        await db.pool.execute(`
            UPDATE suppliers SET
                supplier_code = COALESCE(?, supplier_code),
                name = COALESCE(?, name),
                contact_person = ?,
                email = ?,
                phone = ?,
                address = ?,
                city = ?,
                country = ?,
                tax_number = ?,
                payment_terms = COALESCE(?, payment_terms),
                currency = COALESCE(?, currency),
                rating = COALESCE(?, rating),
                notes = ?,
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            supplier_code, name, contact_person, email, phone, address,
            city, country, tax_number, payment_terms, currency, rating,
            notes, is_active, id
        ]);

        // Güncellenmiş tedarikçiyi getir
        const [updatedSupplier] = await db.pool.execute(
            'SELECT * FROM suppliers WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Tedarikçi başarıyla güncellendi',
            data: updatedSupplier[0]
        });

    } catch (error) {
        console.error('Tedarikçi güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Tedarikçi sil (soft delete)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Tedarikçi var mı kontrol et
        const [existing] = await db.pool.execute(
            'SELECT id, name FROM suppliers WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        // Bu tedarikçiye bağlı ürün var mı kontrol et
        const [connectedProducts] = await db.pool.execute(
            'SELECT COUNT(*) as count FROM products WHERE supplier_id = ? AND is_active = TRUE',
            [id]
        );

        if (connectedProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu tedarikçiye bağlı aktif ürünler bulunuyor. Önce ürünleri güncelleyin.'
            });
        }

        // Soft delete
        await db.pool.execute(
            'UPDATE suppliers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: `${existing[0].name} tedarikçisi başarıyla silindi`
        });

    } catch (error) {
        console.error('Tedarikçi silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router; 