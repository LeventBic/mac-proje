const express = require('express')
const { requireAdminOrOperator } = require('../middleware/auth')
const { query } = require('../config/database')

const router = express.Router()

/**
 * @swagger
 * /api/stats/product-count:
 *   get:
 *     summary: Get total product count
 *     description: Returns the total number of active products in the system
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total product count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of active products
 *                   example: 1250
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/product-count', requireAdminOrOperator, async (req, res) => {
  try {
    // Verimli COUNT sorgusu - tüm ürünlerin sayısını döndürür (aktif + pasif)
    const result = await query('SELECT COUNT(*) as count FROM products')
    const total = parseInt(result.rows[0].count)

    res.json({
      total
    })
  } catch (error) {
    console.error('Product count stats error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Toplam ürün sayısı alınırken bir hata oluştu'
    })
  }
})

module.exports = router