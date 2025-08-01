const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const { query } = require('../config/database')

const router = express.Router()

// Üretim emirlerini listele
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    const ordersResult = await query(`
      SELECT po.*, b.name as bom_name, u.username as created_by_username
      FROM production_orders po
      JOIN bom b ON po.bom_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
    `)
    res.json({ status: 'success', data: ordersResult.rows })
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
    const bomResult = await query('SELECT id FROM bom WHERE id = $1', [bom_id])
    if (bomResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'BOM bulunamadı' })
    }
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    const result = await query(`
      INSERT INTO production_orders (
        order_number, bom_id, planned_quantity, status, priority, planned_start_date, planned_end_date, notes, created_by
      ) VALUES ($1, $2, $3, 'planned', $4, $5, $6, $7, $8) RETURNING id
    `, [orderNumber, bom_id, planned_quantity, priority || 'medium', planned_start_date, planned_end_date, notes, req.user.id])
    res.status(201).json({ status: 'success', message: 'Üretim emri oluşturuldu', data: { id: result.rows[0].id, order_number: orderNumber } })
  } catch (err) {
    next(err)
  }
})

// Üretim emri detayı
router.get('/:id', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const ordersResult = await query(`
      SELECT po.*, b.name as bom_name, u.username as created_by_username
      FROM production_orders po
      JOIN bom b ON po.bom_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = $1
    `, [id])
    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    const movementsResult = await query(`
      SELECT pm.*, p.name as product_name, u.username as created_by_username
      FROM production_movements pm
      JOIN products p ON pm.product_id = p.id
      LEFT JOIN users u ON pm.created_by = u.id
      WHERE pm.production_order_id = $1
      ORDER BY pm.created_at ASC
    `, [id])
    res.json({ status: 'success', data: { order: ordersResult.rows[0], movements: movementsResult.rows } })
  } catch (err) {
    next(err)
  }
})

// Üretim başlat
router.post('/:id/start', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { id } = req.params
    const ordersResult = await query('SELECT * FROM production_orders WHERE id = $1', [id])
    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    if (ordersResult.rows[0].status !== 'planned') {
      return res.status(400).json({ status: 'fail', message: 'Sadece planlanan emir başlatılabilir' })
    }
    await query(`
      UPDATE production_orders SET status = 'in_progress', actual_start_date = NOW(), updated_at = NOW() WHERE id = $1
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
    const ordersResult = await query('SELECT * FROM production_orders WHERE id = $1', [id])
    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Üretim emri bulunamadı' })
    }
    if (ordersResult.rows[0].status !== 'in_progress') {
      return res.status(400).json({ status: 'fail', message: 'Sadece devam eden emir tamamlanabilir' })
    }
    await query(`
      UPDATE production_orders SET status = 'completed', actual_end_date = NOW(), produced_quantity = $1, actual_cost = $2, updated_at = NOW() WHERE id = $3
    `, [produced_quantity || ordersResult.rows[0].produced_quantity, actual_cost || ordersResult.rows[0].actual_cost, id])
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
    await query(`
      INSERT INTO production_movements (
        production_order_id, product_id, movement_type, quantity, unit_cost, location, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, product_id, movement_type, quantity, unit_cost, location, notes, req.user.id])
    res.status(201).json({ status: 'success', message: 'Üretim hareketi kaydedildi' })
  } catch (err) {
    next(err)
  }
})

module.exports = router