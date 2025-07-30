const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const db = require('../config/database')

const router = express.Router()

// Genel stok özeti
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Toplam ürün sayısı
    const [totalProducts] = await db.pool.execute(`
      SELECT COUNT(*) as total FROM products WHERE is_active = TRUE
    `)

    // Stok durumu özeti
    const [stockSummary] = await db.pool.execute(`
      SELECT 
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) <= 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) > 0 AND COALESCE(i.available_quantity, 0) <= p.min_stock_level THEN 1 END) as low_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) > p.min_stock_level THEN 1 END) as in_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) >= p.max_stock_level AND p.max_stock_level > 0 THEN 1 END) as overstock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
    `)

    // Toplam stok değeri
    const [stockValue] = await db.pool.execute(`
      SELECT 
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as total_value,
        SUM(COALESCE(i.available_quantity, 0) * p.cost_price) as total_cost
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
    `)

    // Son 30 günde stok hareketleri
    const [recentMovements] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_movements,
        COUNT(CASE WHEN movement_type = 'in' THEN 1 END) as inbound,
        COUNT(CASE WHEN movement_type = 'out' THEN 1 END) as outbound
      FROM stock_movements 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    // En düşük stoklu ürünler (top 5)
    const [lowStockProducts] = await db.pool.execute(`
      SELECT 
        p.id, p.name, p.sku, 
        COALESCE(i.available_quantity, 0) as current_stock,
        p.min_stock_level,
        (p.min_stock_level - COALESCE(i.available_quantity, 0)) as shortage
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE 
        AND COALESCE(i.available_quantity, 0) <= p.min_stock_level
      ORDER BY shortage DESC
      LIMIT 5
    `)

    res.json({
      status: 'success',
      data: {
        summary: {
          total_products: totalProducts[0].total,
          stock_status: stockSummary[0],
          stock_value: {
            total_value: stockValue[0].total_value || 0,
            total_cost: stockValue[0].total_cost || 0
          },
          recent_movements: recentMovements[0]
        },
        low_stock_products: lowStockProducts
      }
    })
  } catch (err) {
    next(err)
  }
})

// Stok durumu analizi
router.get('/analysis', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { period = '30' } = req.query

    // Kategori bazında stok dağılımı
    const [categoryAnalysis] = await db.pool.execute(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as product_count,
        SUM(COALESCE(i.available_quantity, 0)) as total_quantity,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as total_value
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
      GROUP BY pc.id, pc.name
      ORDER BY total_value DESC
    `)

    // Günlük stok hareketleri (son 30 gün)
    const [dailyMovements] = await db.pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN movement_type = 'in' THEN 1 END) as inbound,
        COUNT(CASE WHEN movement_type = 'out' THEN 1 END) as outbound,
        COUNT(*) as total
      FROM stock_movements 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [period])

    // En çok hareket gören ürünler
    const [topMovingProducts] = await db.pool.execute(`
      SELECT 
        p.name, p.sku,
        COUNT(sm.id) as movement_count,
        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_out
      FROM products p
      JOIN stock_movements sm ON p.id = sm.product_id
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id, p.name, p.sku
      ORDER BY movement_count DESC
      LIMIT 10
    `, [period])

    res.json({
      status: 'success',
      data: {
        category_analysis: categoryAnalysis,
        daily_movements: dailyMovements,
        top_moving_products: topMovingProducts
      }
    })
  } catch (err) {
    next(err)
  }
})

// Düşük stok uyarıları
router.get('/alerts', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [alerts] = await db.pool.execute(`
      SELECT 
        p.id, p.name, p.sku, p.unit,
        COALESCE(i.available_quantity, 0) as current_stock,
        p.min_stock_level,
        p.reorder_point,
        p.reorder_quantity,
        (p.min_stock_level - COALESCE(i.available_quantity, 0)) as shortage,
        pc.name as category_name,
        s.name as supplier_name,
        CASE 
          WHEN COALESCE(i.available_quantity, 0) = 0 THEN 'critical'
          WHEN COALESCE(i.available_quantity, 0) <= (p.min_stock_level * 0.5) THEN 'urgent'
          ELSE 'warning'
        END as alert_level
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = TRUE 
        AND COALESCE(i.available_quantity, 0) <= p.min_stock_level
      ORDER BY alert_level DESC, shortage DESC
    `)

    res.json({
      status: 'success',
      data: alerts
    })
  } catch (err) {
    next(err)
  }
})

// Stok hareketi geçmişi
router.get('/movements', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { product_id, movement_type, days = 30, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)'
    const queryParams = [days]

    if (product_id) {
      whereClause += ' AND sm.product_id = ?'
      queryParams.push(product_id)
    }

    if (movement_type) {
      whereClause += ' AND sm.movement_type = ?'
      queryParams.push(movement_type)
    }

    const [movements] = await db.pool.execute(`
      SELECT 
        sm.*, p.name as product_name, p.sku, p.unit,
        u.username as created_by_username
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)])

    const [totalCount] = await db.pool.execute(`
      SELECT COUNT(*) as total
      FROM stock_movements sm
      ${whereClause}
    `, queryParams)

    res.json({
      status: 'success',
      data: {
        movements,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount[0].total / limit),
          total_items: totalCount[0].total,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (err) {
    next(err)
  }
})

// Stok değerlendirme raporu
router.get('/valuation', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [valuation] = await db.pool.execute(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as product_count,
        SUM(COALESCE(i.available_quantity, 0)) as total_quantity,
        SUM(COALESCE(i.available_quantity, 0) * p.cost_price) as cost_value,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as market_value,
        SUM(COALESCE(i.available_quantity, 0) * (p.unit_price - p.cost_price)) as potential_profit
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
      GROUP BY pc.id, pc.name
      
      UNION ALL
      
      SELECT 
        'TOPLAM' as category_name,
        COUNT(p.id) as product_count,
        SUM(COALESCE(i.available_quantity, 0)) as total_quantity,
        SUM(COALESCE(i.available_quantity, 0) * p.cost_price) as cost_value,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as market_value,
        SUM(COALESCE(i.available_quantity, 0) * (p.unit_price - p.cost_price)) as potential_profit
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
      
      ORDER BY market_value DESC
    `)

    res.json({
      status: 'success',
      data: valuation
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router