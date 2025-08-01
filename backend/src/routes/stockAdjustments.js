const express = require('express')
const router = express.Router()
const { query } = require('../config/database')
const {
  requireAuth: authenticateToken,
  requireRole
} = require('../middleware/auth')

// Tüm stok düzeltmelerini listele
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      product_id = '',
      adjustment_type = '',
      user_id = ''
    } = req.query
    const offset = (page - 1) * limit

    const whereConditions = ['sm.movement_type = "adjustment"']
    const queryParams = []

    // Ürün filtresi
    if (product_id) {
      whereConditions.push('sm.product_id = ?')
      queryParams.push(product_id)
    }

    // Düzeltme tipi filtresi (artış/azalış)
    if (adjustment_type) {
      if (adjustment_type === 'increase') {
        whereConditions.push('sm.quantity > 0')
      } else if (adjustment_type === 'decrease') {
        whereConditions.push('sm.quantity < 0')
      }
    }

    // Kullanıcı filtresi
    if (user_id) {
      whereConditions.push(`sm.created_by = $${queryParams.length + 1}`)
      queryParams.push(user_id)
    }

    const whereClause = whereConditions.join(' AND ')

    const queryText = `
            SELECT 
                sm.id,
                sm.uuid,
                sm.product_id,
                sm.quantity,
                sm.unit_cost,
                sm.notes,
                sm.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                p.barcode,
                p.location,
                pc.name as category_name,
                u.first_name,
                u.last_name,
                CASE 
                    WHEN sm.quantity > 0 THEN 'increase'
                    ELSE 'decrease'
                END as adjustment_type,
                ABS(sm.quantity) as adjusted_quantity
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE ${whereClause}
            ORDER BY sm.created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `

    queryParams.push(parseInt(limit), parseInt(offset))

    const adjustmentsResult = await query(queryText, queryParams)
    const adjustments = adjustmentsResult.rows

    // Count sorgusu
    const countQuery = `
            SELECT COUNT(*) as total
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            WHERE ${whereClause}
        `

    const countResult = await query(countQuery, queryParams.slice(0, -2))

    const total = countResult.rows[0].total
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        adjustments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Stok düzeltme listesi getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Yeni stok düzeltmesi oluştur
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'operator']),
  async (req, res) => {
    try {
      const {
        product_id,
        adjustment_type, // 'increase', 'decrease'
        quantity,
        reason,
        unit_cost,
        notes
      } = req.body

      // Validasyon
      if (!product_id || !adjustment_type || !quantity || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Ürün, düzeltme tipi, miktar ve sebep zorunludur'
        })
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Düzeltme miktarı pozitif olmalıdır'
        })
      }

      if (!['increase', 'decrease'].includes(adjustment_type)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz düzeltme tipi'
        })
      }

      // Ürün var mı kontrol et
      const productResult = await query(
        'SELECT id, name, unit FROM products WHERE id = $1 AND is_active = TRUE',
        [product_id]
      )

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı'
        })
      }
      const product = productResult.rows[0]

      // Azalış durumunda yeterli stok var mı kontrol et
      if (adjustment_type === 'decrease') {
        const currentStockResult = await query(
          "SELECT available_quantity FROM inventory WHERE product_id = $1 AND location = 'MAIN'",
          [product_id]
        )

        const availableQuantity =
          currentStockResult.rows.length > 0
            ? currentStockResult.rows[0].available_quantity
            : 0

        if (availableQuantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Yetersiz stok. Mevcut: ${availableQuantity} ${product.unit}, Düzeltilecek: ${quantity} ${product.unit}`
          })
        }
      }

      // Düzeltme numarası oluştur
      const adjustmentNumber = `ADJ-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 4)
        .toUpperCase()}`

      // Stok hareketini kaydet (artış için pozitif, azalış için negatif miktar)
      const movementQuantity =
        adjustment_type === 'increase' ? quantity : -quantity

      await query(
        `
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, unit_cost, reference_type,
                location_to, notes, created_by
            ) VALUES ($1, 'adjustment', $2, $3, 'adjustment', 'MAIN', $4, $5)
        `,
        [
          product_id,
          movementQuantity,
          unit_cost || null,
          `${adjustmentNumber} - ${reason}: ${
            notes || 'Manuel stok düzeltmesi'
          }`,
          req.user.id
        ]
      )

      // Yeni oluşturulan düzeltmeyi getir
      const newAdjustmentResult = await query(
        `
            SELECT 
                sm.id,
                sm.uuid,
                sm.product_id,
                sm.quantity,
                sm.unit_cost,
                sm.notes,
                sm.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                CASE 
                    WHEN sm.quantity > 0 THEN 'increase'
                    ELSE 'decrease'
                END as adjustment_type,
                ABS(sm.quantity) as adjusted_quantity
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            WHERE sm.product_id = $1 AND sm.created_by = $2 AND sm.notes LIKE $3
            ORDER BY sm.created_at DESC
            LIMIT 1
        `,
        [product_id, req.user.id, `%${adjustmentNumber}%`]
      )

      res.status(201).json({
        success: true,
        message: 'Stok düzeltmesi başarıyla oluşturuldu',
        data: newAdjustmentResult.rows[0]
      })
    } catch (error) {
      console.error('Stok düzeltme oluşturma hatası:', error)
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message
      })
    }
  }
)

// Düzeltme detayını getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await query(
      `
            SELECT 
                sm.id,
                sm.uuid,
                sm.product_id,
                sm.quantity,
                sm.unit_cost,
                sm.notes,
                sm.created_at,
                p.name as product_name,
                p.sku,
                p.unit,
                p.barcode,
                p.location,
                pc.name as category_name,
                u.first_name,
                u.last_name,
                CASE 
                    WHEN sm.quantity > 0 THEN 'increase'
                    ELSE 'decrease'
                END as adjustment_type,
                ABS(sm.quantity) as adjusted_quantity
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE sm.id = ? AND sm.movement_type = 'adjustment'
        `,
      [id]
    )

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stok düzeltmesi bulunamadı'
      })
    }

    res.json({
      success: true,
      data: result[0]
    })
  } catch (error) {
    console.error('Stok düzeltme detayı getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Düzeltme sebeplerini getir (önceden tanımlanmış)
router.get('/reasons/list', authenticateToken, async (req, res) => {
  try {
    const reasons = [
      {
        code: 'damage',
        name: 'Hasar/Arıza',
        description: 'Ürün hasarı veya arızası nedeniyle',
        type: 'decrease'
      },
      {
        code: 'loss',
        name: 'Kayıp/Çalınma',
        description: 'Ürün kaybı veya çalınma',
        type: 'decrease'
      },
      {
        code: 'expired',
        name: 'Son Kullanma Tarihi',
        description: 'Son kullanma tarihi geçmiş ürünler',
        type: 'decrease'
      },
      {
        code: 'quality',
        name: 'Kalite Problemi',
        description: 'Kalite kontrolden geçmeyen ürünler',
        type: 'decrease'
      },
      {
        code: 'counting_error',
        name: 'Sayım Hatası',
        description: 'Stok sayımında tespit edilen hata',
        type: 'both'
      },
      {
        code: 'found',
        name: 'Bulunan Ürün',
        description: 'Önceden kayıtlarda olmayan bulunan ürün',
        type: 'increase'
      },
      {
        code: 'return',
        name: 'İade/Geri Dönüş',
        description: 'Müşteri iadesi veya geri dönen ürün',
        type: 'increase'
      },
      {
        code: 'production_waste',
        name: 'Üretim Fire',
        description: 'Üretim sürecindeki fire',
        type: 'decrease'
      },
      {
        code: 'sample',
        name: 'Numune/Test',
        description: 'Numune veya test amaçlı kullanım',
        type: 'decrease'
      },
      {
        code: 'other',
        name: 'Diğer',
        description: 'Diğer sebepler',
        type: 'both'
      }
    ]

    res.json({
      success: true,
      data: reasons
    })
  } catch (error) {
    console.error('Düzeltme sebepleri getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Düzeltme istatistiklerini getir
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query

    let dateFilter = ''
    let queryParams = []

    if (start_date && end_date) {
      dateFilter = 'AND sm.created_at BETWEEN ? AND ?'
      queryParams = [start_date, end_date]
    } else {
      // Son 30 gün
      dateFilter = 'AND sm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    }

    const statsResult = await query(
      `
            SELECT 
                COUNT(*) as total_adjustments,
                COUNT(CASE WHEN sm.quantity > 0 THEN 1 END) as increase_count,
                COUNT(CASE WHEN sm.quantity < 0 THEN 1 END) as decrease_count,
                SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END) as total_increased,
                SUM(CASE WHEN sm.quantity < 0 THEN ABS(sm.quantity) ELSE 0 END) as total_decreased,
                SUM(CASE WHEN sm.quantity > 0 THEN (sm.quantity * COALESCE(sm.unit_cost, 0)) ELSE 0 END) as value_increased,
                SUM(CASE WHEN sm.quantity < 0 THEN (ABS(sm.quantity) * COALESCE(sm.unit_cost, 0)) ELSE 0 END) as value_decreased
            FROM stock_movements sm
            WHERE sm.movement_type = 'adjustment' ${dateFilter}
        `,
      queryParams
    )

    // En çok düzeltme yapılan ürünler
    const topProductsResult = await query(
      `
            SELECT 
                p.name as product_name,
                p.sku,
                COUNT(sm.id) as adjustment_count,
                SUM(ABS(sm.quantity)) as total_quantity_adjusted
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            WHERE sm.movement_type = 'adjustment' ${dateFilter}
            GROUP BY sm.product_id, p.name, p.sku
            ORDER BY adjustment_count DESC
            LIMIT 5
        `,
      queryParams
    )

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        top_adjusted_products: topProductsResult.rows
      }
    })
  } catch (error) {
    console.error('Düzeltme istatistikleri getirme hatası:', error)
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    })
  }
})

// Toplu stok düzeltmesi (CSV/Excel import için)
router.post(
  '/bulk',
  authenticateToken,
  requireRole(['admin', 'operator']),
  async (req, res) => {
    const connection = await require('../config/database').pool.getConnection()

    try {
      await connection.beginTransaction()

      const { adjustments } = req.body // [{ product_id, adjustment_type, quantity, reason, notes }]

      if (
        !adjustments ||
        !Array.isArray(adjustments) ||
        adjustments.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'En az bir düzeltme kaydı gereklidir'
        })
      }

      const results = []
      const errors = []

      for (let i = 0; i < adjustments.length; i++) {
        const adjustment = adjustments[i]

        try {
          // Her düzeltme için validasyon
          if (
            !adjustment.product_id ||
            !adjustment.adjustment_type ||
            !adjustment.quantity ||
            !adjustment.reason
          ) {
            errors.push(`Satır ${i + 1}: Eksik bilgi`)
            continue
          }

          // Ürün kontrolü
          const [product] = await connection.execute(
            'SELECT id, name, unit FROM products WHERE id = ? AND is_active = TRUE',
            [adjustment.product_id]
          )

          if (product.length === 0) {
            errors.push(
              `Satır ${i + 1}: Ürün bulunamadı (ID: ${adjustment.product_id})`
            )
            continue
          }

          // Azalış için stok kontrolü
          if (adjustment.adjustment_type === 'decrease') {
            const [currentStock] = await connection.execute(
              'SELECT available_quantity FROM inventory WHERE product_id = ? AND location = "MAIN"',
              [adjustment.product_id]
            )

            const availableQuantity =
              currentStock.length > 0 ? currentStock[0].available_quantity : 0

            if (availableQuantity < adjustment.quantity) {
              errors.push(`Satır ${i + 1}: Yetersiz stok (${product[0].name})`)
              continue
            }
          }

          // Düzeltme kaydı oluştur
          const adjustmentNumber = `BULK-ADJ-${Date.now()}-${i}`
          const movementQuantity =
            adjustment.adjustment_type === 'increase'
              ? adjustment.quantity
              : -adjustment.quantity

          await connection.execute(
            `
                    INSERT INTO stock_movements (
                        product_id, movement_type, quantity, unit_cost, reference_type,
                        location_to, notes, created_by
                    ) VALUES (?, 'adjustment', ?, ?, 'adjustment', 'MAIN', ?, ?)
                `,
            [
              adjustment.product_id,
              movementQuantity,
              adjustment.unit_cost || null,
              `${adjustmentNumber} - ${adjustment.reason}: ${
                adjustment.notes || 'Toplu stok düzeltmesi'
              }`,
              req.user.id
            ]
          )

          results.push({
            product_id: adjustment.product_id,
            product_name: product[0].name,
            adjustment_type: adjustment.adjustment_type,
            quantity: adjustment.quantity,
            status: 'success'
          })
        } catch (error) {
          errors.push(`Satır ${i + 1}: ${error.message}`)
        }
      }

      await connection.commit()

      res.json({
        success: true,
        message: `${results.length} düzeltme başarıyla işlendi`,
        data: {
          successful_adjustments: results.length,
          total_adjustments: adjustments.length,
          errors,
          results
        }
      })
    } catch (error) {
      await connection.rollback()
      console.error('Toplu stok düzeltme hatası:', error)
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message
      })
    } finally {
      connection.release()
    }
  }
)

module.exports = router
