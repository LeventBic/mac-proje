const pool = require('../config/database')
const logger = require('../utils/logger')

/**
 * Find all employees with filtering and pagination
 */
const findAll = async (options) => {
  try {
    const {
      limit = 10,
      offset = 0,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    let query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        position,
        department,
        hire_date,
        salary,
        iban,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM employees
    `

    const params = []
    let paramIndex = 1

    if (search) {
      query += ` WHERE (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        position ILIKE $${paramIndex} OR 
        department ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Add sorting
    const validSortFields = ['id', 'first_name', 'last_name', 'email', 'position', 'department', 'hire_date', 'salary', 'status', 'created_at', 'updated_at']
    const validSortOrders = ['asc', 'desc']

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC'

    query += ` ORDER BY ${sortField} ${sortDirection}`

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    logger.error('Error in employee repository findAll:', error)
    throw error
  }
}

/**
 * Count employees with optional search filter
 */
const count = async (options) => {
  try {
    const { search = '' } = options

    let query = 'SELECT COUNT(*) FROM employees'
    const params = []

    if (search) {
      query += ` WHERE (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        position ILIKE $1 OR 
        department ILIKE $1
      )`
      params.push(`%${search}%`)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  } catch (error) {
    logger.error('Error in employee repository count:', error)
    throw error
  }
}

/**
 * Find employee by ID
 */
const findById = async (id) => {
  try {
    const query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        position,
        department,
        hire_date,
        salary,
        iban,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM employees 
      WHERE id = $1
    `

    const result = await pool.query(query, [id])
    return result.rows[0] || null
  } catch (error) {
    logger.error('Error in employee repository findById:', error)
    throw error
  }
}

/**
 * Create new employee
 */
const create = async (employeeData) => {
  try {
    const {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      position,
      department,
      hire_date: hireDate,
      salary,
      iban,
      status = 'active',
      created_by: createdBy
    } = employeeData

    const query = `
      INSERT INTO employees (
        first_name, last_name, email, phone, position, department,
        hire_date, salary, iban, status, created_at, updated_at, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11
      ) RETURNING *
    `

    const params = [
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      hireDate,
      salary,
      iban,
      status,
      createdBy
    ]

    const result = await pool.query(query, params)
    return result.rows[0]
  } catch (error) {
    logger.error('Error in employee repository create:', error)
    throw error
  }
}

/**
 * Update employee
 */
const update = async (id, employeeData) => {
  try {
    const {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      position,
      department,
      hire_date: hireDate,
      salary,
      iban,
      status,
      updated_by: updatedBy
    } = employeeData

    const query = `
      UPDATE employees SET
        first_name = $2,
        last_name = $3,
        email = $4,
        phone = $5,
        position = $6,
        department = $7,
        hire_date = $8,
        salary = $9,
        iban = $10,
        status = $11,
        updated_at = NOW(),
        updated_by = $12
      WHERE id = $1
      RETURNING *
    `

    const params = [
      id,
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      hireDate,
      salary,
      iban,
      status,
      updatedBy
    ]

    const result = await pool.query(query, params)
    return result.rows[0] || null
  } catch (error) {
    logger.error('Error in employee repository update:', error)
    throw error
  }
}

/**
 * Delete employee
 */
const deleteEmployee = async (id) => {
  try {
    const query = 'DELETE FROM employees WHERE id = $1 RETURNING id'
    const result = await pool.query(query, [id])
    return result.rows.length > 0
  } catch (error) {
    logger.error('Error in employee repository delete:', error)
    throw error
  }
}

/**
 * Get unique positions from employees
 */
const getUniquePositions = async () => {
  try {
    const query = `
      SELECT DISTINCT position
      FROM employees
      WHERE position IS NOT NULL
      ORDER BY position
    `

    const result = await pool.query(query)
    return result.rows.map(row => row.position)
  } catch (error) {
    logger.error('Error getting unique positions:', error)
    throw error
  }
}

/**
 * Get unique departments from employees
 */
const getUniqueDepartments = async () => {
  try {
    const query = `
      SELECT DISTINCT department
      FROM employees
      WHERE department IS NOT NULL
      ORDER BY department
    `

    const result = await pool.query(query)
    return result.rows.map(row => row.department)
  } catch (error) {
    logger.error('Error getting unique departments:', error)
    throw error
  }
}

/**
 * Count employees by status
 */
const countByStatus = async (status) => {
  try {
    const query = 'SELECT COUNT(*) FROM employees WHERE status = $1'
    const result = await pool.query(query, [status])
    return parseInt(result.rows[0].count)
  } catch (error) {
    logger.error('Error in employee repository countByStatus:', error)
    throw error
  }
}

/**
 * Count employees by department
 */
const countByDepartment = async () => {
  try {
    const query = `
      SELECT department, COUNT(*) as count
      FROM employees 
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY count DESC
    `

    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    logger.error('Error in employee repository countByDepartment:', error)
    throw error
  }
}

/**
 * Count employees by position
 */
const countByPosition = async () => {
  try {
    const query = `
      SELECT position, COUNT(*) as count
      FROM employees 
      WHERE position IS NOT NULL AND position != ''
      GROUP BY position
      ORDER BY count DESC
    `

    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    logger.error('Error in employee repository countByPosition:', error)
    throw error
  }
}

module.exports = {
  findAll,
  count,
  findById,
  create,
  update,
  delete: deleteEmployee,
  getUniquePositions,
  getUniqueDepartments,
  countByStatus,
  countByDepartment,
  countByPosition
}