const employeeService = require('../services/employees')
const { validationResult } = require('express-validator')
const logger = require('../utils/logger')

/**
 * Get all employees with pagination and filtering
 */
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query

    const result = await employeeService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    })

    res.json(result)
  } catch (error) {
    logger.error('Error getting employees:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch employees'
    })
  }
}

/**
 * Get all employee positions
 */
const getPositions = async (req, res) => {
  try {
    const positions = await employeeService.getPositions()
    res.json(positions)
  } catch (error) {
    logger.error('Error getting positions:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch positions'
    })
  }
}

/**
 * Get all employee departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await employeeService.getDepartments()
    res.json(departments)
  } catch (error) {
    logger.error('Error getting departments:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch departments'
    })
  }
}

/**
 * Get employee by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params
    const employee = await employeeService.getById(id)

    if (!employee) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Employee not found'
      })
    }

    res.json(employee)
  } catch (error) {
    logger.error('Error getting employee by ID:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch employee'
    })
  }
}

/**
 * Create new employee
 */
const create = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      })
    }

    const employeeData = {
      ...req.body,
      created_by: req.user.id
    }

    const employee = await employeeService.create(employeeData)

    logger.info(`Employee created: ${employee.id} by user ${req.user.id}`)
    res.status(201).json(employee)
  } catch (error) {
    logger.error('Error creating employee:', error)

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        error: 'Validation error',
        message: 'Employee with this email already exists'
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create employee'
    })
  }
}

/**
 * Update employee
 */
const update = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      })
    }

    const { id } = req.params
    const employeeData = {
      ...req.body,
      updated_by: req.user.id
    }

    const employee = await employeeService.update(id, employeeData)

    if (!employee) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Employee not found'
      })
    }

    logger.info(`Employee updated: ${id} by user ${req.user.id}`)
    res.json(employee)
  } catch (error) {
    logger.error('Error updating employee:', error)

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        error: 'Validation error',
        message: 'Employee with this email already exists'
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update employee'
    })
  }
}

/**
 * Delete employee
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await employeeService.delete(id)

    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Employee not found'
      })
    }

    logger.info(`Employee deleted: ${id} by user ${req.user.id}`)
    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    logger.error('Error deleting employee:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete employee'
    })
  }
}

module.exports = {
  getAll,
  getPositions,
  getDepartments,
  getById,
  create,
  update,
  delete: deleteEmployee
}