const express = require('express')
const router = express.Router()
const { query } = require('../config/database')
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth')

// Tüm kategorileri listele
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active_only: activeOnly = 'true' } = req.query

    let whereCondition = ''
    if (activeOnly === 'true') {
      whereCondition = 'WHERE is_active = TRUE'
    }

    const queryText = `
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
        `

    const categoriesResult = await query(queryText)
    const categories = categoriesResult.rows

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Kategori listesi getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Tek kategori getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT * FROM product_categories WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Kategori getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Yeni kategori ekle
router.post('/', authenticateToken, requireRole('admin', 'operator'), async (req, res) => {
  try {
    const { name, description, parent_id: parentId } = req.body

    // Validasyon
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kategori adı zorunludur'
      })
    }

    // Kategori adı benzersizlik kontrolü
    const existingNameResult = await query(
      'SELECT id FROM product_categories WHERE name = $1 AND is_active = TRUE',
      [name]
    )

    if (existingNameResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategori adı zaten kullanılıyor'
      })
    }

    // Kategori kodu oluştur (name'den türetilmiş)
    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) || 'CAT'

    const result = await query(`
            INSERT INTO product_categories (name, description, parent_id, code)
            VALUES ($1, $2, $3, $4) RETURNING id
        `, [name, description, parentId, code])

    // Yeni eklenen kategoriyi getir
    const newCategoryResult = await query(
      'SELECT * FROM product_categories WHERE id = $1',
      [result.rows[0].id]
    )
    const newCategory = newCategoryResult.rows[0]

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla eklendi',
      data: newCategory
    })
  } catch (error) {
    console.error('Kategori ekleme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Kategori güncelle
router.put('/:id', authenticateToken, requireRole('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, parent_id: parentId, is_active: isActive } = req.body

    // Kategori var mı kontrol et
    const existingResult = await query(
      'SELECT id FROM product_categories WHERE id = $1',
      [id]
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      })
    }

    // Kategori adı benzersizlik kontrolü (kendi ID'si hariç)
    if (name) {
      const existingNameResult = await query(
        'SELECT id FROM product_categories WHERE name = $1 AND id != $2 AND is_active = TRUE',
        [name, id]
      )

      if (existingNameResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu kategori adı zaten kullanılıyor'
        })
      }
    }

    await query(`
            UPDATE product_categories SET
                name = COALESCE($1, name),
            description = $2,
            parent_id = $3,
            is_active = COALESCE($4, is_active),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [name, description, parentId, isActive, id])

    // Güncellenmiş kategoriyi getir
    const updatedCategoryResult = await query(
      'SELECT * FROM product_categories WHERE id = $1',
      [id]
    )

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategoryResult.rows[0]
    })
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Kategori sil (soft delete)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params

    // Kategori var mı kontrol et
    const existingResult = await query(
      'SELECT id, name FROM product_categories WHERE id = $1',
      [id]
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      })
    }

    const existing = existingResult.rows[0]

    // Soft delete
    await query(
      'UPDATE product_categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    )

    res.json({
      success: true,
      message: `${existing.name} kategorisi başarıyla silindi`
    })
  } catch (error) {
    console.error('Kategori silme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

module.exports = router