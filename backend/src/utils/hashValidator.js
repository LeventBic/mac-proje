const bcrypt = require('bcryptjs');
const winston = require('winston');
const { query } = require('../config/database');

/**
 * Bcrypt hash formatının geçerli olup olmadığını kontrol eder
 * @param {string} hash - Kontrol edilecek hash
 * @returns {boolean} - Hash geçerli ise true
 */
function isValidBcryptHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // Bcrypt hash formatı: $2a$, $2b$, $2x$, $2y$ ile başlar
  const bcryptRegex = /^\$2[abxy]\$\d{2}\$[A-Za-z0-9./]{53}$/;
  
  return bcryptRegex.test(hash);
}

/**
 * Kullanıcının şifresini güvenli bir şekilde doğrular
 * @param {number} userId - Kullanıcı ID
 * @param {string} password - Doğrulanacak şifre
 * @returns {Object} - {isValid: boolean, error: string|null, needsReset: boolean}
 */
async function validateUserPassword(userId, password) {
  try {
    // Kullanıcıyı veritabanından al
    const result = await query(
      'SELECT id, username, password_hash FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        isValid: false,
        error: 'User not found or inactive',
        needsReset: false
      };
    }

    const user = result.rows[0];
    const { password_hash } = user;

    // Hash formatını kontrol et
    if (!isValidBcryptHash(password_hash)) {
      winston.error('Invalid bcrypt hash format detected', {
        userId: user.id,
        username: user.username,
        hashPrefix: password_hash.substring(0, 10)
      });

      return {
        isValid: false,
        error: 'Invalid password hash format. Password reset required.',
        needsReset: true
      };
    }

    // Şifreyi doğrula
    // winston.info('Password validation attempt', {
    //   userId: user.id,
    //   username: user.username,
    //   passwordLength: password.length,
    //   hashPrefix: password_hash.substring(0, 10)
    // });
    
    const isMatch = await bcrypt.compare(password, password_hash);
    
    // winston.info('Password validation result', {
    //   userId: user.id,
    //   username: user.username,
    //   isMatch
    // });
    
    return {
      isValid: isMatch,
      error: isMatch ? null : 'Invalid password',
      needsReset: false
    };

  } catch (error) {
    winston.error('Error validating user password', {
      userId,
      error: error.message
    });

    return {
      isValid: false,
      error: 'Password validation failed',
      needsReset: false
    };
  }
}

/**
 * Tüm kullanıcıların hash formatlarını kontrol eder
 * @returns {Object} - {validHashes: number, invalidHashes: Array, totalUsers: number}
 */
async function auditAllUserHashes() {
  try {
    const result = await query(
      'SELECT id, username, password_hash FROM users WHERE is_active = true'
    );

    const users = result.rows;
    const invalidHashes = [];
    let validCount = 0;

    for (const user of users) {
      if (isValidBcryptHash(user.password_hash)) {
        validCount++;
      } else {
        invalidHashes.push({
          id: user.id,
          username: user.username,
          hashPrefix: user.password_hash.substring(0, 10),
          hashLength: user.password_hash.length
        });
      }
    }

    winston.info('User hash audit completed', {
      totalUsers: users.length,
      validHashes: validCount,
      invalidHashes: invalidHashes.length
    });

    return {
      validHashes: validCount,
      invalidHashes,
      totalUsers: users.length
    };

  } catch (error) {
    winston.error('Error auditing user hashes', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Kullanıcı için yeni güvenli şifre hash'i oluşturur
 * @param {string} password - Yeni şifre
 * @param {number} saltRounds - Salt rounds (varsayılan: 12)
 * @returns {string} - Bcrypt hash
 */
async function generateSecureHash(password, saltRounds = 12) {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    // Oluşturulan hash'in geçerli olduğunu doğrula
    if (!isValidBcryptHash(hash)) {
      throw new Error('Generated hash is not in valid bcrypt format');
    }

    return hash;
  } catch (error) {
    winston.error('Error generating secure hash', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Bozuk hash'e sahip kullanıcı için geçici şifre oluşturur ve günceller
 * @param {number} userId - Kullanıcı ID
 * @param {string} tempPassword - Geçici şifre (opsiyonel)
 * @returns {Object} - {success: boolean, tempPassword: string|null, error: string|null}
 */
async function resetUserHashWithTempPassword(userId, tempPassword = null) {
  try {
    // Geçici şifre oluştur (eğer verilmemişse)
    if (!tempPassword) {
      tempPassword = generateTempPassword();
    }

    // Yeni hash oluştur
    const newHash = await generateSecureHash(tempPassword);

    // Veritabanını güncelle
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING username',
      [newHash, userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        tempPassword: null,
        error: 'User not found'
      };
    }

    winston.info('User password hash reset with temporary password', {
      userId,
      username: result.rows[0].username
    });

    return {
      success: true,
      tempPassword,
      error: null
    };

  } catch (error) {
    winston.error('Error resetting user hash', {
      userId,
      error: error.message
    });

    return {
      success: false,
      tempPassword: null,
      error: error.message
    };
  }
}

/**
 * Güvenli geçici şifre oluşturur
 * @returns {string} - 12 karakterlik geçici şifre
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let tempPassword = '';
  
  for (let i = 0; i < 12; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return tempPassword;
}

module.exports = {
  isValidBcryptHash,
  validateUserPassword,
  auditAllUserHashes,
  generateSecureHash,
  resetUserHashWithTempPassword,
  generateTempPassword
};