const suppliersService = require('../services/suppliersService')
const { AppError } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

/**
 * Suppliers Controller
 * Handles HTTP requests for supplier operations
 */

const suppliersController = {
  /**
   * Get all suppliers with filtering and pagination
   */
  async getSuppliers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        is_active,
        supplier_type,
        city,
        country
      } = req.query

      const filters = {
        search,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        supplier_type,
        city,
        country
      }

      const result = await suppliersService.getSuppliers({
        page: parseInt(page),
        limit: parseInt(limit),
        filters
      })

      res.json({
        success: true,
        data: result.suppliers,
        pagination: result.pagination
      })
    } catch (error) {
      logger.error('Error getting suppliers:', error)
      next(error)
    }
  },

  /**
   * Get supplier by ID
   */
  async getSupplierById(req, res, next) {
    try {
      const { id } = req.params
      const supplier = await suppliersService.getSupplierById(id)

      if (!supplier) {
        return next(new AppError('Supplier not found', 404))
      }

      res.json({
        success: true,
        data: supplier
      })
    } catch (error) {
      logger.error('Error getting supplier by ID:', error)
      next(error)
    }
  },

  /**
   * Create new supplier
   */
  async createSupplier(req, res, next) {
    try {
      const supplierData = req.body
      const supplier = await suppliersService.createSupplier(supplierData)

      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created successfully'
      })
    } catch (error) {
      logger.error('Error creating supplier:', error)
      if (error.code === '23505') { // Unique constraint violation
        return next(new AppError('Supplier with this email or tax number already exists', 409))
      }
      next(error)
    }
  },

  /**
   * Update supplier
   */
  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      const supplier = await suppliersService.updateSupplier(id, updateData)

      if (!supplier) {
        return next(new AppError('Supplier not found', 404))
      }

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully'
      })
    } catch (error) {
      logger.error('Error updating supplier:', error)
      if (error.code === '23505') { // Unique constraint violation
        return next(new AppError('Supplier with this email or tax number already exists', 409))
      }
      next(error)
    }
  },

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params
      const deleted = await suppliersService.deleteSupplier(id)

      if (!deleted) {
        return next(new AppError('Supplier not found', 404))
      }

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      })
    } catch (error) {
      logger.error('Error deleting supplier:', error)
      next(error)
    }
  },

  /**
   * Search suppliers
   */
  async searchSuppliers(req, res, next) {
    try {
      const { q: query, limit = 10 } = req.query
      const suppliers = await suppliersService.searchSuppliers(query, parseInt(limit))

      res.json({
        success: true,
        data: suppliers
      })
    } catch (error) {
      logger.error('Error searching suppliers:', error)
      next(error)
    }
  },

  /**
   * Get supplier purchase orders
   */
  async getSupplierOrders(req, res, next) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10, status } = req.query

      const result = await suppliersService.getSupplierOrders(id, {
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
      logger.error('Error getting supplier orders:', error)
      next(error)
    }
  },

  /**
   * Get supplier statistics
   */
  async getSupplierStats(req, res, next) {
    try {
      const { id } = req.params
      const stats = await suppliersService.getSupplierStats(id)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Error getting supplier stats:', error)
      next(error)
    }
  },

  /**
   * Get supplier products
   */
  async getSupplierProducts(req, res, next) {
    try {
      const { id } = req.params
      const { page = 1, limit = 20, search } = req.query

      const result = await suppliersService.getSupplierProducts(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      })

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      })
    } catch (error) {
      logger.error('Error getting supplier products:', error)
      next(error)
    }
  },

  /**
   * Get suppliers summary
   */
  async getSuppliersSummary(req, res, next) {
    try {
      const summary = await suppliersService.getSuppliersSummary()

      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      logger.error('Error getting suppliers summary:', error)
      next(error)
    }
  }
}

module.exports = suppliersController