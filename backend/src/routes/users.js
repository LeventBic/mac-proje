const express = require('express')
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const { query } = require('../config/database')
const { requireAdmin, requireAuth } = require('../middleware/auth')
const { AppError } = require('../middleware/errorHandler')
const winston = require('winston')

const router = express.Router()

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, uuid, username, email, first_name, last_name, role, is_active, created_at, updated_at, last_login
       FROM users 
       ORDER BY created_at DESC`
    )

    const users = result.rows.map(user => ({
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    }))

    res.json({
      status: 'success',
      users: users
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
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
 */
router.post('/', requireAdmin, [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
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

    // Check if username or email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existingUser.rows.length > 0) {
      return next(new AppError('Username or email already exists', 409))
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (uuid, username, email, password_hash, first_name, last_name, role) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, lastName, role]
    )

    // Get the inserted user
    const result = await query(
      'SELECT id, uuid, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?',
      [insertResult.insertId]
    )

    const newUser = result.rows[0]

    winston.info(`New user created by admin: ${newUser.username}`, {
      userId: newUser.id,
      role: newUser.role,
      createdBy: req.user.id
    })

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: newUser.id,
        uuid: newUser.uuid,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.sqlMessage?.includes('username') ? 'username' : 'email'
      return next(new AppError(`${field} already exists`, 409))
    }
    next(error)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const result = await query(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive, id]
    )

    if (result.affectedRows === 0) {
      return next(new AppError('User not found', 404))
    }

    winston.info(`User status updated: ${id}`, {
      userId: id,
      isActive,
      updatedBy: req.user.id
    })

    res.json({
      status: 'success',
      message: 'User updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Cannot delete yourself
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const currentUserId = req.user.id

    // Prevent admin from deleting themselves
    if (parseInt(id) === currentUserId) {
      return next(new AppError('You cannot delete your own account', 403))
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    )

    if (userCheck.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    const userToDelete = userCheck.rows[0]

    // Delete user
    const result = await query(
      'DELETE FROM users WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return next(new AppError('User not found', 404))
    }

    winston.info(`User deleted: ${userToDelete.username}`, {
      deletedUserId: id,
      deletedUsername: userToDelete.username,
      deletedBy: req.user.id
    })

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Change own password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not allowed
 */
router.put('/:id/password', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const currentUserId = req.user.id;

    // Sadece kendi şifresini değiştirebilir
    if (parseInt(id) !== currentUserId) {
      return next(new AppError('You can only change your own password', 403));
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    // Kullanıcıyı bul
    const userResult = await query('SELECT id, password_hash FROM users WHERE id = ?', [id]);
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }
    const user = userResult.rows[0];

    // Eski şifre kontrolü (zorunlu yapabiliriz, isterseniz kaldırabiliriz)
    if (oldPassword) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return next(new AppError('Old password is incorrect', 400));
      }
    }

    // Yeni şifreyi hashle
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // SQL NULL hatası almamak için parametreyi kontrol et
    if (!newPasswordHash) {
      return next(new AppError('Password hash error', 500));
    }

    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, id]);

    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router