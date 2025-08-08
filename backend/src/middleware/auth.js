const jwt = require('jsonwebtoken')
const { query } = require('../config/database')
const { AppError } = require('./errorHandler')
const logger = require('../utils/logger')

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    logger.debug(`Auth start ${req.method} ${req.path}`)

    // Get token from header
    let token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      logger.warn('Auth: No token provided')
      return next(new AppError('Access token is required', 401))
    }

    logger.debug('Auth: Token found, verifying...')
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    logger.debug(`Auth: Token decoded for user ID: ${decoded.userId}`)

    // Get user from database
    const result = await query(
      'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      logger.warn(`Auth: User ${decoded.userId} not found`)
      return next(new AppError('User no longer exists', 401))
    }

    const user = result.rows[0]
    logger.debug(
      `Auth: User found: ${user.username}, role: ${user.role}, active: ${user.is_active}`
    )

    if (!user.is_active) {
      logger.warn(`Auth: User ${user.username} is not active`)
      return next(new AppError('User account is disabled', 401))
    }

    // Add user to request object
    req.user = user
    logger.info(`Auth success for ${user.username}`)
    next()
  } catch (error) {
    logger.warn(`Auth error: ${error.message}`)
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401))
    }
    return next(error)
  }
}

// Check user role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied. No user found.', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403))
    }

    next()
  }
}

// Check if user is admin (with authentication)
const requireAdmin = [verifyToken, requireRole('admin')]

// Check if user is admin or operator (with authentication)
const requireAdminOrOperator = [verifyToken, requireRole('admin', 'operator')]

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const result = await query(
        'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      )

      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = result.rows[0]
      }
    }

    next()
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next()
  }
}

// Generate JWT token
const generateToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  })
}

// Generate refresh token
const generateRefreshToken = userId => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

// Verify refresh token
const verifyRefreshToken = token => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  )
}

module.exports = {
  verifyToken,
  requireAuth: verifyToken, // Alias for verifyToken
  requireRole,
  requireAdmin,
  requireAdminOrOperator,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
}
