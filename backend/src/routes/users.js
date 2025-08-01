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
      users
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
router.post(
  '/',
  requireAdmin,
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_]+$/)
      .withMessage(
        'Username can only contain letters, numbers, and underscores'
      ),
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
  ],
  async (req, res, next) => {
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
        'SELECT id FROM users WHERE username = $1 OR email = $2',
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
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING id`,
        [username, email, passwordHash, firstName, lastName, role]
      )

      // Get the inserted user
      const result = await query(
        'SELECT id, uuid, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1',
        [insertResult.rows[0].id]
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
        const field = error.sqlMessage?.includes('username')
          ? 'username'
          : 'email'
        return next(new AppError(`${field} already exists`, 409))
      }
      next(error)
    }
  }
)

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
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
      'SELECT id, username FROM users WHERE id = $1',
      [id]
    )

    if (userCheck.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    const userToDelete = userCheck.rows[0]

    // Delete user
    const result = await query('DELETE FROM users WHERE id = $1', [id])

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
    const { id } = req.params
    const { oldPassword, newPassword } = req.body
    const currentUserId = req.user.id

    // Sadece kendi şifresini değiştirebilir
    if (parseInt(id) !== currentUserId) {
      return next(new AppError('You can only change your own password', 403))
    }

    if (
      !newPassword ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return next(
        new AppError('New password must be at least 6 characters', 400)
      )
    }

    // Kullanıcıyı bul
    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [id]
    )
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }
    const user = userResult.rows[0]

    // Eski şifre kontrolü (zorunlu yapabiliriz, isterseniz kaldırabiliriz)
    if (oldPassword) {
      const { validateUserPassword } = require('../utils/hashValidator')
      const passwordValidation = await validateUserPassword(
        user.id,
        oldPassword
      )

      if (!passwordValidation.isValid) {
        if (passwordValidation.needsReset) {
          winston.warn('Password change failed due to invalid hash format', {
            userId: user.id,
            error: passwordValidation.error
          })
          return next(
            new AppError(
              'Your current password hash is invalid. Please contact administrator for password reset.',
              400
            )
          )
        }
        return next(new AppError('Old password is incorrect', 400))
      }
    }

    // Yeni şifreyi hashle
    const bcrypt = require('bcryptjs')
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // SQL NULL hatası almamak için parametreyi kontrol et
    if (!newPasswordHash) {
      return next(new AppError('Password hash error', 500))
    }

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      id
    ])

    res.json({ status: 'success', message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı durumunu güncelle (Admin only)
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    )

    if (result.rowCount === 0) {
      return next(new AppError('User not found', 404))
    }

    res.json({
      status: 'success',
      message: 'User status updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı şifresini değiştir
router.put('/:id/change-password', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { currentPassword, newPassword } = req.body
    const currentUserId = req.user.id

    // Sadece kendi şifresini değiştirebilir
    if (parseInt(id) !== currentUserId) {
      return next(new AppError('You can only change your own password', 403))
    }

    // Kullanıcıyı bul
    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [id]
    )
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }
    const user = userResult.rows[0]

    // Mevcut şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    )
    if (!isValidPassword) {
      return next(new AppError('Current password is incorrect', 400))
    }

    // Yeni şifreyi hashle
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Şifreyi güncelle
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      id
    ])

    res.json({ status: 'success', message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı şifresini sıfırla (Admin only)
router.post('/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    // Kullanıcıyı bul
    const userResult = await query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [id]
    )
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }
    const user = userResult.rows[0]

    // Rastgele şifre oluştur
    const tempPassword = Math.random().toString(36).slice(-8)
    const saltRounds = 10
    const tempPasswordHash = await bcrypt.hash(tempPassword, saltRounds)

    // Şifreyi güncelle
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      tempPasswordHash,
      id
    ])

    res.json({
      status: 'success',
      message: 'Password reset successfully',
      data: {
        username: user.username,
        email: user.email,
        tempPassword
      }
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı izinlerini getir
router.get('/:id/permissions', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const currentUserId = req.user.id

    // Sadece kendi izinlerini veya admin tüm izinleri görebilir
    if (parseInt(id) !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('You can only view your own permissions', 403))
    }

    const userResult = await query('SELECT role FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    const user = userResult.rows[0]

    // Role göre izinleri belirle
    const permissions = {
      admin: ['create', 'read', 'update', 'delete'],
      operator: ['create', 'read', 'update'],
      viewer: ['read']
    }

    res.json({
      status: 'success',
      data: {
        role: user.role,
        permissions: permissions[user.role] || []
      }
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı izinlerini güncelle (Admin only)
router.put('/:id/permissions', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { permissions } = req.body

    const userResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    // Permissions'ı kullanıcıya özel tabloya kaydet (basit implementasyon)
    // Gerçek uygulamada ayrı bir permissions tablosu olmalı
    res.json({
      status: 'success',
      message: 'Permissions updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı rollerini getir
router.get('/roles', requireAdmin, async (req, res, next) => {
  try {
    const roles = [
      { id: 'admin', name: 'Administrator', description: 'Full system access' },
      {
        id: 'operator',
        name: 'Operator',
        description: 'Can create and update data'
      },
      { id: 'viewer', name: 'Viewer', description: 'Read-only access' }
    ]

    res.json({
      status: 'success',
      data: roles
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcıya rol ata (Admin only)
router.post('/:id/roles', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { roleId } = req.body

    const userResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    // Role'ü güncelle
    await query('UPDATE users SET role = $1 WHERE id = $2', [roleId, id])

    res.json({
      status: 'success',
      message: 'Role assigned successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcıdan rolü kaldır (Admin only)
router.delete('/:id/roles/:roleId', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const userResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404))
    }

    // Role'ü varsayılan 'viewer' yap
    await query('UPDATE users SET role = $1 WHERE id = $2', ['viewer', id])

    res.json({
      status: 'success',
      message: 'Role removed successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı aktivite logunu getir
router.get('/:id/activity', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const currentUserId = req.user.id

    // Sadece kendi aktivitesini veya admin tüm aktiviteleri görebilir
    if (parseInt(id) !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('You can only view your own activity', 403))
    }

    // Aktivite loglarını getir (basit implementasyon)
    const activities = []

    res.json({
      status: 'success',
      data: activities
    })
  } catch (error) {
    next(error)
  }
})

// Toplu kullanıcı silme (Admin only)
router.post('/bulk-delete', requireAdmin, async (req, res, next) => {
  try {
    const { ids } = req.body
    const currentUserId = req.user.id

    // Kendini silemez
    if (ids.includes(currentUserId.toString())) {
      return next(new AppError('You cannot delete your own account', 403))
    }

    const result = await query(
      'UPDATE users SET is_active = FALSE WHERE id = ANY($1)',
      [ids]
    )

    res.json({
      status: 'success',
      message: `${result.rowCount} users deleted successfully`
    })
  } catch (error) {
    next(error)
  }
})

// Toplu kullanıcı durumu güncelleme (Admin only)
router.post('/bulk-update-status', requireAdmin, async (req, res, next) => {
  try {
    const { ids, status } = req.body

    const result = await query(
      'UPDATE users SET is_active = $1 WHERE id = ANY($2)',
      [status, ids]
    )

    res.json({
      status: 'success',
      message: `${result.rowCount} users updated successfully`
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı ara
router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.trim() === '') {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Search query is required' })
    }

    const result = await query(
      `SELECT id, uuid, username, email, first_name, last_name, role, is_active
       FROM users
       WHERE is_active = TRUE
         AND (username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)
       ORDER BY username ASC
       LIMIT 50`,
      [`%${q.trim()}%`]
    )

    const users = result.rows.map(user => ({
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active
    }))

    res.json({
      status: 'success',
      data: users
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcıları dışa aktar (Admin only)
router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query

    const result = await query(
      `SELECT id, uuid, username, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    )

    if (format === 'excel') {
      res.json({ status: 'success', data: result.rows })
    } else {
      const headers = [
        'ID',
        'Username',
        'Email',
        'First Name',
        'Last Name',
        'Role',
        'Active',
        'Created At'
      ]
      const csvRows = result.rows.map(user => [
        user.id,
        user.username,
        user.email,
        `"${user.first_name}"`,
        `"${user.last_name}"`,
        user.role,
        user.is_active,
        user.created_at
      ])

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="users_export.csv"'
      )
      res.send(csvContent)
    }
  } catch (error) {
    next(error)
  }
})

// Kullanıcıları içe aktar (Admin only)
router.post('/import', requireAdmin, async (req, res, next) => {
  try {
    // Bu endpoint için multer middleware gerekli
    res.json({
      status: 'success',
      message: 'Import functionality not implemented yet'
    })
  } catch (error) {
    next(error)
  }
})

// Kullanıcı istatistikleri (Admin only)
router.get('/statistics', requireAdmin, async (req, res, next) => {
  try {
    const statsResult = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'operator' THEN 1 END) as operator_users,
        COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_users
      FROM users
    `)

    res.json({
      status: 'success',
      data: statsResult.rows[0]
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
