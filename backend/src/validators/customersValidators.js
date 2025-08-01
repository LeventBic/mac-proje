const { body, param, query } = require('express-validator')

/**
 * Customers Validators
 * Input validation for customer operations
 */

const customersValidators = {
  /**
   * Validate customer ID parameter
   */
  validateCustomerId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Customer ID must be a positive integer')
  ],

  /**
   * Validate customers query parameters
   */
  validateCustomersQuery: [
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
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value'),
    query('customer_type')
      .optional()
      .isIn(['individual', 'corporate'])
      .withMessage('Customer type must be either individual or corporate'),
    query('city')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be between 1 and 100 characters'),
    query('country')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Country must be between 1 and 100 characters')
  ],

  /**
   * Validate customer creation data
   */
  validateCustomerCreate: [
    body('name')
      .notEmpty()
      .withMessage('Customer name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Customer name must be between 2 and 200 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-\.]+$/)
      .withMessage('Customer name can only contain letters, spaces, hyphens, and dots'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address cannot exceed 500 characters'),
    body('city')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('City can only contain letters, spaces, and hyphens'),
    body('state')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('State can only contain letters, spaces, and hyphens'),
    body('postal_code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Postal code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9\s\-]+$/i)
      .withMessage('Postal code can only contain letters, numbers, spaces, and hyphens'),
    body('country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('Country can only contain letters, spaces, and hyphens'),
    body('tax_number')
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage('Tax number must be between 5 and 50 characters')
      .matches(/^[A-Z0-9\-]+$/i)
      .withMessage('Tax number can only contain letters, numbers, and hyphens'),
    body('customer_type')
      .optional()
      .isIn(['individual', 'corporate'])
      .withMessage('Customer type must be either individual or corporate'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],

  /**
   * Validate customer update data
   */
  validateCustomerUpdate: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage('Customer name must be between 2 and 200 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-\.]+$/)
      .withMessage('Customer name can only contain letters, spaces, hyphens, and dots'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address cannot exceed 500 characters'),
    body('city')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('City can only contain letters, spaces, and hyphens'),
    body('state')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('State can only contain letters, spaces, and hyphens'),
    body('postal_code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Postal code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9\s\-]+$/i)
      .withMessage('Postal code can only contain letters, numbers, spaces, and hyphens'),
    body('country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-]+$/)
      .withMessage('Country can only contain letters, spaces, and hyphens'),
    body('tax_number')
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage('Tax number must be between 5 and 50 characters')
      .matches(/^[A-Z0-9\-]+$/i)
      .withMessage('Tax number can only contain letters, numbers, and hyphens'),
    body('customer_type')
      .optional()
      .isIn(['individual', 'corporate'])
      .withMessage('Customer type must be either individual or corporate'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean value'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],

  /**
   * Validate customer search query
   */
  validateCustomerSearch: [
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
   * Validate customer orders query parameters
   */
  validateCustomerOrdersQuery: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Customer ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'])
      .withMessage('Invalid order status')
  ],

  /**
   * Validate customer invoices query parameters
   */
  validateCustomerInvoicesQuery: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Customer ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .withMessage('Invalid invoice status')
  ],

  /**
   * Custom validation for Turkish tax number (TC Kimlik No or Vergi No)
   */
  validateTurkishTaxNumber: [
    body('tax_number')
      .optional()
      .custom((value) => {
        if (!value) return true
        
        // Turkish TC Kimlik No validation (11 digits)
        if (/^\d{11}$/.test(value)) {
          const digits = value.split('').map(Number)
          const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
          const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
          const check1 = (sum1 - sum2) % 10
          const check2 = (digits[0] + digits[1] + digits[2] + digits[3] + digits[4] + digits[5] + digits[6] + digits[7] + digits[8] + digits[9]) % 10
          
          if (check1 === digits[9] && check2 === digits[10]) {
            return true
          }
        }
        
        // Turkish Vergi No validation (10 digits)
        if (/^\d{10}$/.test(value)) {
          return true // Basic format validation for corporate tax number
        }
        
        // Allow other international formats
        if (/^[A-Z0-9\-]{5,50}$/i.test(value)) {
          return true
        }
        
        throw new Error('Invalid tax number format')
      })
  ],

  /**
   * Custom validation for email uniqueness (to be used with existing customer check)
   */
  validateEmailUniqueness: [
    body('email')
      .custom(async (value, { req }) => {
        // This validation should be handled in the service layer
        // as it requires database access
        return true
      })
  ],

  /**
   * Custom validation for customer type consistency
   */
  validateCustomerTypeConsistency: [
    body().custom((value) => {
      const { customer_type, tax_number } = value
      
      // Corporate customers should have tax number
      if (customer_type === 'corporate' && !tax_number) {
        console.warn('Corporate customers should have a tax number')
      }
      
      return true
    })
  ],

  /**
   * Custom validation for address completeness
   */
  validateAddressCompleteness: [
    body().custom((value) => {
      const { address, city, country } = value
      
      // If address is provided, city and country should also be provided
      if (address && (!city || !country)) {
        throw new Error('If address is provided, city and country are also required')
      }
      
      return true
    })
  ],

  /**
   * Validate phone number format for Turkish numbers
   */
  validateTurkishPhoneNumber: [
    body('phone')
      .optional()
      .custom((value) => {
        if (!value) return true
        
        // Turkish mobile number format: +90 5XX XXX XX XX or 05XX XXX XX XX
        const turkishMobileRegex = /^(\+90|0)?5\d{9}$/
        // Turkish landline format: +90 2XX XXX XX XX or 02XX XXX XX XX
        const turkishLandlineRegex = /^(\+90|0)?[2-4]\d{9}$/
        
        // Remove spaces and dashes for validation
        const cleanPhone = value.replace(/[\s\-]/g, '')
        
        if (turkishMobileRegex.test(cleanPhone) || turkishLandlineRegex.test(cleanPhone)) {
          return true
        }
        
        // Allow international formats
        if (/^\+\d{10,15}$/.test(cleanPhone)) {
          return true
        }
        
        throw new Error('Invalid phone number format')
      })
  ]
}

module.exports = customersValidators