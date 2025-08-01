const { body, param, query } = require('express-validator');

/**
 * Inventory Validators
 * Input validation for inventory operations
 */

const inventoryValidators = {
  /**
   * Validate inventory item ID parameter
   */
  validateInventoryItemId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Inventory item ID must be a positive integer')
  ],

  /**
   * Validate inventory query parameters
   */
  validateInventoryQuery: [
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
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('location_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer'),
    query('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    query('low_stock')
      .optional()
      .isBoolean()
      .withMessage('Low stock must be a boolean value')
  ],

  /**
   * Validate inventory item update data
   */
  validateInventoryUpdate: [
    body('current_quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Current quantity must be a non-negative number'),
    body('reserved_quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative number'),
    body('available_quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Available quantity must be a non-negative number'),
    body('min_stock_level')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative number'),
    body('max_stock_level')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum stock level must be a non-negative number'),
    body('reorder_point')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reorder point must be a non-negative number'),
    body('reorder_quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reorder quantity must be a non-negative number')
  ],

  /**
   * Validate stock movement data
   */
  validateStockMovement: [
    body('product_id')
      .notEmpty()
      .withMessage('Product ID is required')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    body('location_id')
      .notEmpty()
      .withMessage('Location ID is required')
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer'),
    body('movement_type')
      .notEmpty()
      .withMessage('Movement type is required')
      .isIn(['in', 'out', 'transfer', 'adjustment'])
      .withMessage('Movement type must be one of: in, out, transfer, adjustment'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than zero'),
    body('reference_type')
      .optional()
      .isIn(['sales_order', 'purchase_order', 'production_order', 'stock_adjustment', 'stock_transfer'])
      .withMessage('Invalid reference type'),
    body('reference_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Reference ID must be a positive integer'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('created_by')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Created by must be a valid user ID')
  ],

  /**
   * Validate stock adjustment data
   */
  validateStockAdjustment: [
    body('product_id')
      .notEmpty()
      .withMessage('Product ID is required')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    body('location_id')
      .notEmpty()
      .withMessage('Location ID is required')
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer'),
    body('adjustment_type')
      .notEmpty()
      .withMessage('Adjustment type is required')
      .isIn(['increase', 'decrease', 'set'])
      .withMessage('Adjustment type must be one of: increase, decrease, set'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isFloat({ min: 0 })
      .withMessage('Quantity must be a non-negative number'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Reason must be between 3 and 200 characters'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],

  /**
   * Validate stock transfer data
   */
  validateStockTransfer: [
    body('product_id')
      .notEmpty()
      .withMessage('Product ID is required')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    body('from_location_id')
      .notEmpty()
      .withMessage('From location ID is required')
      .isInt({ min: 1 })
      .withMessage('From location ID must be a positive integer'),
    body('to_location_id')
      .notEmpty()
      .withMessage('To location ID is required')
      .isInt({ min: 1 })
      .withMessage('To location ID must be a positive integer'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than zero'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    // Custom validation to ensure from and to locations are different
    body('to_location_id').custom((value, { req }) => {
      if (value === req.body.from_location_id) {
        throw new Error('From and to locations must be different');
      }
      return true;
    })
  ],

  /**
   * Validate inventory movements query parameters
   */
  validateMovementsQuery: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Inventory item ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],

  /**
   * Validate low stock query parameters
   */
  validateLowStockQuery: [
    query('location_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer')
  ],

  /**
   * Validate inventory summary query parameters
   */
  validateSummaryQuery: [
    query('location_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer')
  ]
};

module.exports = inventoryValidators;