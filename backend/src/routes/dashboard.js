const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const { query } = require('../config/database')

const router = express.Router()

// Genel İstatistikleri (KPI) Getiren Endpoint
router.get('/stats', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Toplam ürün sayısı
    const totalProductsResult = await query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE')
    const totalProducts = parseInt(totalProductsResult.rows[0].count)

    // Stoktaki tüm ürünlerin toplam değeri
    const totalStockValueResult = await query(`
      SELECT COALESCE(SUM(p.unit_price * COALESCE(i.available_quantity, 0)), 0) as total_value
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
    `)
    const totalStockValue = parseFloat(totalStockValueResult.rows[0].total_value || 0)

    // Stoku tükenmiş ürün sayısı
    const outOfStockResult = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE 
      AND (i.available_quantity IS NULL OR i.available_quantity = 0)
    `)
    const outOfStockCount = parseInt(outOfStockResult.rows[0].count)

    // Toplam kategori sayısı
    const categoryCountResult = await query('SELECT COUNT(DISTINCT category_id) as count FROM products WHERE category_id IS NOT NULL AND is_active = TRUE')
    const categoryCount = parseInt(categoryCountResult.rows[0].count)

    res.json({
      totalProducts,
      totalStockValue,
      outOfStockCount,
      categoryCount
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    next(error)
  }
})

// Kategoriye Göre Ürün Sayısını Getiren Endpoint
router.get('/products-per-category', requireAdminOrOperator, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        pc.name,
        COUNT(p.id) as urunSayisi
      FROM product_categories pc
      LEFT JOIN products p ON pc.id = p.category_id AND p.is_active = TRUE
      WHERE pc.is_active = TRUE
      GROUP BY pc.id, pc.name
      HAVING COUNT(p.id) > 0
      ORDER BY urunSayisi DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Dashboard products per category error:', error)
    next(error)
  }
})

// Ana dashboard endpoint'i - genel sistem özeti
router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Basit dashboard response
    const productStats = {
      total_products: 0,
      raw_materials: 0,
      finished_products: 0,
      inactive_products: 0
    }

    const stockStats = {
      out_of_stock: 0,
      low_stock: 0,
      in_stock: 0,
      total_stock_value: 0
    }

    const productionStats = {
      total_orders: 0,
      planned_orders: 0,
      active_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0
    }

    const salesStats = {
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0,
      delivered_orders: 0
    }

    const purchaseStats = {
      total_orders: 0,
      total_spending: 0,
      pending_orders: 0,
      completed_orders: 0
    }

    const salesTrend = []
    const productionTrend = []

    const topProducts = []
    const lowStock = []

    // Son aktiviteler
    const recentActivitiesResult = await query(`
      SELECT 
        'sales_order' as type,
        so.order_number as reference,
        c.name as description,
        so.total_amount as amount,
        so.created_at
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'purchase_order' as type,
        po.order_number as reference,
        s.name as description,
        po.total_amount as amount,
        po.created_at
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.created_at >= NOW() - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT 20
    `)
    const recentActivities = recentActivitiesResult.rows

    res.json({
      success: true,
      data: {
        products: productStats,
        stock: stockStats,
        production: productionStats,
        sales: salesStats,
        purchases: purchaseStats,
        trends: {
          sales: salesTrend,
          production: productionTrend
        },
        topProducts,
        lowStock,
        recentActivities
      }
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    next(error)
  }
})

// Stok özeti endpoint'i
router.get('/stock', requireAdminOrOperator, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.name,
        p.sku,
        COALESCE(i.quantity, 0) as current_stock,
        p.min_stock_level,
        p.max_stock_level,
        p.unit_price
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      ORDER BY p.name
    `)

    res.json({ success: true, data: result.rows })
  } catch (error) {
    next(error)
  }
})

// Üretim özeti endpoint'i
router.get('/production', requireAdminOrOperator, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        order_number,
        status,
        quantity,
        created_at,
        updated_at
      FROM production_orders
      ORDER BY created_at DESC
      LIMIT 50
    `)

    res.json({ success: true, data: result.rows })
  } catch (error) {
    next(error)
  }
})

// Satış özeti endpoint'i
router.get('/sales', requireAdminOrOperator, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        so.order_number,
        c.name as customer_name,
        so.status,
        so.total_amount,
        so.created_at
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      ORDER BY so.created_at DESC
      LIMIT 50
    `)

    res.json({ success: true, data: result.rows })
  } catch (error) {
    next(error)
  }
})

// Detaylı metrikler endpoint'i
router.get('/metrics', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Aylık satış trendi (son 12 ay)
    const monthlySalesResult = await query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue
      FROM sales_orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `)

    // Kategori bazlı satışlar
    const categorySalesResult = await query(`
      SELECT
        c.name as category_name,
        COUNT(soi.id) as items_sold,
        SUM(soi.quantity * soi.unit_price) as revenue
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN sales_order_items soi ON p.id = soi.product_id
      JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `)

    // Müşteri bazlı satışlar (top 10)
    const customerSalesResult = await query(`
      SELECT
        c.name as customer_name,
        COUNT(so.id) as order_count,
        SUM(so.total_amount) as total_spent
      FROM customers c
      JOIN sales_orders so ON c.id = so.customer_id
      WHERE so.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
      LIMIT 10
    `)

    res.json({
      success: true,
      data: {
        monthlySales: monthlySalesResult.rows,
        categorySales: categorySalesResult.rows,
        customerSales: customerSalesResult.rows
      }
    })
  } catch (error) {
    next(error)
  }
})

// Alerts endpoint - uyarılar ve bildirimler
router.get('/alerts', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        alerts: [],
        notifications: [],
        warnings: []
      }
    })
  } catch (error) {
    next(error)
  }
})

// Activities endpoint - son aktiviteler
router.get('/activities', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: []
    })
  } catch (error) {
    next(error)
  }
})

// Products endpoint - ürün istatistikleri
router.get('/products', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        total_products: 0,
        active_products: 0,
        inactive_products: 0,
        categories: 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// Financial endpoint - finansal istatistikler
router.get('/financial', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        total_revenue: 0,
        total_expenses: 0,
        profit: 0,
        profit_margin: 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// Performance endpoint - performans metrikleri
router.get('/performance', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        efficiency: 0,
        quality_rate: 0,
        on_time_delivery: 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// KPI endpoint - anahtar performans göstergeleri
router.get('/kpi', requireAdminOrOperator, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        production_efficiency: 0,
        inventory_turnover: 0,
        customer_satisfaction: 0,
        cost_reduction: 0
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router