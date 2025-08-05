const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
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
            whereConditions.push(`(name LIKE $${queryParams.length + 1} OR supplier_code LIKE $${queryParams.length + 2} OR contact_person LIKE $${queryParams.length + 3})`);
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        const queryText = `
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
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const suppliersResult = await query(queryText, queryParams);
        const suppliers = suppliersResult.rows;

        // Count sorgusu
        const countQuery = `SELECT COUNT(*) as total FROM suppliers WHERE ${whereClause}`;
        const countResult = await query(countQuery, queryParams.slice(0, -2));

        const total = countResult.rows[0].total;
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

        const result = await query(
            'SELECT * FROM suppliers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
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
        const existingCode = await query(
            'SELECT id FROM suppliers WHERE supplier_code = $1',
            [supplier_code]
        );

        if (existingCode.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu tedarikçi kodu zaten kullanılıyor'
            });
        }

        const result = await query(`
            INSERT INTO suppliers (
                supplier_code, name, contact_person, email, phone, address,
                city, country, tax_number, payment_terms, currency, rating, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
        `, [
            supplier_code, name, contact_person, email, phone, address,
            city, country, tax_number, payment_terms, currency, rating, notes
        ]);

        const newSupplier = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Tedarikçi başarıyla eklendi',
            data: newSupplier
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
        const existing = await query(
            'SELECT id FROM suppliers WHERE id = $1',
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        // Tedarikçi kodu benzersizlik kontrolü (kendi ID'si hariç)
        if (supplier_code) {
            const existingCode = await query(
                'SELECT id FROM suppliers WHERE supplier_code = $1 AND id != $2',
                [supplier_code, id]
            );

            if (existingCode.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu tedarikçi kodu zaten kullanılıyor'
                });
            }
        }

        await query(`
            UPDATE suppliers SET
                supplier_code = COALESCE($1, supplier_code),
            name = COALESCE($2, name),
            contact_person = $3,
            email = $4,
            phone = $5,
            address = $6,
            city = $7,
            country = $8,
            tax_number = $9,
            payment_terms = COALESCE($10, payment_terms),
            currency = COALESCE($11, currency),
            rating = COALESCE($12, rating),
            notes = $13,
            is_active = COALESCE($14, is_active),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $15
        `, [
            supplier_code, name, contact_person, email, phone, address,
            city, country, tax_number, payment_terms, currency, rating,
            notes, is_active, id
        ]);

        // Güncellenmiş tedarikçiyi getir
        const updatedSupplier = await query(
            'SELECT * FROM suppliers WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Tedarikçi başarıyla güncellendi',
            data: updatedSupplier.rows[0]
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
        const existing = await query(
            'SELECT id, name FROM suppliers WHERE id = $1',
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tedarikçi bulunamadı'
            });
        }

        // Soft delete
        await query(
            'UPDATE suppliers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: `${existing.rows[0].name} tedarikçisi başarıyla silindi`
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