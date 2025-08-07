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
      .withMessage('Ürün ID pozitif bir tam sayı olmalıdır')
  ],

  /**
   * Validate category ID parameter
   */
  validateCategoryId: [
    param('category_id')
      .isInt({ min: 1 })
      .withMessage('Kategori ID pozitif bir tam sayı olmalıdır')
  ],

  /**
   * Validate products query parameters
   */
  validateProductsQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sayfa pozitif bir tam sayı olmalıdır'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit 1 ile 100 arasında olmalıdır'),
    query('search')
      .optional()
      .custom(value => {
        // Skip validation if empty string
        if (value === '') return true
        return value.length >= 1 && value.length <= 100
      })
      .withMessage('Arama terimi 1 ile 100 karakter arasında olmalıdır'),
    query('category_id')
      .optional()
      .custom(value => {
        // Skip validation if empty string
        if (value === '') return true
        return Number.isInteger(Number(value)) && Number(value) >= 1
      })
      .withMessage('Kategori ID pozitif bir tam sayı olmalıdır'),
    query('product_type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Ürün tipi ID pozitif bir tam sayı olmalıdır'),
    query('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Tedarikçi ID pozitif bir tam sayı olmalıdır'),
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('Aktif durumu boolean değer olmalıdır'),
    query('is_raw_material')
      .optional()
      .isBoolean()
      .withMessage('Hammadde durumu boolean değer olmalıdır'),
    query('is_finished_product')
      .optional()
      .isBoolean()
      .withMessage('Bitmiş ürün durumu boolean değer olmalıdır')
  ],

  /**
   * Validate product creation data
   */
  validateProductCreate: [
    body('sku')
      .notEmpty()
      .withMessage('SKU gereklidir')
      .isLength({ min: 2, max: 50 })
      .withMessage('SKU 2 ile 50 karakter arasında olmalıdır')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage(
        'SKU sadece harf, rakam, tire ve alt çizgi içerebilir'
      ),
    body('name')
      .notEmpty()
      .withMessage('Ürün adı gereklidir')
      .isLength({ min: 2, max: 200 })
      .withMessage('Ürün adı 2 ile 200 karakter arasında olmalıdır'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Açıklama 1000 karakteri geçemez'),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Barkod 50 karakteri geçemez'),
    body('category_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Kategori ID pozitif bir tam sayı olmalıdır'),
    body('product_type_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('Ürün tipi ID pozitif bir tam sayı olmalıdır'),
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
    /* body('sku')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('[VALIDATION_FAILED] SKU alanı 2-50 karakter arasında olmalıdır. Mevcut değer geçersiz.')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage(
        '[VALIDATION_FAILED] SKU sadece harf, rakam, tire (-) ve alt çizgi (_) karakterleri içerebilir.'
      ),
    body('name')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('[VALIDATION_FAILED] Ürün adı 2-200 karakter arasında olmalıdır. Mevcut değer geçersiz.'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('[VALIDATION_FAILED] Açıklama 1000 karakteri geçemez. Mevcut değer çok uzun.'),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('[VALIDATION_FAILED] Barkod 50 karakteri geçemez. Mevcut değer çok uzun.'),
    body('category_id')
      .optional()
      .custom(value => {
        if (value === '' || value === null || value === undefined) return true
        return Number.isInteger(Number(value)) && Number(value) > 0
      })
      .withMessage('[VALIDATION_FAILED] Kategori ID pozitif bir tam sayı olmalıdır. Mevcut değer geçersiz.'),
    body('product_type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('[VALIDATION_FAILED] Ürün tipi ID pozitif bir tam sayı olmalıdır. Mevcut değer geçersiz.'),
    body('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('[VALIDATION_FAILED] Tedarikçi ID pozitif bir tam sayı olmalıdır. Mevcut değer geçersiz.'),
    body('unit_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('[VALIDATION_FAILED] Birim fiyat negatif olamaz. Mevcut değer geçersiz.'),
    body('cost_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('[VALIDATION_FAILED] Maliyet fiyatı negatif olamaz. Mevcut değer geçersiz.'),
    body('unit_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('[VALIDATION_FAILED] Birim ID pozitif bir tam sayı olmalıdır. Mevcut değer geçersiz.'),
    body('min_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0
      })
      .withMessage('[VALIDATION_FAILED] Minimum stok seviyesi negatif olamaz. Mevcut değer geçersiz.'),
    body('max_stock_level')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0
      })
      .withMessage('[VALIDATION_FAILED] Maksimum stok seviyesi negatif olamaz. Mevcut değer geçersiz.'),
    body('reorder_point')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0
      })
      .withMessage('[VALIDATION_FAILED] Yeniden sipariş noktası negatif olamaz. Mevcut değer geçersiz.'),
    body('reorder_quantity')
      .optional()
      .custom(value => {
        if (value === null || value === undefined || value === '') return true
        return !isNaN(parseFloat(value)) && parseFloat(value) >= 0
      })
      .withMessage('[VALIDATION_FAILED] Yeniden sipariş miktarı negatif olamaz. Mevcut değer geçersiz.'),
    body('is_raw_material')
      .optional()
      .isBoolean()
      .withMessage('[VALIDATION_FAILED] Hammadde durumu boolean (true/false) değer olmalıdır. Mevcut değer geçersiz.'),
    body('is_finished_product')
      .optional()
      .isBoolean()
      .withMessage('[VALIDATION_FAILED] Bitmiş ürün durumu boolean (true/false) değer olmalıdır. Mevcut değer geçersiz.'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('[VALIDATION_FAILED] Aktif durumu boolean (true/false) değer olmalıdır. Mevcut değer geçersiz.') */
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
          `[VALIDATION_FAILED] STOK_TUTARSIZLIĞI: Minimum stok seviyesi maksimum stok seviyesinden büyük olamaz. Min: ${min_stock_level}, Max: ${max_stock_level}`
        )
      }

      // eslint-disable-next-line camelcase
      if (reorder_point && min_stock_level && reorder_point < min_stock_level) {
        throw new Error(
          `[VALIDATION_FAILED] STOK_TUTARSIZLIĞI: Yeniden sipariş noktası minimum stok seviyesinden düşük olmamalıdır. Reorder: ${reorder_point}, Min: ${min_stock_level}`
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

      // At least one price should be provided
      // eslint-disable-next-line camelcase
      if (!unit_price && !cost_price) {
        throw new Error('[VALIDATION_FAILED] FİYAT_TUTARSIZLIĞI: Birim fiyat veya maliyet fiyatından en az biri sağlanmalıdır.')
      }

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

      // A product cannot be both raw material and finished product
      // eslint-disable-next-line camelcase
      if (is_raw_material && is_finished_product) {
        throw new Error(
          '[VALIDATION_FAILED] ÜRÜN_TİPİ_TUTARSIZLIĞI: Bir ürün hem hammadde hem de bitmiş ürün olamaz.'
        )
      }

      return true
    })
  ]
}

module.exports = productsValidators
