const express = require('express')
const { validationResult } = require('express-validator')
const customersController = require('../controllers/customersController')
const customersValidators = require('../validators/customersValidators')
const { AppError } = require('../middleware/errorHandler')
const { requireAdminOrOperator, requireAuth } = require('../middleware/auth')

const router = express.Router()

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()))
  }
  next()
}

// Get all customers with filtering and pagination
router.get('/', 
  requireAuth,
  customersValidators.validateCustomersQuery,
  handleValidationErrors,
  customersController.getCustomers
)

// Search customers
router.get('/search',
  requireAuth,
  customersValidators.validateCustomerSearch,
  handleValidationErrors,
  customersController.searchCustomers
)

// Get customers summary
router.get('/summary',
  requireAuth,
  customersController.getCustomersSummary
)

// Get customer by ID
router.get('/:id',
  requireAuth,
  customersValidators.validateCustomerId,
  handleValidationErrors,
  customersController.getCustomerById
)

// Create new customer
router.post('/',
  requireAdminOrOperator,
  customersValidators.validateCustomerCreate,
  customersValidators.validateCustomerTypeConsistency,
  customersValidators.validateAddressCompleteness,
  customersValidators.validateTurkishTaxNumber,
  customersValidators.validateTurkishPhoneNumber,
  handleValidationErrors,
  customersController.createCustomer
)

// Update customer
router.put('/:id',
  requireAdminOrOperator,
  customersValidators.validateCustomerId,
  customersValidators.validateCustomerUpdate,
  customersValidators.validateCustomerTypeConsistency,
  customersValidators.validateAddressCompleteness,
  customersValidators.validateTurkishTaxNumber,
  customersValidators.validateTurkishPhoneNumber,
  handleValidationErrors,
  customersController.updateCustomer
)

// Delete customer
router.delete('/:id',
  requireAdminOrOperator,
  customersValidators.validateCustomerId,
  handleValidationErrors,
  customersController.deleteCustomer
)

// Get customer orders
router.get('/:id/orders',
  requireAuth,
  customersValidators.validateCustomerOrdersQuery,
  handleValidationErrors,
  customersController.getCustomerOrders
)

// Get customer statistics
router.get('/:id/stats',
  requireAuth,
  customersValidators.validateCustomerId,
  handleValidationErrors,
  customersController.getCustomerStats
)

// Get customer invoices
router.get('/:id/invoices',
  requireAuth,
  customersValidators.validateCustomerInvoicesQuery,
  handleValidationErrors,
  customersController.getCustomerInvoices
)

module.exports = router