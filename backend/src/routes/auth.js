const express = require('express')
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const { query } = require('../config/database')
const { AppError } = require('../middleware/errorHandler')
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth')
const winston = require('winston')

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username or email
 *         password:
 *           type: string
 *           description: User password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         token:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             role:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400))
    }

    const { username, password } = req.body

    // Find user by username or email
    const result = await query(
      'SELECT id, username, email, password_hash, first_name, last_name, role, is_active FROM users WHERE (username = ? OR email = ?) AND is_active = true',
      [username, username]
    )

    if (result.rows.length === 0) {
      return next(new AppError('Invalid credentials', 401))
    }

    const user = result.rows[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401))
    }

    // Generate tokens
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    // Log successful login
    winston.info(`User ${user.username} logged in successfully`, {
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }

    res.json({
      status: 'success',
      token,
      refreshToken,
      user: userData
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('First name can only contain letters'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Last name can only contain letters'),
  body('role')
    .isIn(['admin', 'operator', 'viewer'])
    .withMessage('Role must be admin, operator, or viewer')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      })
    }

    const { username, email, password, firstName, lastName, role } = req.body

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, lastName, role]
    )

    // Get the inserted user
    const result = await query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = ?',
      [insertResult.insertId]
    )

    const newUser = result.rows[0]

    winston.info(`New user registered: ${newUser.username}`, {
      userId: newUser.id,
      role: newUser.role
    })

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    })
  } catch (error) {
    if (error.code === '23505') {
      const field = error.detail?.includes('username') ? 'username' : 'email'
      return next(new AppError(`${field} already exists`, 409))
    }
    next(error)
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401))
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token', 401))
    }

    // Check if user still exists and is active
    const result = await query(
      'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return next(new AppError('User no longer exists or is inactive', 401))
    }

    const user = result.rows[0]

    // Generate new tokens
    const newToken = generateToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    res.json({
      status: 'success',
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid refresh token', 401))
    }
    next(error)
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req, res, next) => {
  try {
    // This endpoint requires authentication but we'll implement it later
    // when we have the auth middleware in place
    res.json({
      status: 'success',
      message: 'This endpoint requires authentication middleware'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router