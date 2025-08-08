const employeeRepository = require('../repositories/employees')
const logger = require('../utils/logger')

/**
 * Get all employees with pagination and filtering
 */
const getAll = async (options) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    const offset = (page - 1) * limit

    const result = await employeeRepository.findAll({
      limit,
      offset,
      search,
      sortBy,
      sortOrder
    })

    const total = await employeeRepository.count({ search })
    const pages = Math.ceil(total / limit)

    return {
      employees: result,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }
  } catch (error) {
    logger.error('Error in employee service getAll:', error)
    throw error
  }
}

/**
 * Get all unique employee positions
 */
const getPositions = async () => {
  try {
    return await employeeRepository.getUniquePositions()
  } catch (error) {
    logger.error('Error in employee service getPositions:', error)
    throw error
  }
}

/**
 * Get all unique employee departments
 */
const getDepartments = async () => {
  try {
    return await employeeRepository.getUniqueDepartments()
  } catch (error) {
    logger.error('Error in employee service getPositions:', error)
    throw error
  }
}

/**
 * Get employee by ID
 */
const getById = async (id) => {
  try {
    return await employeeRepository.findById(id)
  } catch (error) {
    logger.error('Error in employee service getById:', error)
    throw error
  }
}

/**
 * Create new employee
 */
const create = async (employeeData) => {
  try {
    // Set default values
    const employee = {
      ...employeeData,
      status: employeeData.status || 'active',
      created_at: new Date(),
      updated_at: new Date()
    }

    return await employeeRepository.create(employee)
  } catch (error) {
    logger.error('Error in employee service create:', error)
    throw error
  }
}

/**
 * Update employee
 */
const update = async (id, employeeData) => {
  try {
    const employee = {
      ...employeeData,
      updated_at: new Date()
    }

    return await employeeRepository.update(id, employee)
  } catch (error) {
    logger.error('Error in employee service update:', error)
    throw error
  }
}

/**
 * Delete employee
 */
const deleteEmployee = async (id) => {
  try {
    return await employeeRepository.delete(id)
  } catch (error) {
    logger.error('Error in employee service delete:', error)
    throw error
  }
}

/**
 * Get employee statistics
 */
const getStats = async () => {
  try {
    const total = await employeeRepository.count({})
    const active = await employeeRepository.countByStatus('active')
    const inactive = await employeeRepository.countByStatus('inactive')
    const byDepartment = await employeeRepository.countByDepartment()
    const byPosition = await employeeRepository.countByPosition()

    return {
      total,
      active,
      inactive,
      byDepartment,
      byPosition
    }
  } catch (error) {
    logger.error('Error in employee service getStats:', error)
    throw error
  }
}

module.exports = {
  getAll,
  getPositions,
  getDepartments,
  getById,
  create,
  update,
  delete: deleteEmployee,
  getStats
}