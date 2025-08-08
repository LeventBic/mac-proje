const { body } = require('express-validator')

/**
 * Validation rules for employee creation and update
 */
const validateEmployee = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isMobilePhone('tr-TR')
    .withMessage('Please provide a valid Turkish phone number'),

  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),

  body('department')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),

  body('hire_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format (YYYY-MM-DD)'),

  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Salary cannot be negative')
      }
      return true
    }),

  body('iban')
    .optional()
    .matches(/^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/)
    .withMessage('Please provide a valid Turkish IBAN'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'terminated'])
    .withMessage('Status must be one of: active, inactive, terminated')
]

module.exports = {
  validateEmployee
}