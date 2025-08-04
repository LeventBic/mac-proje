const { body, param, query } = require('express-validator')

/**
 * Products Validators
 * Input validation for product operations
 */

const productsValidators = {
  /**
   * Validate product ID parameter
   */
  validateProductId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer')
  ],

  /**
   * Validate category ID parameter
   */
  validateCategoryId: [
    param('category_id')
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer')
  ],

  /**
   * Validate products query parameters
   */
  validateProductsQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .custom(value => {
        // Skip validation if empty string
        if (value === '') return true
        return value.length >= 1 && value.length <= 100
      })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('category_id')
      .optional()
      .custom(value => {
        // Skip validation if empty string
        if (value === '') return true
        return Number.isInteger(Number(value)) && Number(value) >= 1
      })
      .withMessage('Category ID must be a positive integer'),
    query('product_type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Product type ID must be a positive integer'),
    query('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Supplier ID must be a positive integer'),
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value'),
    query('is_raw_material')
      .optional()
      .isBoolean()
      .withMessage('Is raw material must be a boolean value'),
    query('is_finished_product')
      .optional()
      .isBoolean()
      .withMessage('Is finished product must be a boolean value')
  ],

  /**
   * Validate product creation data
   */
  validateProductCreate: [
    body('sku')
      .notEmpty()
      .withMessage('SKU is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('SKU must be between 2 and 50 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage(
        'SKU can only contain letters, numbers, hyphens, and underscores'
      ),
    body('name')
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Product name must be between 2 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Barcode cannot exceed 50 characters'),
    body('category_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Category ID must be a positive integer'),
    body('product_type_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Product type ID must be a positive integer'),
    body('supplier_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Supplier ID must be a positive integer'),
    body('unit_price')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return !isNaN(Number(value)) && Number(value) >= 0
      })
      .withMessage('Unit price must be a non-negative number'),
    body('cost_price')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return !isNaN(Number(value)) && Number(value) >= 0
      })
      .withMessage('Cost price must be a non-negative number'),
    body('unit_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Unit ID must be a positive integer'),
    body('min_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(value) && parseFloat(value) >= 0
      })
      .withMessage('Minimum stock level must be a non-negative number'),
    body('max_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(value) && parseFloat(value) >= 0
      })
      .withMessage('Maximum stock level must be a non-negative number'),
    body('reorder_point')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(value) && parseFloat(value) >= 0
      })
      .withMessage('Reorder point must be a non-negative number'),
    body('reorder_quantity')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(value) && parseFloat(value) >= 0
      })
      .withMessage('Reorder quantity must be a non-negative number'),
    body('is_raw_material')
      .optional()
      .isBoolean()
      .withMessage('Is raw material must be a boolean value'),
    body('is_finished_product')
      .optional()
      .isBoolean()
      .withMessage('Is finished product must be a boolean value'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value'),
    body('initial_stock')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Initial stock must be a non-negative number'),
    body('location_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Location ID must be a positive integer')
  ],

  /**
   * Validate product update data
   */
  validateProductUpdate: [
    body('sku')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('SKU must be between 2 and 50 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage(
        'SKU can only contain letters, numbers, hyphens, and underscores'
      ),
    body('name')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('Product name must be between 2 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Barcode cannot exceed 50 characters'),
    body('category_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Category ID must be a positive integer'),
    body('product_type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Product type ID must be a positive integer'),
    body('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Supplier ID must be a positive integer'),
    body('unit_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number'),
    body('cost_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a non-negative number'),
    body('unit_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Unit ID must be a positive integer'),
    body('min_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true;
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      })
      .withMessage('Minimum stock level must be a non-negative number'),
    body('max_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true;
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      })
      .withMessage('Maximum stock level must be a non-negative number'),
    body('reorder_point')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true;
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      })
      .withMessage('Reorder point must be a non-negative number'),
    body('reorder_quantity')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true;
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      })
      .withMessage('Reorder quantity must be a non-negative number'),
    body('is_raw_material')
      .optional()
      .isBoolean()
      .withMessage('Is raw material must be a boolean value'),
    body('is_finished_product')
      .optional()
      .isBoolean()
      .withMessage('Is finished product must be a boolean value'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value')
  ],

  /**
   * Validate product pricing update
   */
  validateProductPricing: [
    body('unit_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number'),
    body('cost_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a non-negative number'),
    // At least one price field must be provided
    body().custom(value => {
      if (!value.unit_price && !value.cost_price) {
        throw new Error(
          'At least one price field (unit_price or cost_price) must be provided'
        )
      }
      return true
    })
  ],

  /**
   * Validate product movements query parameters
   */
  validateProductMovementsQuery: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('location_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer')
  ],

  /**
   * Validate product search query
   */
  validateProductSearch: [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],

  /**
   * Validate products by category query
   */
  validateProductsByCategoryQuery: [
    param('category_id')
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  /**
   * Custom validation for stock levels consistency
   */
  validateStockLevelsConsistency: [
    body().custom(value => {
      // eslint-disable-next-line camelcase
      const { min_stock_level, max_stock_level, reorder_point } = value

      if (
        // eslint-disable-next-line camelcase
        min_stock_level &&
        // eslint-disable-next-line camelcase
        max_stock_level &&
        // eslint-disable-next-line camelcase
        min_stock_level > max_stock_level
      ) {
        throw new Error(
          'Minimum stock level cannot be greater than maximum stock level'
        )
      }

      // eslint-disable-next-line camelcase
      if (reorder_point && min_stock_level && reorder_point < min_stock_level) {
        throw new Error(
          'Reorder point should not be less than minimum stock level'
        )
      }

      return true
    })
  ],

  /**
   * Custom validation for pricing consistency
   */
  validatePricingConsistency: [
    body().custom(value => {
      // eslint-disable-next-line camelcase
      const { unit_price, cost_price } = value

      // eslint-disable-next-line camelcase
      if (unit_price && cost_price && unit_price < cost_price) {
        console.warn(
          'Unit price is less than cost price - this may result in negative profit margin'
        )
      }

      return true
    })
  ],

  /**
   * Validate product type consistency
   */
  validateProductTypeConsistency: [
    body().custom(value => {
      // eslint-disable-next-line camelcase
      const { is_raw_material, is_finished_product } = value

      // eslint-disable-next-line camelcase
      if (is_raw_material && is_finished_product) {
        throw new Error(
          'Product cannot be both raw material and finished product'
        )
      }

      return true
    })
  ]
}

module.exports = productsValidators
