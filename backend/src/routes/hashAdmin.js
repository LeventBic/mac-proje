const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const winston = require('winston');
const {
  auditAllUserHashes,
  resetUserHashWithTempPassword,
  isValidBcryptHash
} = require('../utils/hashValidator');
const { query } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /api/admin/hash-audit:
 *   get:
 *     summary: Audit all user password hashes (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hash audit completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 audit:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     validHashes:
 *                       type: number
 *                     invalidHashes:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/hash-audit', requireAdmin, async (req, res, next) => {
  try {
    winston.info('Hash audit initiated by admin', {
      adminId: req.user.id,
      adminUsername: req.user.username
    });

    const auditResult = await auditAllUserHashes();

    res.json({
      status: 'success',
      message: 'Hash audit completed',
      audit: auditResult
    });
  } catch (error) {
    winston.error('Hash audit failed', {
      adminId: req.user.id,
      error: error.message
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/fix-user-hash/{userId}:
 *   post:
 *     summary: Fix invalid hash for specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to fix hash for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempPassword:
 *                 type: string
 *                 description: Custom temporary password (optional)
 *     responses:
 *       200:
 *         description: Hash fixed successfully
 *       400:
 *         description: User hash is already valid
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/fix-user-hash/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tempPassword } = req.body;

    // Kullanıcıyı kontrol et
    const userResult = await query(
      'SELECT id, username, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const user = userResult.rows[0];

    // Hash'in zaten geçerli olup olmadığını kontrol et
    if (isValidBcryptHash(user.password_hash)) {
      return res.json({
        status: 'info',
        message: 'User hash is already valid',
        user: {
          id: user.id,
          username: user.username
        }
      });
    }

    winston.info('Fixing invalid hash for user', {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: user.id,
      targetUsername: user.username,
      oldHashPrefix: user.password_hash.substring(0, 10)
    });

    // Hash'i düzelt
    const resetResult = await resetUserHashWithTempPassword(userId, tempPassword);

    if (!resetResult.success) {
      return next(new AppError(resetResult.error, 500));
    }

    res.json({
      status: 'success',
      message: 'User hash fixed successfully',
      user: {
        id: user.id,
        username: user.username
      },
      tempPassword: resetResult.tempPassword
    });
  } catch (error) {
    winston.error('Error fixing user hash', {
      adminId: req.user.id,
      userId: req.params.userId,
      error: error.message
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/fix-all-invalid-hashes:
 *   post:
 *     summary: Fix all invalid hashes in the system (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All invalid hashes fixed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 results:
 *                   type: object
 *                   properties:
 *                     totalFixed:
 *                       type: number
 *                     failed:
 *                       type: array
 *                     tempPasswords:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/fix-all-invalid-hashes', requireAdmin, async (req, res, next) => {
  try {
    winston.info('Mass hash fix initiated by admin', {
      adminId: req.user.id,
      adminUsername: req.user.username
    });

    // Önce audit yap
    const auditResult = await auditAllUserHashes();

    if (auditResult.invalidHashes.length === 0) {
      return res.json({
        status: 'info',
        message: 'No invalid hashes found',
        results: {
          totalFixed: 0,
          failed: [],
          tempPasswords: []
        }
      });
    }

    const results = {
      totalFixed: 0,
      failed: [],
      tempPasswords: []
    };

    // Her geçersiz hash için düzeltme yap
    for (const invalidUser of auditResult.invalidHashes) {
      try {
        const resetResult = await resetUserHashWithTempPassword(invalidUser.id);
        
        if (resetResult.success) {
          results.totalFixed++;
          results.tempPasswords.push({
            userId: invalidUser.id,
            username: invalidUser.username,
            tempPassword: resetResult.tempPassword
          });
        } else {
          results.failed.push({
            userId: invalidUser.id,
            username: invalidUser.username,
            error: resetResult.error
          });
        }
      } catch (error) {
        results.failed.push({
          userId: invalidUser.id,
          username: invalidUser.username,
          error: error.message
        });
      }
    }

    winston.info('Mass hash fix completed', {
      adminId: req.user.id,
      totalFixed: results.totalFixed,
      totalFailed: results.failed.length
    });

    res.json({
      status: 'success',
      message: `Fixed ${results.totalFixed} invalid hashes`,
      results
    });
  } catch (error) {
    winston.error('Mass hash fix failed', {
      adminId: req.user.id,
      error: error.message
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/hash-stats:
 *   get:
 *     summary: Get hash statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hash statistics retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/hash-stats', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN password_hash ~ '^\\$2[abxy]\\$\\d{2}\\$[A-Za-z0-9./]{53}$' THEN 1 END) as valid_hashes,
        COUNT(CASE WHEN NOT password_hash ~ '^\\$2[abxy]\\$\\d{2}\\$[A-Za-z0-9./]{53}$' THEN 1 END) as invalid_hashes
      FROM users 
      WHERE is_active = true
    `);

    const stats = result.rows[0];

    res.json({
      status: 'success',
      stats: {
        totalUsers: parseInt(stats.total_users),
        validHashes: parseInt(stats.valid_hashes),
        invalidHashes: parseInt(stats.invalid_hashes),
        validPercentage: ((parseInt(stats.valid_hashes) / parseInt(stats.total_users)) * 100).toFixed(2)
      }
    });
  } catch (error) {
    winston.error('Error getting hash stats', {
      adminId: req.user.id,
      error: error.message
    });
    next(error);
  }
});

module.exports = router;