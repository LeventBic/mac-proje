const Joi = require('joi')

const createProjectSchema = Joi.object({
  project_code: Joi.string().required().min(3).max(20).pattern(/^[A-Z0-9-_]+$/).messages({
    'string.pattern.base': 'Proje kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir',
    'string.empty': 'Proje kodu gereklidir',
    'any.required': 'Proje kodu gereklidir',
    'string.min': 'Proje kodu en az 3 karakter olmalıdır',
    'string.max': 'Proje kodu en fazla 20 karakter olmalıdır'
  }),
  name: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'Proje adı gereklidir',
    'any.required': 'Proje adı gereklidir',
    'string.min': 'Proje adı en az 3 karakter olmalıdır',
    'string.max': 'Proje adı en fazla 100 karakter olmalıdır'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': 'Açıklama en fazla 500 karakter olmalıdır'
  }),
  customer_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Müşteri ID sayı olmalıdır',
    'number.integer': 'Müşteri ID tam sayı olmalıdır',
    'number.positive': 'Müşteri ID pozitif olmalıdır',
    'any.required': 'Müşteri ID gereklidir'
  }),
  project_manager_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'Proje yöneticisi ID sayı olmalıdır',
    'number.integer': 'Proje yöneticisi ID tam sayı olmalıdır',
    'number.positive': 'Proje yöneticisi ID pozitif olmalıdır'
  }),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning').messages({
    'any.only': 'Durum geçerli bir değer olmalıdır (planning, active, on_hold, completed, cancelled)'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').messages({
    'any.only': 'Öncelik geçerli bir değer olmalıdır (low, medium, high, critical)'
  }),
  start_date: Joi.date().allow(null).messages({
    'date.base': 'Başlangıç tarihi geçerli bir tarih olmalıdır'
  }),
  planned_end_date: Joi.date().allow(null).when('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')).messages({
      'date.min': 'Planlanan bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    })
  }).messages({
    'date.base': 'Planlanan bitiş tarihi geçerli bir tarih olmalıdır'
  }),
  budget: Joi.number().positive().allow(null).messages({
    'number.base': 'Bütçe sayı olmalıdır',
    'number.positive': 'Bütçe pozitif olmalıdır'
  }),
  notes: Joi.string().allow('').max(1000).messages({
    'string.max': 'Notlar en fazla 1000 karakter olmalıdır'
  })
})

const updateProjectSchema = Joi.object({
  project_code: Joi.string().min(3).max(20).pattern(/^[A-Z0-9-_]+$/).messages({
    'string.pattern.base': 'Proje kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir',
    'string.min': 'Proje kodu en az 3 karakter olmalıdır',
    'string.max': 'Proje kodu en fazla 20 karakter olmalıdır'
  }),
  name: Joi.string().min(3).max(100).messages({
    'string.min': 'Proje adı en az 3 karakter olmalıdır',
    'string.max': 'Proje adı en fazla 100 karakter olmalıdır'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': 'Açıklama en fazla 500 karakter olmalıdır'
  }),
  customer_id: Joi.number().integer().positive().messages({
    'number.base': 'Müşteri ID sayı olmalıdır',
    'number.integer': 'Müşteri ID tam sayı olmalıdır',
    'number.positive': 'Müşteri ID pozitif olmalıdır'
  }),
  project_manager_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'Proje yöneticisi ID sayı olmalıdır',
    'number.integer': 'Proje yöneticisi ID tam sayı olmalıdır',
    'number.positive': 'Proje yöneticisi ID pozitif olmalıdır'
  }),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').messages({
    'any.only': 'Durum geçerli bir değer olmalıdır (planning, active, on_hold, completed, cancelled)'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').messages({
    'any.only': 'Öncelik geçerli bir değer olmalıdır (low, medium, high, critical)'
  }),
  start_date: Joi.date().allow(null).messages({
    'date.base': 'Başlangıç tarihi geçerli bir tarih olmalıdır'
  }),
  planned_end_date: Joi.date().allow(null).messages({
    'date.base': 'Planlanan bitiş tarihi geçerli bir tarih olmalıdır'
  }),
  actual_end_date: Joi.date().allow(null).messages({
    'date.base': 'Gerçek bitiş tarihi geçerli bir tarih olmalıdır'
  }),
  budget: Joi.number().positive().allow(null).messages({
    'number.base': 'Bütçe sayı olmalıdır',
    'number.positive': 'Bütçe pozitif olmalıdır'
  }),
  actual_cost: Joi.number().min(0).allow(null).messages({
    'number.base': 'Gerçek maliyet sayı olmalıdır',
    'number.min': 'Gerçek maliyet negatif olamaz'
  }),
  progress_percentage: Joi.number().min(0).max(100).allow(null).messages({
    'number.base': 'İlerleme yüzdesi sayı olmalıdır',
    'number.min': 'İlerleme yüzdesi 0dan küçük olamaz',
    'number.max': 'İlerleme yüzdesi 100den büyük olamaz'
  }),
  notes: Joi.string().allow('').max(1000).messages({
    'string.max': 'Notlar en fazla 1000 karakter olmalıdır'
  })
}).min(1).messages({
  'object.min': 'En az bir alan güncellenmelidir'
})

const createTaskSchema = Joi.object({
  task_name: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'Görev adı gereklidir',
    'any.required': 'Görev adı gereklidir',
    'string.min': 'Görev adı en az 3 karakter olmalıdır',
    'string.max': 'Görev adı en fazla 100 karakter olmalıdır'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': 'Açıklama en fazla 500 karakter olmalıdır'
  }),
  assigned_to: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'Atanan kişi ID sayı olmalıdır',
    'number.integer': 'Atanan kişi ID tam sayı olmalıdır',
    'number.positive': 'Atanan kişi ID pozitif olmalıdır'
  }),
  status: Joi.string().valid('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled').default('not_started').messages({
    'any.only': 'Durum geçerli bir değer olmalıdır (not_started, in_progress, completed, on_hold, cancelled)'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').messages({
    'any.only': 'Öncelik geçerli bir değer olmalıdır (low, medium, high, critical)'
  }),
  start_date: Joi.date().allow(null).messages({
    'date.base': 'Başlangıç tarihi geçerli bir tarih olmalıdır'
  }),
  due_date: Joi.date().allow(null).when('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')).messages({
      'date.min': 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    })
  }).messages({
    'date.base': 'Bitiş tarihi geçerli bir tarih olmalıdır'
  }),
  estimated_hours: Joi.number().positive().allow(null).messages({
    'number.base': 'Tahmini saat sayı olmalıdır',
    'number.positive': 'Tahmini saat pozitif olmalıdır'
  }),
  dependencies: Joi.string().allow('').max(500).messages({
    'string.max': 'Bağımlılıklar en fazla 500 karakter olmalıdır'
  }),
  notes: Joi.string().allow('').max(1000).messages({
    'string.max': 'Notlar en fazla 1000 karakter olmalıdır'
  })
})

const createCostSchema = Joi.object({
  cost_type: Joi.string().required().valid('material', 'labor', 'equipment', 'service', 'other').messages({
    'string.empty': 'Maliyet tipi gereklidir',
    'any.required': 'Maliyet tipi gereklidir',
    'any.only': 'Maliyet tipi geçerli bir değer olmalıdır (material, labor, equipment, service, other)'
  }),
  description: Joi.string().required().min(3).max(200).messages({
    'string.empty': 'Açıklama gereklidir',
    'any.required': 'Açıklama gereklidir',
    'string.min': 'Açıklama en az 3 karakter olmalıdır',
    'string.max': 'Açıklama en fazla 200 karakter olmalıdır'
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Tutar sayı olmalıdır',
    'number.positive': 'Tutar pozitif olmalıdır',
    'any.required': 'Tutar gereklidir'
  }),
  currency: Joi.string().valid('TRY', 'USD', 'EUR').default('TRY').messages({
    'any.only': 'Para birimi geçerli bir değer olmalıdır (TRY, USD, EUR)'
  }),
  cost_date: Joi.date().required().max('now').messages({
    'date.base': 'Maliyet tarihi geçerli bir tarih olmalıdır',
    'any.required': 'Maliyet tarihi gereklidir',
    'date.max': 'Maliyet tarihi gelecek bir tarih olamaz'
  }),
  supplier_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'Tedarikçi ID sayı olmalıdır',
    'number.integer': 'Tedarikçi ID tam sayı olmalıdır',
    'number.positive': 'Tedarikçi ID pozitif olmalıdır'
  }),
  invoice_number: Joi.string().allow('').max(50).messages({
    'string.max': 'Fatura numarası en fazla 50 karakter olmalıdır'
  }),
  notes: Joi.string().allow('').max(500).messages({
    'string.max': 'Notlar en fazla 500 karakter olmalıdır'
  })
})

const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Sayfa sayı olmalıdır',
    'number.integer': 'Sayfa tam sayı olmalıdır',
    'number.min': 'Sayfa 1den küçük olamaz'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit sayı olmalıdır',
    'number.integer': 'Limit tam sayı olmalıdır',
    'number.min': 'Limit 1den küçük olamaz',
    'number.max': 'Limit 100den büyük olamaz'
  }),
  search: Joi.string().allow('').max(100).messages({
    'string.max': 'Arama terimi en fazla 100 karakter olmalıdır'
  }),
  status: Joi.string().allow('').valid('', 'planning', 'active', 'on_hold', 'completed', 'cancelled').messages({
    'any.only': 'Durum geçerli bir değer olmalıdır'
  }),
  customer_id: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.number().integer().positive()
  ).messages({
    'alternatives.match': 'Müşteri ID geçerli bir değer olmalıdır'
  })
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
        message: 'Doğrulama hatası',
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