const Joi = require('joi')

const createProjectSchema = Joi.object({
  project_code: Joi.string().required().min(3).max(20).pattern(/^[A-Z0-9-_]+$/).messages({
    'string.pattern.base': 'Proje kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir'
  }),
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().allow('').max(500),
  customer_id: Joi.number().integer().positive().required(),
  project_manager_id: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  start_date: Joi.date().allow(null),
  planned_end_date: Joi.date().allow(null).when('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')).messages({
      'date.min': 'Planlanan bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    })
  }),
  budget: Joi.number().positive().allow(null),
  notes: Joi.string().allow('').max(1000)
})

const updateProjectSchema = Joi.object({
  project_code: Joi.string().min(3).max(20).pattern(/^[A-Z0-9-_]+$/).messages({
    'string.pattern.base': 'Proje kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir'
  }),
  name: Joi.string().min(3).max(100),
  description: Joi.string().allow('').max(500),
  customer_id: Joi.number().integer().positive(),
  project_manager_id: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  start_date: Joi.date().allow(null),
  planned_end_date: Joi.date().allow(null),
  actual_end_date: Joi.date().allow(null),
  budget: Joi.number().positive().allow(null),
  actual_cost: Joi.number().min(0).allow(null),
  progress_percentage: Joi.number().min(0).max(100).allow(null),
  notes: Joi.string().allow('').max(1000)
}).min(1)

const createTaskSchema = Joi.object({
  task_name: Joi.string().required().min(3).max(100),
  description: Joi.string().allow('').max(500),
  assigned_to: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled').default('not_started'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  start_date: Joi.date().allow(null),
  due_date: Joi.date().allow(null).when('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')).messages({
      'date.min': 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    })
  }),
  estimated_hours: Joi.number().positive().allow(null),
  dependencies: Joi.string().allow('').max(500),
  notes: Joi.string().allow('').max(1000)
})

const createCostSchema = Joi.object({
  cost_type: Joi.string().required().valid('material', 'labor', 'equipment', 'service', 'other'),
  description: Joi.string().required().min(3).max(200),
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('TRY', 'USD', 'EUR').default('TRY'),
  cost_date: Joi.date().required().max('now').messages({
    'date.max': 'Maliyet tarihi gelecek bir tarih olamaz'
  }),
  supplier_id: Joi.number().integer().positive().allow(null),
  invoice_number: Joi.string().allow('').max(50),
  notes: Joi.string().allow('').max(500)
})

const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').max(100),
  status: Joi.string().allow('').valid('', 'planning', 'active', 'on_hold', 'completed', 'cancelled'),
  customer_id: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.number().integer().positive()
  )
})

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errorMessages
      })
    }

    req.body = value
    next()
  }
}

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
      return res.status(400).json({
        status: 'error',
        message: 'Query validation error',
        errors: errorMessages
      })
    }

    req.query = value
    next()
  }
}

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  createCostSchema,
  queryParamsSchema,
  validateRequest,
  validateQuery
}