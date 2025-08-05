const express = require('express')
const router = express.Router()
const { query } = require('../config/database')
const {
  requireAdminOrOperator
} = require('../middleware/auth')
const { validationResult } = require('express-validator')
const inventoryController = require('../controllers/inventoryController')
const inventoryValidators = require('../validators/inventoryValidators')
const { AppError } = require('../middleware/errorHandler')

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()))
  }
  next()
}

// Get all inventory items with filtering and pagination
router.get(
  '/items',
  requireAdminOrOperator,
  inventoryValidators.validateInventoryQuery,
  handleValidationErrors,
  inventoryController.getInventoryItems
)

// Get inventory item by ID
router.get(
  '/items/:id',
  requireAdminOrOperator,
  inventoryValidators.validateInventoryItemId,
  handleValidationErrors,
  inventoryController.getInventoryItemById
)

// Update inventory item
router.put(
  '/items/:id',
  requireAdminOrOperator,
  inventoryValidators.validateInventoryItemId,
  inventoryValidators.validateInventoryUpdate,
  handleValidationErrors,
  inventoryController.updateInventoryItem
)

// Get inventory movements for an item
router.get(
  '/items/:id/movements',
  requireAdminOrOperator,
  inventoryValidators.validateMovementsQuery,
  handleValidationErrors,
  inventoryController.getInventoryMovements
)

// Get low stock items
router.get(
  '/low-stock',
  requireAdminOrOperator,
  inventoryValidators.validateLowStockQuery,
  handleValidationErrors,
  inventoryController.getLowStockItems
)

// Get inventory summary
router.get(
  '/summary',
  requireAdminOrOperator,
  inventoryValidators.validateSummaryQuery,
  handleValidationErrors,
  inventoryController.getInventorySummary
)

router.get('/', requireAdminOrOperator, async (req, res, next) => {
  try {
    // Redirect to new summary endpoint
    return inventoryController.getInventorySummary(req, res, next)
  } catch (error) {
    next(error)
  }
})

// Keep existing analysis route
router.get(
  '/analysis',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      // Toplam ürün sayısı
      const totalProductsResult = await query(`
      SELECT COUNT(*) as total FROM products WHERE is_active = TRUE
    `)
      const totalProducts = totalProductsResult.rows

      // Stok durumu özeti
      const stockSummaryResult = await query(`
      SELECT 
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) > p.min_stock_level THEN 1 END) as in_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) <= p.min_stock_level AND COALESCE(i.available_quantity, 0) > 0 THEN 1 END) as low_stock,
        COUNT(CASE WHEN COALESCE(i.available_quantity, 0) = 0 THEN 1 END) as out_of_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
    `)
      const stockSummary = stockSummaryResult.rows

      // Stok değeri
      const stockValueResult = await query(`
      SELECT 
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as total_value,
        SUM(COALESCE(i.available_quantity, 0) * p.cost_price) as total_cost
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
    `)
      const stockValue = stockValueResult.rows

      // Son hareketler
      const recentMovementsResult = await query(`
      SELECT COUNT(*) as total
      FROM stock_movements 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    `)
      const recentMovements = recentMovementsResult.rows

      // En düşük stoklu ürünler (top 5)
      const lowStockProductsResult = await query(`
      SELECT 
        p.id, p.name, p.sku, 
        COALESCE(i.available_quantity, 0) as current_stock,
        p.min_stock_level,
        (p.min_stock_level - COALESCE(i.available_quantity, 0)) as shortage
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
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
          low_stock_products: lowStockProductsResult.rows
        }
      })
    } catch (err) {
      next(err)
    }
  }
)

// Stok durumu analizi
router.get(
  '/analysis/detailed',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      const { period = '30' } = req.query

      // Kategori bazında stok dağılımı
      const categoryAnalysisResult = await query(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as product_count,
        SUM(COALESCE(i.available_quantity, 0)) as total_quantity,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as total_value
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      GROUP BY pc.id, pc.name
      ORDER BY total_value DESC
    `)
      const categoryAnalysis = categoryAnalysisResult.rows

      // Günlük stok hareketleri (son X gün)
      const dailyMovementsResult = await query(
        `
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN movement_type = 'in' THEN 1 END) as inbound,
        COUNT(CASE WHEN movement_type = 'out' THEN 1 END) as outbound,
        COUNT(*) as total
      FROM stock_movements 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '$1 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
        [period]
      )
      const dailyMovements = dailyMovementsResult.rows

      // En çok hareket gören ürünler
      const topMovingProductsResult = await query(
        `
      SELECT 
        p.name, p.sku,
        COUNT(sm.id) as movement_count,
        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_out
      FROM products p
      JOIN stock_movements sm ON p.id = sm.product_id
      WHERE sm.created_at >= CURRENT_TIMESTAMP - INTERVAL '$1 days'
      GROUP BY p.id, p.name, p.sku
      ORDER BY movement_count DESC
      LIMIT 10
    `,
        [period]
      )
      const topMovingProducts = topMovingProductsResult.rows

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
  }
)

// Düşük stok uyarıları
router.get(
  '/alerts',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      const alertsResult = await query(`
      SELECT 
        p.id, p.name, p.sku, p.unit,
        COALESCE(SUM(i.available_quantity), 0) as current_stock,
        p.min_stock_level,
        p.reorder_point,
        p.reorder_quantity,
        (p.min_stock_level - COALESCE(SUM(i.available_quantity), 0)) as shortage,
        pc.name as category_name,
        s.name as supplier_name,
        CASE 
          WHEN COALESCE(SUM(i.available_quantity), 0) = 0 THEN 'critical'
          WHEN COALESCE(SUM(i.available_quantity), 0) <= (p.min_stock_level * 0.5) THEN 'urgent'
          ELSE 'warning'
        END as alert_level
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = TRUE 
        AND p.min_stock_level > 0
      GROUP BY p.id, p.name, p.sku, p.unit, p.min_stock_level, p.reorder_point, p.reorder_quantity, pc.name, s.name
      HAVING COALESCE(SUM(i.available_quantity), 0) <= p.min_stock_level
      ORDER BY alert_level DESC, shortage DESC
    `)
      const alerts = alertsResult.rows

      res.json({
        status: 'success',
        data: alerts
      })
    } catch (err) {
      next(err)
    }
  }
)

// Stok hareketi geçmişi
router.get('/movements', requireAdminOrOperator, async (req, res, next) => {
  try {
    const {
      product_id: productId,
      movement_type: movementType,
      days = 30,
      page = 1,
      limit = 20
    } = req.query
    const offset = (page - 1) * limit

    let whereClause =
      "WHERE sm.created_at >= CURRENT_TIMESTAMP - INTERVAL '$1 days'"
    const queryParams = [days]
    let paramIndex = 1

    if (productId) {
      paramIndex++
      whereClause += ` AND sm.product_id = $${paramIndex}`
      queryParams.push(productId)
    }

    if (movementType) {
      paramIndex++
      whereClause += ` AND sm.movement_type = $${paramIndex}`
      queryParams.push(movementType)
    }

    const movementsResult = await query(
      `
      SELECT 
        sm.*, p.name as product_name, p.sku, p.unit,
        u.username as created_by_username
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `,
      [...queryParams, parseInt(limit), parseInt(offset)]
    )
    const movements = movementsResult.rows

    const totalCountResult = await query(
      `
      SELECT COUNT(*) as total
      FROM stock_movements sm
      ${whereClause}
    `,
      queryParams
    )
    const totalCount = totalCountResult.rows

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
router.get(
  '/valuation',
  requireAdminOrOperator,
  async (req, res, next) => {
    try {
      const valuationResult = await query(`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as product_count,
        SUM(COALESCE(i.available_quantity, 0)) as total_quantity,
        SUM(COALESCE(i.available_quantity, 0) * p.cost_price) as cost_value,
        SUM(COALESCE(i.available_quantity, 0) * p.unit_price) as market_value,
        SUM(COALESCE(i.available_quantity, 0) * (p.unit_price - p.cost_price)) as potential_profit
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN inventory i ON p.id = i.product_id
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
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      
      ORDER BY market_value DESC
    `)
      const valuation = valuationResult.rows

      res.json({
        status: 'success',
        data: valuation
      })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
