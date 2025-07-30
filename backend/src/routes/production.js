const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const db = require('../config/database')

const router = express.Router()

// Üretim emirlerini listele
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [orders] = await db.pool.execute(`
      SELECT po.*, b.name as bom_name, u.username as created_by_username
      FROM production_orders po
      JOIN bom b ON po.bom_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
    `)
    res.json({ status: 'success', data: orders })
  } catch (err) {
    next(err)
  }
})

// Yeni üretim emri oluştur
router.post('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { bom_id, planned_quantity, priority, planned_start_date, planned_end_date, notes } = req.body
    if (!bom_id || !planned_quantity) {
      return res.status(400).json({ status: 'fail', message: 'BOM ve planlanan miktar zorunludur' })
    }
    const [bom] = await db.pool.execute('SELECT id FROM bom WHERE id = ?', [bom_id])
    if (bom.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    const [result] = await db.pool.execute(`
      INSERT INTO production_orders (
        order_number, bom_id, planned_quantity, status, priority, planned_start_date, planned_end_date, notes, created_by
      ) VALUES (?, ?, ?, 'planned', ?, ?, ?, ?, ?)
    `, [orderNumber, bom_id, planned_quantity, priority || 'medium', planned_start_date, planned_end_date, notes, req.user.id])
    res.status(201).json({ status: 'success', message: 'Üretim emri oluşturuldu', data: { id: result.insertId, order_number: orderNumber } })
  } catch (err) {
    next(err)
  }
})

// Üretim emri detayı
router.get('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const [orders] = await db.pool.execute(`
      SELECT po.*, b.name as bom_name, u.username as created_by_username
      FROM production_orders po
      JOIN bom b ON po.bom_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ?
    `, [id])
    if (orders.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    const [movements] = await db.pool.execute(`
      SELECT pm.*, p.name as product_name, u.username as created_by_username
      FROM production_movements pm
      JOIN products p ON pm.product_id = p.id
      LEFT JOIN users u ON pm.created_by = u.id
      WHERE pm.production_order_id = ?
      ORDER BY pm.created_at ASC
    `, [id])
    res.json({ status: 'success', data: { order: orders[0], movements } })
  } catch (err) {
    next(err)
  }
})

// Üretim başlat
router.post('/:id/start', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const [orders] = await db.pool.execute('SELECT * FROM production_orders WHERE id = ?', [id])
    if (orders.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    if (orders[0].status !== 'planned') {
      return res.status(400).json({ status: 'fail', message: 'Sadece planlanan emir başlatılabilir' })
    }
    await db.pool.execute(`
      UPDATE production_orders SET status = 'in_progress', actual_start_date = NOW(), updated_at = NOW() WHERE id = ?
    `, [id])
    res.json({ status: 'success', message: 'Üretim başlatıldı' })
  } catch (err) {
    next(err)
  }
})

// Üretim tamamla
router.post('/:id/complete', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const { produced_quantity, actual_cost } = req.body
    const [orders] = await db.pool.execute('SELECT * FROM production_orders WHERE id = ?', [id])
    if (orders.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    if (orders[0].status !== 'in_progress') {
      return res.status(400).json({ status: 'fail', message: 'Sadece devam eden emir tamamlanabilir' })
    }
    await db.pool.execute(`
      UPDATE production_orders SET status = 'completed', actual_end_date = NOW(), produced_quantity = ?, actual_cost = ?, updated_at = NOW() WHERE id = ?
    `, [produced_quantity || orders[0].produced_quantity, actual_cost || orders[0].actual_cost, id])
    res.json({ status: 'success', message: 'Üretim tamamlandı' })
  } catch (err) {
    next(err)
  }
})

// Üretim hareketi ekle (malzeme tüketimi, ürün üretimi, fire kaydı)
router.post('/:id/movement', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const { product_id, movement_type, quantity, unit_cost, location, notes } = req.body
    if (!product_id || !movement_type || !quantity) {
      return res.status(400).json({ status: 'fail', message: 'Ürün, hareket tipi ve miktar zorunludur' })
    }
    const validTypes = ['material_consumed', 'product_produced', 'waste_recorded']
    if (!validTypes.includes(movement_type)) {
      return res.status(400).json({ status: 'fail', message: 'Geçersiz hareket tipi' })
    }
    await db.pool.execute(`
      INSERT INTO production_movements (
        production_order_id, product_id, movement_type, quantity, unit_cost, location, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, product_id, movement_type, quantity, unit_cost, location, notes, req.user.id])
    res.status(201).json({ status: 'success', message: 'Üretim hareketi kaydedildi' })
  } catch (err) {
    next(err)
  }
})

module.exports = router