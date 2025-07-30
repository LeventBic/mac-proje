const winston = require('winston')

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401)

// Send error response for development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  })
}

// Send error response for production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    // Programming or other unknown error: don't leak error details
    winston.error('ERROR 💥', err)
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    })
  }
}

// PostgreSQL specific error handling
const handlePostgreSQLError = (err) => {
  switch (err.code) {
    case '23505': // unique_violation
      const field = err.detail?.match(/Key \((.+?)\)=/)?.[1]
      return new AppError(`${field} already exists`, 409)
    
    case '23503': // foreign_key_violation
      return new AppError('Referenced record not found', 400)
    
    case '23502': // not_null_violation
      return new AppError(`${err.column} is required`, 400)
    
    case '22P02': // invalid_text_representation
      return new AppError('Invalid data format', 400)
    
    case '42703': // undefined_column
      return new AppError('Invalid field specified', 400)
    
    default:
      return new AppError('Database error occurred', 500)
  }
}

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else {
    let error = { ...err, message: err.message }

    // Handle PostgreSQL errors
    if (err.code && typeof err.code === 'string') {
      error = handlePostgreSQLError(err)
    }

    // Handle other specific errors
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (error.name === 'JsonWebTokenError') error = handleJWTError()
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

    sendErrorProd(error, res)
  }
}

module.exports = errorHandler
module.exports.AppError = AppError