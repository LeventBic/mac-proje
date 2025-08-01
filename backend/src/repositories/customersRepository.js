const { query } = require('../config/database')
const logger = require('../utils/logger')

/**
 * Customers Repository
 * Data access layer for customer operations
 */

const customersRepository = {
  /**
   * Find customers with filters
   */
  async findCustomers({ search, is_active, customer_type, city, country, limit, offset }) {
    try {
      let whereConditions = ['1=1']
      let queryParams = []
      let paramIndex = 1

      if (search) {
        whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex + 1} OR c.phone ILIKE $${paramIndex + 2})`)
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
        paramIndex += 3
      }

      if (is_active !== undefined) {
        whereConditions.push(`c.is_active = $${paramIndex}`)
        queryParams.push(is_active)
        paramIndex++
      }

      if (customer_type) {
        whereConditions.push(`c.customer_type = $${paramIndex}`)
        queryParams.push(customer_type)
        paramIndex++
      }

      if (city) {
        whereConditions.push(`c.city ILIKE $${paramIndex}`)
        queryParams.push(`%${city}%`)
        paramIndex++
      }

      if (country) {
        whereConditions.push(`c.country ILIKE $${paramIndex}`)
        queryParams.push(`%${country}%`)
        paramIndex++
      }

      const whereClause = whereConditions.length > 1 ? 'WHERE ' + whereConditions.join(' AND ') : ''

      const sql = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.address,
          c.city,
          c.state,
          c.postal_code,
          c.country,
          c.tax_number,
          c.customer_type,
          c.is_active,
          c.notes,
          c.created_at,
          c.updated_at,
          COUNT(so.id) as total_orders,
          COALESCE(SUM(so.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status != 'cancelled'
        ${whereClause}
        GROUP BY c.id, c.name, c.email, c.phone, c.address, c.city, c.state, c.postal_code, c.country, c.tax_number, c.customer_type, c.is_active, c.notes, c.created_at, c.updated_at
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      queryParams.push(limit, offset)
      const result = await query(sql, queryParams)
      return result.rows
    } catch (error) {
      logger.error('Error in findCustomers repository:', error)
      throw error
    }
  },

  /**
   * Get customers count with filters
   */
  async getCustomersCount({ search, is_active, customer_type, city, country }) {
    try {
      let whereClause = 'WHERE 1=1'
      const queryParams = []
      let paramIndex = 1

      // Add search filter
      if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR tax_number ILIKE $${paramIndex})`
        queryParams.push(`%${search}%`)
        paramIndex++
      }

      // Add active filter
      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex}`
        queryParams.push(is_active)
        paramIndex++
      }

      // Add customer type filter
      if (customer_type) {
        whereClause += ` AND customer_type = $${paramIndex}`
        queryParams.push(customer_type)
        paramIndex++
      }

      // Add city filter
      if (city) {
        whereClause += ` AND city ILIKE $${paramIndex}`
        queryParams.push(`%${city}%`)
        paramIndex++
      }

      // Add country filter
      if (country) {
        whereClause += ` AND country ILIKE $${paramIndex}`
        queryParams.push(`%${country}%`)
        paramIndex++
      }

      const sql = `SELECT COUNT(*) as count FROM customers ${whereClause}`
      const result = await query(sql, queryParams)
      return parseInt(result.rows[0].count)
    } catch (error) {
      logger.error('Error in getCustomersCount repository:', error)
      throw error
    }
  },

  /**
   * Find customer by ID
   */
  async findCustomerById(id) {
    try {
      const sql = `
        SELECT 
          c.*,
          COUNT(so.id) as total_orders,
          COALESCE(SUM(so.total_amount), 0) as total_spent,
          MAX(so.created_at) as last_order_date
        FROM customers c
        LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status != 'cancelled'
        WHERE c.id = $1
        GROUP BY c.id
      `
      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in findCustomerById repository:', error)
      throw error
    }
  },

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email) {
    try {
      const sql = 'SELECT * FROM customers WHERE email = $1'
      const result = await query(sql, [email])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in findCustomerByEmail repository:', error)
      throw error
    }
  },

  /**
   * Find customer by tax number
   */
  async findCustomerByTaxNumber(taxNumber) {
    try {
      const sql = 'SELECT * FROM customers WHERE tax_number = $1'
      const result = await query(sql, [taxNumber])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in findCustomerByTaxNumber repository:', error)
      throw error
    }
  },

  /**
   * Create new customer
   */
  async createCustomer(customerData) {
    try {
      const {
        name, email, phone, address, city, state, postal_code, country,
        tax_number, customer_type, is_active, notes
      } = customerData

      const sql = `
        INSERT INTO customers (
          name, email, phone, address, city, state, postal_code, country,
          tax_number, customer_type, is_active, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `

      const values = [
        name, email, phone || null, address || null, city || null,
        state || null, postal_code || null, country || null,
        tax_number || null, customer_type || 'individual',
        is_active !== undefined ? is_active : true, notes || null
      ]

      const result = await query(sql, values)
      return result.rows[0]
    } catch (error) {
      logger.error('Error in createCustomer repository:', error)
      throw error
    }
  },

  /**
   * Update customer
   */
  async updateCustomer(id, updateData) {
    try {
      const updateFields = []
      const queryParams = []
      let paramIndex = 1

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          updateFields.push(`${key} = $${paramIndex}`)
          queryParams.push(updateData[key])
          paramIndex++
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      // Add updated_at
      updateFields.push(`updated_at = NOW()`)
      
      // Add ID parameter
      queryParams.push(id)

      const sql = `
        UPDATE customers 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      const result = await query(sql, queryParams)
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in updateCustomer repository:', error)
      throw error
    }
  },

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id) {
    try {
      const sql = `
        UPDATE customers 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND is_active = true
      `
      const result = await query(sql, [id])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Error in deleteCustomer repository:', error)
      throw error
    }
  },

  /**
   * Search customers
   */
  async searchCustomers(searchQuery, limit) {
    try {
      const sql = `
        SELECT id, name, email, phone, city, customer_type
        FROM customers
        WHERE is_active = true
          AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR tax_number ILIKE $1)
        ORDER BY name
        LIMIT $2
      `
      const result = await query(sql, [`%${searchQuery}%`, limit])
      return result.rows
    } catch (error) {
      logger.error('Error in searchCustomers repository:', error)
      throw error
    }
  },

  /**
   * Check if customer has active orders
   */
  async hasActiveOrders(customerId) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM sales_orders
        WHERE customer_id = $1 AND status IN ('pending', 'processing', 'shipped')
      `
      const result = await query(sql, [customerId])
      return parseInt(result.rows[0].count) > 0
    } catch (error) {
      logger.error('Error in hasActiveOrders repository:', error)
      throw error
    }
  },

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId, { limit, offset, status }) {
    try {
      let whereClause = 'WHERE customer_id = $1'
      const queryParams = [customerId]
      let paramIndex = 2

      if (status) {
        whereClause += ` AND status = $${paramIndex}`
        queryParams.push(status)
        paramIndex++
      }

      whereClause += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      queryParams.push(limit, offset)

      const sql = `
        SELECT 
          id, order_number, status, total_amount, 
          created_at, updated_at, delivery_date
        FROM sales_orders
        ${whereClause}
      `

      const result = await query(sql, queryParams)
      return result.rows
    } catch (error) {
      logger.error('Error in getCustomerOrders repository:', error)
      throw error
    }
  },

  /**
   * Get customer orders count
   */
  async getCustomerOrdersCount(customerId, status) {
    try {
      let whereClause = 'WHERE customer_id = $1'
      const queryParams = [customerId]

      if (status) {
        whereClause += ' AND status = $2'
        queryParams.push(status)
      }

      const sql = `SELECT COUNT(*) as count FROM sales_orders ${whereClause}`
      const result = await query(sql, queryParams)
      return parseInt(result.rows[0].count)
    } catch (error) {
      logger.error('Error in getCustomerOrdersCount repository:', error)
      throw error
    }
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId) {
    try {
      const sql = `
        SELECT 
          COUNT(so.id) as total_orders,
          COALESCE(SUM(so.total_amount), 0) as total_spent,
          COALESCE(AVG(so.total_amount), 0) as average_order_value,
          MAX(so.created_at) as last_order_date,
          MIN(so.created_at) as first_order_date,
          COUNT(CASE WHEN so.status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN so.status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN so.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as orders_last_30_days
        FROM sales_orders so
        WHERE so.customer_id = $1
      `
      const result = await query(sql, [customerId])
      return result.rows[0]
    } catch (error) {
      logger.error('Error in getCustomerStats repository:', error)
      throw error
    }
  },

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId, { limit, offset, status }) {
    try {
      let whereClause = 'WHERE i.customer_id = $1'
      const queryParams = [customerId]
      let paramIndex = 2

      if (status) {
        whereClause += ` AND i.status = $${paramIndex}`
        queryParams.push(status)
        paramIndex++
      }

      whereClause += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      queryParams.push(limit, offset)

      const sql = `
        SELECT 
          i.id, i.invoice_number, i.status, i.total_amount,
          i.due_date, i.created_at, i.updated_at
        FROM invoices i
        ${whereClause}
      `

      const result = await query(sql, queryParams)
      return result.rows
    } catch (error) {
      logger.error('Error in getCustomerInvoices repository:', error)
      throw error
    }
  },

  /**
   * Get customer invoices count
   */
  async getCustomerInvoicesCount(customerId, status) {
    try {
      let whereClause = 'WHERE customer_id = $1'
      const queryParams = [customerId]

      if (status) {
        whereClause += ' AND status = $2'
        queryParams.push(status)
      }

      const sql = `SELECT COUNT(*) as count FROM invoices ${whereClause}`
      const result = await query(sql, queryParams)
      return parseInt(result.rows[0].count)
    } catch (error) {
      logger.error('Error in getCustomerInvoicesCount repository:', error)
      throw error
    }
  },

  /**
   * Get customers summary
   */
  async getCustomersSummary() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_customers,
          COUNT(CASE WHEN customer_type = 'individual' THEN 1 END) as individual_customers,
          COUNT(CASE WHEN customer_type = 'corporate' THEN 1 END) as corporate_customers,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_last_30_days,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_customers_last_7_days
        FROM customers
      `
      const result = await query(sql)
      return result.rows[0]
    } catch (error) {
      logger.error('Error in getCustomersSummary repository:', error)
      throw error
    }
  }
}

module.exports = customersRepository