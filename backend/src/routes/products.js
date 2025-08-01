const express = require('express')
const { validationResult } = require('express-validator')
const productsController = require('../controllers/productsController')
const productsValidators = require('../validators/productsValidators')
const { AppError } = require('../middleware/errorHandler')
const { requireAdminOrOperator } = require('../middleware/auth')

const router = express.Router()

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('=== VALIDATION ERRORS DETAILS ===')
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2))
    console.log('=================================')
    return next(new AppError('Validation failed', 400, errors.array()))
  }
  next()
}

// Get all products with filtering and pagination
router.get('/', 
  requireAdminOrOperator,
  productsValidators.validateProductsQuery,
  handleValidationErrors,
  productsController.getProducts
)

// Search products
router.get('/search',
  requireAdminOrOperator,
  productsValidators.validateProductSearch,
  handleValidationErrors,
  productsController.searchProducts
)

// Get products by category
router.get('/category/:category_id',
  requireAdminOrOperator,
  productsValidators.validateProductsByCategoryQuery,
  handleValidationErrors,
  productsController.getProductsByCategory
)

// Get product by ID
router.get('/:id',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  handleValidationErrors,
  productsController.getProductById
)

// Create new product
router.post('/',
  requireAdminOrOperator,
  productsValidators.validateProductCreate,
  productsValidators.validateStockLevelsConsistency,
  productsValidators.validatePricingConsistency,
  productsValidators.validateProductTypeConsistency,
  handleValidationErrors,
  productsController.createProduct
)

// Update product
router.put('/:id',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  productsValidators.validateProductUpdate,
  productsValidators.validateStockLevelsConsistency,
  productsValidators.validatePricingConsistency,
  productsValidators.validateProductTypeConsistency,
  handleValidationErrors,
  productsController.updateProduct
)

// Update product pricing
router.patch('/:id/pricing',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  productsValidators.validateProductPricing,
  handleValidationErrors,
  productsController.updateProductPricing
)

// Delete product
router.delete('/:id',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  handleValidationErrors,
  productsController.deleteProduct
)

// Get product stock levels
router.get('/:id/stock',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  handleValidationErrors,
  productsController.getProductStock
)

// Get product movements
router.get('/:id/movements',
  requireAdminOrOperator,
  productsValidators.validateProductMovementsQuery,
  handleValidationErrors,
  productsController.getProductMovements
)

// Get product BOM
router.get('/:id/bom',
  requireAdminOrOperator,
  productsValidators.validateProductId,
  handleValidationErrors,
  productsController.getProductBOM
)

module.exports = router