const customersRepository = require('../repositories/customersRepository')
const { AppError } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

/**
 * Customers Service
 * Business logic for customer operations
 */

const customersService = {
  /**
   * Get all customers with filtering and pagination
   */
  async getCustomers({ page = 1, limit = 20, filters = {} }) {
    try {
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new AppError('Invalid pagination parameters', 400)
      }

      const offset = (page - 1) * limit
      
      // Get customers and total count
      const [customers, totalCount] = await Promise.all([
        customersRepository.findCustomers({ ...filters, limit, offset }),
        customersRepository.getCustomersCount(filters)
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        customers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      logger.error('Error in getCustomers service:', error)
      throw error
    }
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    try {
      if (!id) {
        throw new AppError('Customer ID is required', 400)
      }

      const customer = await customersRepository.findCustomerById(id)
      return customer
    } catch (error) {
      logger.error('Error in getCustomerById service:', error)
      throw error
    }
  },

  /**
   * Create new customer
   */
  async createCustomer(customerData) {
    try {
      // Validate required fields
      if (!customerData.name) {
        throw new AppError('Customer name is required', 400)
      }

      if (!customerData.email) {
        throw new AppError('Customer email is required', 400)
      }

      // Check if customer with email already exists
      const existingCustomer = await customersRepository.findCustomerByEmail(customerData.email)
      if (existingCustomer) {
        throw new AppError('Customer with this email already exists', 409)
      }

      // Check if tax number is provided and unique
      if (customerData.tax_number) {
        const existingTaxNumber = await customersRepository.findCustomerByTaxNumber(customerData.tax_number)
        if (existingTaxNumber) {
          throw new AppError('Customer with this tax number already exists', 409)
        }
      }

      // Set default values
      const customerToCreate = {
        ...customerData,
        is_active: customerData.is_active !== undefined ? customerData.is_active : true,
        customer_type: customerData.customer_type || 'individual',
        created_at: new Date(),
        updated_at: new Date()
      }

      const customer = await customersRepository.createCustomer(customerToCreate)
      
      logger.info(`Customer created successfully: ${customer.id}`)
      return customer
    } catch (error) {
      logger.error('Error in createCustomer service:', error)
      throw error
    }
  },

  /**
   * Update customer
   */
  async updateCustomer(id, updateData) {
    try {
      if (!id) {
        throw new AppError('Customer ID is required', 400)
      }

      // Check if customer exists
      const existingCustomer = await customersRepository.findCustomerById(id)
      if (!existingCustomer) {
        throw new AppError('Customer not found', 404)
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingCustomer.email) {
        const emailExists = await customersRepository.findCustomerByEmail(updateData.email)
        if (emailExists) {
          throw new AppError('Customer with this email already exists', 409)
        }
      }

      // Check tax number uniqueness if tax number is being updated
      if (updateData.tax_number && updateData.tax_number !== existingCustomer.tax_number) {
        const taxNumberExists = await customersRepository.findCustomerByTaxNumber(updateData.tax_number)
        if (taxNumberExists) {
          throw new AppError('Customer with this tax number already exists', 409)
        }
      }

      // Add updated timestamp
      const dataToUpdate = {
        ...updateData,
        updated_at: new Date()
      }

      const customer = await customersRepository.updateCustomer(id, dataToUpdate)
      
      logger.info(`Customer updated successfully: ${id}`)
      return customer
    } catch (error) {
      logger.error('Error in updateCustomer service:', error)
      throw error
    }
  },

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id) {
    try {
      if (!id) {
        throw new AppError('Customer ID is required', 400)
      }

      // Check if customer exists
      const existingCustomer = await customersRepository.findCustomerById(id)
      if (!existingCustomer) {
        return false
      }

      const deleted = await customersRepository.deleteCustomer(id)
      
      if (deleted) {
        logger.info(`Customer deleted successfully: ${id}`)
      }
      
      return deleted
    } catch (error) {
      logger.error('Error in deleteCustomer service:', error)
      throw error
    }
  },

  /**
   * Search customers
   */
  async searchCustomers(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        throw new AppError('Search query must be at least 2 characters', 400)
      }

      const customers = await customersRepository.searchCustomers(query.trim(), limit)
      return customers
    } catch (error) {
      logger.error('Error in searchCustomers service:', error)
      throw error
    }
  },

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId, { page = 1, limit = 10, status }) {
    try {
      if (!customerId) {
        throw new AppError('Customer ID is required', 400)
      }

      // Check if customer exists
      const customer = await customersRepository.findCustomerById(customerId)
      if (!customer) {
        throw new AppError('Customer not found', 404)
      }

      const offset = (page - 1) * limit
      
      const [orders, totalCount] = await Promise.all([
        customersRepository.getCustomerOrders(customerId, { limit, offset, status }),
        customersRepository.getCustomerOrdersCount(customerId, status)
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      logger.error('Error in getCustomerOrders service:', error)
      throw error
    }
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId) {
    try {
      if (!customerId) {
        throw new AppError('Customer ID is required', 400)
      }

      // Check if customer exists
      const customer = await customersRepository.findCustomerById(customerId)
      if (!customer) {
        throw new AppError('Customer not found', 404)
      }

      const stats = await customersRepository.getCustomerStats(customerId)
      return stats
    } catch (error) {
      logger.error('Error in getCustomerStats service:', error)
      throw error
    }
  },

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId, { page = 1, limit = 10, status }) {
    try {
      if (!customerId) {
        throw new AppError('Customer ID is required', 400)
      }

      // Check if customer exists
      const customer = await customersRepository.findCustomerById(customerId)
      if (!customer) {
        throw new AppError('Customer not found', 404)
      }

      const offset = (page - 1) * limit
      
      const [invoices, totalCount] = await Promise.all([
        customersRepository.getCustomerInvoices(customerId, { limit, offset, status }),
        customersRepository.getCustomerInvoicesCount(customerId, status)
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        invoices,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      logger.error('Error in getCustomerInvoices service:', error)
      throw error
    }
  },

  /**
   * Get customers summary
   */
  async getCustomersSummary() {
    try {
      const summary = await customersRepository.getCustomersSummary()
      return summary
    } catch (error) {
      logger.error('Error in getCustomersSummary service:', error)
      throw error
    }
  }
}

module.exports = customersService