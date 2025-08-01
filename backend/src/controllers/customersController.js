const customersService = require('../services/customersService')
const { AppError } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

/**
 * Customers Controller
 * Handles HTTP requests for customer operations
 */

const customersController = {
  /**
   * Get all customers with filtering and pagination
   */
  async getCustomers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        is_active,
        customer_type,
        city,
        country
      } = req.query

      const filters = {
        search,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        customer_type,
        city,
        country
      }

      const result = await customersService.getCustomers({
        page: parseInt(page),
        limit: parseInt(limit),
        filters
      })

      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination
      })
    } catch (error) {
      logger.error('Error getting customers:', error)
      next(error)
    }
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params
      const customer = await customersService.getCustomerById(id)

      if (!customer) {
        return next(new AppError('Customer not found', 404))
      }

      res.json({
        success: true,
        data: customer
      })
    } catch (error) {
      logger.error('Error getting customer by ID:', error)
      next(error)
    }
  },

  /**
   * Create new customer
   */
  async createCustomer(req, res, next) {
    try {
      const customerData = req.body
      const customer = await customersService.createCustomer(customerData)

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      })
    } catch (error) {
      logger.error('Error creating customer:', error)
      if (error.code === '23505') { // Unique constraint violation
        return next(new AppError('Customer with this email or tax number already exists', 409))
      }
      next(error)
    }
  },

  /**
   * Update customer
   */
  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      const customer = await customersService.updateCustomer(id, updateData)

      if (!customer) {
        return next(new AppError('Customer not found', 404))
      }

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      })
    } catch (error) {
      logger.error('Error updating customer:', error)
      if (error.code === '23505') { // Unique constraint violation
        return next(new AppError('Customer with this email or tax number already exists', 409))
      }
      next(error)
    }
  },

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params
      const deleted = await customersService.deleteCustomer(id)

      if (!deleted) {
        return next(new AppError('Customer not found', 404))
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      })
    } catch (error) {
      logger.error('Error deleting customer:', error)
      next(error)
    }
  },

  /**
   * Search customers
   */
  async searchCustomers(req, res, next) {
    try {
      const { q: query, limit = 10 } = req.query
      const customers = await customersService.searchCustomers(query, parseInt(limit))

      res.json({
        success: true,
        data: customers
      })
    } catch (error) {
      logger.error('Error searching customers:', error)
      next(error)
    }
  },

  /**
   * Get customer orders
   */
  async getCustomerOrders(req, res, next) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10, status } = req.query

      const result = await customersService.getCustomerOrders(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      })

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      })
    } catch (error) {
      logger.error('Error getting customer orders:', error)
      next(error)
    }
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(req, res, next) {
    try {
      const { id } = req.params
      const stats = await customersService.getCustomerStats(id)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Error getting customer stats:', error)
      next(error)
    }
  },

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(req, res, next) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10, status } = req.query

      const result = await customersService.getCustomerInvoices(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      })

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination
      })
    } catch (error) {
      logger.error('Error getting customer invoices:', error)
      next(error)
    }
  },

  /**
   * Get customers summary
   */
  async getCustomersSummary(req, res, next) {
    try {
      const summary = await customersService.getCustomersSummary()

      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      logger.error('Error getting customers summary:', error)
      next(error)
    }
  }
}

module.exports = customersController