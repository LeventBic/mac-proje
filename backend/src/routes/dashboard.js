const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const db = require('../config/database')

const router = express.Router()

// Ana dashboard endpoint'i - genel sistem özeti
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Ürün istatistikleri
    const [productStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_raw_material = TRUE THEN 1 END) as raw_materials,
        COUNT(CASE WHEN is_finished_product = TRUE THEN 1 END) as finished_products,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_products
      FROM products
    `)

    // Stok istatistikleri
    const [stockStats] = await db.pool.execute(`
      SELECT 
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) <= 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) > 0 AND COALESCE(i.available_quantity, 0) <= p.min_stock_level THEN 1 END) as low_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) > p.min_stock_level THEN 1 END) as in_stock,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as total_stock_value
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE
    `)

    // Üretim istatistikleri
    const [productionStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM production_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    // Satış istatistikleri (son 30 gün)
    const [salesStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_with_tax) as total_revenue,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
      FROM sales_orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    // Satın alma istatistikleri (son 30 gün)
    const [purchaseStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spending,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
      FROM purchase_orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    // Günlük satış trendi (son 7 gün)
    const [salesTrend] = await db.pool.execute(`
      SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        SUM(total_with_tax) as daily_revenue
      FROM sales_orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(order_date)
      ORDER BY date DESC
    `)

    // Günlük üretim trendi (son 7 gün)
    const [productionTrend] = await db.pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as orders_completed
      FROM production_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Son aktiviteler
    const [recentActivities] = await db.pool.execute(`
      (SELECT 'production' as type, CONCAT('Üretim emri oluşturuldu: ', order_number) as description, created_at as activity_date
       FROM production_orders ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'sales' as type, CONCAT('Satış siparişi: ', order_number) as description, order_date as activity_date
       FROM sales_orders ORDER BY order_date DESC LIMIT 5)
      UNION ALL
      (SELECT 'purchase' as type, CONCAT('Satın alma siparişi: ', order_number) as description, order_date as activity_date
       FROM purchase_orders ORDER BY order_date DESC LIMIT 5)
      ORDER BY activity_date DESC
      LIMIT 10
    `)

    // Düşük stoklu ürünler (top 5)
    const [lowStockProducts] = await db.pool.execute(`
      SELECT 
        p.name, p.sku,
        COALESCE(i.available_quantity, 0) as current_stock,
        p.min_stock_level
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'MAIN'
      WHERE p.is_active = TRUE 
        AND COALESCE(i.available_quantity, 0) <= p.min_stock_level
      ORDER BY (p.min_stock_level - COALESCE(i.available_quantity, 0)) DESC
      LIMIT 5
    `)

    // En çok satan ürünler (son 30 gün)
    const [topSellingProducts] = await db.pool.execute(`
      SELECT 
        p.name, p.sku,
        SUM(soi.quantity) as total_sold,
        SUM(soi.total_price) as total_revenue
      FROM products p
      JOIN sales_order_items soi ON p.id = soi.product_id
      JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND so.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 5
    `)

    res.json({
      status: 'success',
      data: {
        overview: {
          products: productStats[0],
          stock: stockStats[0],
          production: productionStats[0],
          sales: salesStats[0] || { total_orders: 0, total_revenue: 0, pending_orders: 0, delivered_orders: 0 },
          purchases: purchaseStats[0] || { total_orders: 0, total_spending: 0, pending_orders: 0, completed_orders: 0 }
        },
        trends: {
          sales: salesTrend,
          production: productionTrend
        },
        insights: {
          recent_activities: recentActivities,
          low_stock_products: lowStockProducts,
          top_selling_products: topSellingProducts
        }
      }
    })
  } catch (err) {
    next(err)
  }
})

// Stok raporu: tüm ürünlerin stok durumu ve değerleri
router.get('/stock', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.id, p.name, p.sku, p.unit, p.unit_price, i.available_quantity, (i.available_quantity * p.unit_price) as stock_value
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      ORDER BY p.name ASC
    `)
    res.json({ status: 'success', data: rows })
  } catch (err) {
    next(err)
  }
})

// Üretim raporu: üretim emirleri ve durumları
router.get('/production', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT po.*, b.name as bom_name, u.username as created_by_username
      FROM production_orders po
      JOIN bom b ON po.bom_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
    `)
    res.json({ status: 'success', data: rows })
  } catch (err) {
    next(err)
  }
})

// Satış raporu: satış siparişleri ve toplamlar
router.get('/sales', requireAdminOrOperator, async (req, res, next) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT so.id, so.order_number, so.order_date, so.status, so.total_amount, so.tax_amount, so.total_with_tax, c.name as customer_name, u.username as created_by_username
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.created_by = u.id
      ORDER BY so.order_date DESC
    `)
    res.json({ status: 'success', data: rows })
  } catch (err) {
    next(err)
  }
})

// Performans metrikleri
router.get('/metrics', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { period = '30' } = req.query

    // Satış performansı
    const [salesMetrics] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_with_tax) as total_revenue,
        AVG(total_with_tax) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM sales_orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status != 'cancelled'
    `, [period])

    // Üretim performansı
    const [productionMetrics] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        AVG(CASE WHEN status = 'completed' THEN DATEDIFF(actual_end_date, actual_start_date) END) as avg_completion_days,
        SUM(produced_quantity) as total_production
      FROM production_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [period])

    // Stok devir hızı
    const [inventoryTurnover] = await db.pool.execute(`
      SELECT 
        COUNT(DISTINCT sm.product_id) as active_products,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_outbound,
        AVG(i.available_quantity) as avg_stock_level
      FROM stock_movements sm
      JOIN inventory i ON sm.product_id = i.product_id
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [period])

    res.json({
      status: 'success',
      data: {
        sales: salesMetrics[0],
        production: productionMetrics[0],
        inventory: inventoryTurnover[0]
      }
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router