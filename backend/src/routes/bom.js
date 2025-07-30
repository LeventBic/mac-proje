const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const db = require('../config/database')

const router = express.Router()

// Tüm BOM'ları listele (Product Tree yapısı ile)
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [boms] = await db.pool.execute(`
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
    res.json({ status: 'success', data: boms })
  } catch (err) {
    next(err)
  }
})

// BOM detayını getir (items ile birlikte - Product Tree yapısı)
router.get('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const [boms] = await db.pool.execute(`
      SELECT b.*, p.name as product_name, p.sku as product_sku, 
             pb.name as parent_product_name, u.username as created_by_username
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      LEFT JOIN bom pb_bom ON b.parent_bom_id = pb_bom.id
      LEFT JOIN products pb ON pb_bom.finished_product_id = pb.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = ? AND b.is_active = TRUE
    `, [id])
    
    if (boms.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }
    
    const [items] = await db.pool.execute(`
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
      WHERE bi.bom_id = ?
      ORDER BY bi.created_at ASC
    `, [id])
    
    res.json({ status: 'success', data: { bom: boms[0], items } })
  } catch (err) {
    next(err)
  }
})

// Yeni BOM oluştur (Product Tree yapısı ile)
router.post('/', requireAdminOrOperator, async (req, res, next) => {
  const connection = await db.pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const { finished_product_id, parent_bom_id, version, profit_margin, notes, items } = req.body
    if (!finished_product_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Ürün ve malzeme/alt reçete listesi zorunludur' })
    }
    
    // BOM oluştur
    const [result] = await connection.execute(`
      INSERT INTO bom (finished_product_id, parent_bom_id, version, profit_margin, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [finished_product_id, parent_bom_id || null, version || '1.0', profit_margin || 0, notes, req.user.id])
    
    const bomId = result.insertId
    
    // BOM items ekle ve maliyetleri hesapla
    let totalBaseCost = 0
    
    for (const item of items) {
      let unitCost = 0
      
      if (item.item_type === 'material') {
        // Malzeme maliyetini ürün tablosundan al
        const [materialCost] = await connection.execute(
          'SELECT cost_price FROM products WHERE id = ?', 
          [item.raw_material_id]
        )
        unitCost = materialCost[0]?.cost_price || 0
      } else if (item.item_type === 'sub_bom') {
        // Alt reçete maliyetini BOM tablosundan al
        const [subBomCost] = await connection.execute(
          'SELECT final_cost FROM bom WHERE id = ?', 
          [item.sub_bom_id]
        )
        unitCost = subBomCost[0]?.final_cost || 0
      }
      
      const totalCost = unitCost * item.quantity
      totalBaseCost += totalCost
      
      await connection.execute(`
        INSERT INTO bom_items (bom_id, item_type, raw_material_id, sub_bom_id, quantity, unit, unit_cost, total_cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bomId, 
        item.item_type, 
        item.raw_material_id || null, 
        item.sub_bom_id || null, 
        item.quantity, 
        item.unit || 'pcs', 
        unitCost,
        totalCost,
        item.notes
      ])
    }
    
    // BOM'un toplam maliyetini güncelle
    const finalCost = totalBaseCost * (1 + (profit_margin || 0) / 100)
    await connection.execute(`
      UPDATE bom SET base_cost = ?, final_cost = ? WHERE id = ?
    `, [totalBaseCost, finalCost, bomId])
    
    await connection.commit()
    res.status(201).json({ status: 'success', message: 'BOM oluşturuldu', data: { id: bomId } })
  } catch (err) {
    await connection.rollback()
    next(err)
  } finally {
    connection.release()
  }
})

// BOM güncelle (Product Tree yapısı ile)
router.put('/:id', requireAdminOrOperator, async (req, res, next) => {
  const connection = await db.pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const { id } = req.params
    const { version, profit_margin, notes, items } = req.body
    
    // BOM güncelle
    await connection.execute(`
      UPDATE bom SET version = ?, profit_margin = ?, notes = ?, updated_at = NOW()
      WHERE id = ? AND is_active = TRUE
    `, [version, profit_margin || 0, notes, id])
    
    // Mevcut items'ları sil
    await connection.execute('DELETE FROM bom_items WHERE bom_id = ?', [id])
    
    // Yeni items ekle ve maliyetleri hesapla
    let totalBaseCost = 0
    
    if (Array.isArray(items)) {
      for (const item of items) {
        let unitCost = 0
        
        if (item.item_type === 'material') {
          // Malzeme maliyetini ürün tablosundan al
          const [materialCost] = await connection.execute(
            'SELECT cost_price FROM products WHERE id = ?', 
            [item.raw_material_id]
          )
          unitCost = materialCost[0]?.cost_price || 0
        } else if (item.item_type === 'sub_bom') {
          // Alt reçete maliyetini BOM tablosundan al
          const [subBomCost] = await connection.execute(
            'SELECT final_cost FROM bom WHERE id = ?', 
            [item.sub_bom_id]
          )
          unitCost = subBomCost[0]?.final_cost || 0
        }
        
        const totalCost = unitCost * item.quantity
        totalBaseCost += totalCost
        
        await connection.execute(`
          INSERT INTO bom_items (bom_id, item_type, raw_material_id, sub_bom_id, quantity, unit, unit_cost, total_cost, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, 
          item.item_type, 
          item.raw_material_id || null, 
          item.sub_bom_id || null, 
          item.quantity, 
          item.unit || 'pcs', 
          unitCost,
          totalCost,
          item.notes
        ])
      }
    }
    
    // BOM'un toplam maliyetini güncelle
    const finalCost = totalBaseCost * (1 + (profit_margin || 0) / 100)
    await connection.execute(`
      UPDATE bom SET base_cost = ?, final_cost = ? WHERE id = ?
    `, [totalBaseCost, finalCost, id])
    
    await connection.commit()
    res.json({ status: 'success', message: 'BOM güncellendi' })
  } catch (err) {
    await connection.rollback()
    next(err)
  } finally {
    connection.release()
  }
})

// BOM sil (soft delete)
router.delete('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    await db.pool.execute(`
      UPDATE bom SET is_active = FALSE, updated_at = NOW()
      WHERE id = ?
    `, [id])
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
    
    const [bom] = await db.pool.execute(`
      SELECT base_cost, profit_margin, final_cost
      FROM bom
      WHERE id = ? AND is_active = TRUE
    `, [id])
    
    if (bom.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }
    
    const bomData = bom[0]
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
router.put('/:id/profit-margin', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const { profit_margin } = req.body
    
    if (profit_margin === undefined || profit_margin < 0) {
      return res.status(400).json({ status: 'fail', message: 'Geçerli bir kar marjı giriniz' })
    }
    
    // Mevcut base_cost'u al
    const [bom] = await db.pool.execute(`
      SELECT base_cost FROM bom WHERE id = ? AND is_active = TRUE
    `, [id])
    
    if (bom.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }
    
    const baseCost = bom[0].base_cost || 0
    const finalCost = baseCost * (1 + profit_margin / 100)
    
    await db.pool.execute(`
      UPDATE bom SET profit_margin = ?, final_cost = ?, updated_at = NOW()
      WHERE id = ? AND is_active = TRUE
    `, [profit_margin, finalCost, id])
    
    res.json({ status: 'success', message: 'Kar marjı güncellendi' })
  } catch (err) {
    next(err)
  }
})

// BOM ağacını getir (hiyerarşik yapı)
router.get('/:id/tree', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Recursive function to build BOM tree
    async function buildBomTree(bomId, level = 0) {
      const [bom] = await db.pool.execute(`
        SELECT b.*, p.name as product_name, p.sku as product_sku
        FROM bom b
        JOIN products p ON b.finished_product_id = p.id
        WHERE b.id = ? AND b.is_active = TRUE
      `, [bomId])
      
      if (bom.length === 0) return null
      
      const [items] = await db.pool.execute(`
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
        WHERE bi.bom_id = ?
      `, [bomId])
      
      const bomNode = {
        ...bom[0],
        level,
        items: []
      }
      
      for (const item of items) {
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

// Mevcut BOM'ları alt reçete olarak kullanılabilir şekilde listele
router.get('/available-sub-boms', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { excludeId } = req.query
    
    let query = `
      SELECT b.id, b.finished_product_id, b.version, b.final_cost,
             p.name as product_name, p.sku as product_sku
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      WHERE b.is_active = TRUE
    `
    
    const params = []
    if (excludeId) {
      query += ' AND b.id != ?'
      params.push(excludeId)
    }
    
    query += ' ORDER BY p.name ASC'
    
    const [boms] = await db.pool.execute(query, params)
    res.json({ status: 'success', data: boms })
  } catch (err) {
    next(err)
  }
})

// Mevcut BOM'ları alt reçete olarak kullanılabilir şekilde listele (excludeId ile)
router.get('/available-sub-boms/:excludeId', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { excludeId } = req.params
    
    let query = `
      SELECT b.id, b.finished_product_id, b.version, b.final_cost,
             p.name as product_name, p.sku as product_sku
      FROM bom b
      JOIN products p ON b.finished_product_id = p.id
      WHERE b.is_active = TRUE
    `
    
    const params = []
    if (excludeId) {
      query += ' AND b.id != ?'
      params.push(excludeId)
    }
    
    query += ' ORDER BY p.name ASC'
    
    const [boms] = await db.pool.execute(query, params)
    res.json({ status: 'success', data: boms })
  } catch (err) {
    next(err)
  }
})

module.exports = router