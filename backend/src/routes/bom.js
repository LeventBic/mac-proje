const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const { query } = require('../config/database')

const router = express.Router()

// Mevcut BOM'ları alt reçete olarak kullanılabilir şekilde listele
router.get(
  '/available-sub-boms',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      const { excludeId } = req.query

      let queryText = `
      SELECT b.id, b.finished_product_id, b.version, b.total_cost,
             p.name as product_name, p.sku as product_sku
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      WHERE b.is_active = TRUE
    `

      const params = []
      if (excludeId) {
        queryText += ' AND b.id != $1'
        params.push(excludeId)
      }

      queryText += ' ORDER BY p.name ASC'

      const bomsResult = await query(queryText, params)
      res.json({ status: 'success', data: bomsResult.rows })
    } catch (err) {
      next(err)
    }
  }
)

// Tüm BOM'ları listele (Product Tree yapısı ile)
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const bomsResult = await query(`
      SELECT b.*, p.name as product_name, p.sku as product_sku, 
             pb.name as parent_product_name, u.username as created_by_username
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      LEFT JOIN bom pb_bom ON b.parent_bom_id = pb_bom.id
      LEFT JOIN products pb ON pb_bom.finished_product_id = pb.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.is_active = TRUE
      ORDER BY b.created_at DESC
    `)
    res.json({ status: 'success', data: bomsResult.rows })
  } catch (err) {
    next(err)
  }
})

// BOM detayını getir (items ile birlikte - Product Tree yapısı)
router.get('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const bomsResult = await query(
      `
      SELECT b.*, p.name as product_name, p.sku as product_sku, 
             pb.name as parent_product_name, u.username as created_by_username
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      LEFT JOIN bom pb_bom ON b.parent_bom_id = pb_bom.id
      LEFT JOIN products pb ON pb_bom.finished_product_id = pb.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = $1 AND b.is_active = TRUE
    `,
      [id]
    )

    if (bomsResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }

    const itemsResult = await query(
      `
      SELECT bi.*, 
             CASE 
               WHEN bi.item_type = 'material' THEN p.name
               WHEN bi.item_type = 'sub_bom' THEN bp.name
             END as item_name,
             CASE 
               WHEN bi.item_type = 'material' THEN p.sku
               WHEN bi.item_type = 'sub_bom' THEN bp.sku
             END as item_sku,
             CASE 
               WHEN bi.item_type = 'material' THEN p.cost_price
               WHEN bi.item_type = 'sub_bom' THEN sb.final_cost
             END as item_cost
      FROM bom_items bi
      LEFT JOIN products p ON bi.raw_material_id = p.id
      LEFT JOIN bom sb ON bi.sub_bom_id = sb.id
      LEFT JOIN products bp ON sb.finished_product_id = bp.id
      WHERE bi.bom_id = $1
      ORDER BY bi.created_at ASC
    `,
      [id]
    )

    res.json({
      status: 'success',
      data: { bom: bomsResult.rows[0], items: itemsResult.rows }
    })
  } catch (err) {
    next(err)
  }
})

// Yeni BOM oluştur (Product Tree yapısı ile)
router.post('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const {
      finished_product_id: finishedProductId,
      parent_bom_id: parentBomId,
      version,
      profit_margin: profitMargin,
      notes,
      items
    } = req.body
    if (!finishedProductId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({
          status: 'fail',
          message: 'Ürün ve malzeme/alt reçete listesi zorunludur'
        })
    }

    // BOM oluştur
    const result = await query(
      `
      INSERT INTO bom (finished_product_id, parent_bom_id, version, profit_margin, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
      [
        finishedProductId,
        parentBomId || null,
        version || '1.0',
        profitMargin || 0,
        notes,
        req.user.id
      ]
    )

    const bomId = result.rows[0].id

    // BOM items ekle ve maliyetleri hesapla
    let totalBaseCost = 0

    for (const item of items) {
      let unitCost = 0

      if (item.item_type === 'material') {
        // Malzeme maliyetini ürün tablosundan al
        const materialCostResult = await query(
          'SELECT cost_price FROM products WHERE id = $1',
          [item.raw_material_id]
        )
        unitCost = materialCostResult.rows[0]?.cost_price || 0
      } else if (item.item_type === 'sub_bom') {
        // Alt reçete maliyetini BOM tablosundan al
        const subBomCostResult = await query(
          'SELECT final_cost FROM bom WHERE id = $1',
          [item.sub_bom_id]
        )
        unitCost = subBomCostResult.rows[0]?.final_cost || 0
      }

      const totalCost = unitCost * item.quantity
      totalBaseCost += totalCost

      await query(
        `
        INSERT INTO bom_items (bom_id, item_type, raw_material_id, sub_bom_id, quantity, unit, unit_cost, total_cost, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          bomId,
          item.item_type,
          item.raw_material_id || null,
          item.sub_bom_id || null,
          item.quantity,
          item.unit || 'pcs',
          unitCost,
          totalCost,
          item.notes
        ]
      )
    }

    // BOM'un toplam maliyetini güncelle
    const finalCost = totalBaseCost * (1 + (profitMargin || 0) / 100)
    await query(
      `
      UPDATE bom SET base_cost = $1, final_cost = $2 WHERE id = $3
    `,
      [totalBaseCost, finalCost, bomId]
    )

    res
      .status(201)
      .json({
        status: 'success',
        message: 'BOM oluşturuldu',
        data: { id: bomId }
      })
  } catch (err) {
    next(err)
  }
})

// BOM güncelle (Product Tree yapısı ile)
router.put('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const { version, profit_margin: profitMargin, notes, items } = req.body

    // BOM güncelle
    await query(
      `
      UPDATE bom SET version = $1, profit_margin = $2, notes = $3, updated_at = NOW()
      WHERE id = $4 AND is_active = TRUE
    `,
      [version, profitMargin || 0, notes, id]
    )

    // Mevcut items'ları sil
    await query('DELETE FROM bom_items WHERE bom_id = $1', [id])

    // Yeni items ekle ve maliyetleri hesapla
    let totalBaseCost = 0

    if (Array.isArray(items)) {
      for (const item of items) {
        let unitCost = 0

        if (item.item_type === 'material') {
          // Malzeme maliyetini ürün tablosundan al
          const materialCostResult = await query(
            'SELECT cost_price FROM products WHERE id = $1',
            [item.raw_material_id]
          )
          unitCost = materialCostResult.rows[0]?.cost_price || 0
        } else if (item.item_type === 'sub_bom') {
          // Alt reçete maliyetini BOM tablosundan al
          const subBomCostResult = await query(
            'SELECT final_cost FROM bom WHERE id = $1',
            [item.sub_bom_id]
          )
          unitCost = subBomCostResult.rows[0]?.final_cost || 0
        }

        const totalCost = unitCost * item.quantity
        totalBaseCost += totalCost

        await query(
          `
          INSERT INTO bom_items (bom_id, item_type, raw_material_id, sub_bom_id, quantity, unit, unit_cost, total_cost, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            id,
            item.item_type,
            item.raw_material_id || null,
            item.sub_bom_id || null,
            item.quantity,
            item.unit || 'pcs',
            unitCost,
            totalCost,
            item.notes
          ]
        )
      }
    }

    // BOM'un toplam maliyetini güncelle
    const finalCost = totalBaseCost * (1 + (profitMargin || 0) / 100)
    await query(
      `
      UPDATE bom SET base_cost = $1, final_cost = $2 WHERE id = $3
    `,
      [totalBaseCost, finalCost, id]
    )

    res.json({ status: 'success', message: 'BOM güncellendi' })
  } catch (err) {
    next(err)
  }
})

// BOM sil (soft delete)
router.delete('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    await query(
      `
      UPDATE bom SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
    `,
      [id]
    )
    res.json({ status: 'success', message: 'BOM silindi' })
  } catch (err) {
    next(err)
  }
})

// BOM'dan üretim maliyeti hesapla (Product Tree yapısı ile)
router.get('/:id/cost', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const { quantity = 1 } = req.query

    const bomResult = await query(
      `
      SELECT base_cost, profit_margin, final_cost
      FROM bom
      WHERE id = $1 AND is_active = TRUE
    `,
      [id]
    )

    if (bomResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }

    const bomData = bomResult.rows[0]
    const totalBaseCost = bomData.base_cost * quantity
    const totalFinalCost = bomData.final_cost * quantity

    res.json({
      status: 'success',
      data: {
        base_cost: totalBaseCost,
        profit_margin: bomData.profit_margin,
        final_cost: totalFinalCost,
        quantity,
        cost_per_unit: bomData.final_cost
      }
    })
  } catch (err) {
    next(err)
  }
})

// Kar marjı güncelle
router.put(
  '/:id/profit-margin',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { profit_margin: profitMargin } = req.body

      if (profitMargin === undefined || profitMargin < 0) {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Geçerli bir kar marjı giriniz' })
      }

      // Mevcut base_cost'u al
      const bomResult = await query(
        `
      SELECT base_cost FROM bom WHERE id = $1 AND is_active = TRUE
    `,
        [id]
      )

      if (bomResult.rows.length === 0) {
        return res
          .status(404)
          .json({ status: 'fail', message: 'BOM bulunamadı' })
      }

      const baseCost = bomResult.rows[0].base_cost || 0
      const finalCost = baseCost * (1 + profitMargin / 100)

      await query(
        `
      UPDATE bom SET profit_margin = $1, final_cost = $2, updated_at = NOW()
      WHERE id = $3 AND is_active = TRUE
    `,
        [profitMargin, finalCost, id]
      )

      res.json({ status: 'success', message: 'Kar marjı güncellendi' })
    } catch (err) {
      next(err)
    }
  }
)

// BOM ağacını getir (hiyerarşik yapı)
router.get('/:id/tree', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params

    // Recursive function to build BOM tree
    const buildBomTree = async (bomId, level = 0) => {
      const bomResult = await query(
        `
        SELECT b.*, p.name as product_name, p.sku as product_sku
        FROM bom b
        JOIN products p ON b.finished_product_id = p.id
        WHERE b.id = $1 AND b.is_active = TRUE
      `,
        [bomId]
      )

      if (bomResult.rows.length === 0) return null

      const itemsResult = await query(
        `
        SELECT bi.*, 
               CASE 
                 WHEN bi.item_type = 'material' THEN p.name
                 WHEN bi.item_type = 'sub_bom' THEN bp.name
               END as item_name,
               CASE 
                 WHEN bi.item_type = 'material' THEN p.sku
                 WHEN bi.item_type = 'sub_bom' THEN bp.sku
               END as item_sku
        FROM bom_items bi
        LEFT JOIN products p ON bi.raw_material_id = p.id
        LEFT JOIN bom sb ON bi.sub_bom_id = sb.id
        LEFT JOIN products bp ON sb.finished_product_id = bp.id
        WHERE bi.bom_id = $1
      `,
        [bomId]
      )

      const bomNode = {
        ...bomResult.rows[0],
        level,
        items: []
      }

      for (const item of itemsResult.rows) {
        if (item.item_type === 'sub_bom') {
          const subTree = await buildBomTree(item.sub_bom_id, level + 1)
          bomNode.items.push({
            ...item,
            sub_bom_tree: subTree
          })
        } else {
          bomNode.items.push(item)
        }
      }

      return bomNode
    }

    const tree = await buildBomTree(id)

    if (!tree) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }

    res.json({ status: 'success', data: tree })
  } catch (err) {
    next(err)
  }
})

// BOM istatistikleri
router.get('/stats', requireAdminOrOperator, async (req, res, next) => {
  try {
    const statsResult = await query(`
      SELECT
        COUNT(*) as total_boms,
        COUNT(CASE WHEN base_cost > 0 THEN 1 END) as boms_with_cost,
        AVG(base_cost) as avg_base_cost,
        AVG(final_cost) as avg_final_cost,
        SUM(base_cost) as total_base_cost,
        SUM(final_cost) as total_final_cost
      FROM bom
      WHERE is_active = TRUE
    `)

    res.json({ status: 'success', data: statsResult.rows[0] })
  } catch (err) {
    next(err)
  }
})

// BOM ara
router.get('/search', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.trim() === '') {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Arama terimi gereklidir' })
    }

    const searchResult = await query(
      `
      SELECT b.*, p.name as product_name, p.sku as product_sku
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      WHERE b.is_active = TRUE
        AND (p.name ILIKE $1 OR p.sku ILIKE $1 OR b.version ILIKE $1)
      ORDER BY p.name ASC
      LIMIT 50
    `,
      [`%${q.trim()}%`]
    )

    res.json({ status: 'success', data: searchResult.rows })
  } catch (err) {
    next(err)
  }
})

// BOM dışa aktar
router.get('/export', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query

    const bomsResult = await query(`
      SELECT
        b.id,
        b.version,
        b.base_cost,
        b.profit_margin,
        b.final_cost,
        b.notes,
        p.name as product_name,
        p.sku as product_sku,
        u.username as created_by_username,
        b.created_at,
        b.updated_at
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.is_active = TRUE
      ORDER BY p.name ASC
    `)

    if (format === 'excel') {
      // Excel format için JSON olarak gönder
      res.json({ status: 'success', data: bomsResult.rows })
    } else {
      // CSV format için düz metin olarak gönder
      const headers = [
        'ID',
        'Version',
        'Product Name',
        'Product SKU',
        'Base Cost',
        'Profit Margin',
        'Final Cost',
        'Notes',
        'Created By',
        'Created At'
      ]

      const csvRows = bomsResult.rows.map(bom => [
        bom.id,
        bom.version,
        `"${bom.product_name}"`,
        bom.product_sku,
        bom.base_cost,
        bom.profit_margin,
        bom.final_cost,
        `"${bom.notes || ''}"`,
        bom.created_by_username,
        bom.created_at
      ])

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="boms_export.csv"'
      )
      res.send(csvContent)
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router
