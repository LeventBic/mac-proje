require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const winston = require('winston')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

// Import configurations and utilities
const { testConnection } = require('./config/database')

// Test database connection
testConnection()

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const productRoutes = require('./routes/products')
const inventoryRoutes = require('./routes/inventory')
const productionRoutes = require('./routes/production')
const dashboardRoutes = require('./routes/dashboard')
const bomRoutes = require('./routes/bom')
const currentStockRoutes = require('./routes/currentstock')
const supplierRoutes = require('./routes/suppliers')
const categoryRoutes = require('./routes/categories')
const productTypeRoutes = require('./routes/productTypes')
const stockReorderRoutes = require('./routes/stockReorder')
const stockTransferRoutes = require('./routes/stockTransfers')
const stockAdjustmentRoutes = require('./routes/stockAdjustments')
const stockCountRoutes = require('./routes/stockCounts')
const stockroomScanRoutes = require('./routes/stockroomScans')
const purchaseOrderRoutes = require('./routes/purchaseOrders')
const purchaseQuoteRoutes = require('./routes/purchaseQuotes')
const salesOrderRoutes = require('./routes/salesOrders')
const salesQuoteRoutes = require('./routes/salesQuotes')
const customerRoutes = require('./routes/customers')
const projectRoutes = require('./routes/projects')
const hashAdminRoutes = require('./routes/hashAdmin')
const settingsRoutes = require('./routes/settings')
const lookupRoutes = require('./routes/lookup')
const statsRoutes = require('./routes/stats')

// Import middleware
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')
const { globalErrorHandler } = require('./utils/errors')

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS configuration - Allow both frontend ports
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Compression middleware
app.use(compression())

// Rate limiting - Production için aktif et
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 6000, // Limit each IP to 6000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use((req, res, next) => {
  winston.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Swagger/OpenAPI documentation
if (process.env.API_DOCS_ENABLED === 'true') {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Devarp API',
        version: '1.0.0',
        description: 'API documentation for Devarp ERP system',
        contact: {
          name: 'Devarp Team',
          email: 'support@devarp.com'
        }
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: ['./src/routes/*.js'] // Path to the API docs
  }

  const swaggerSpec = swaggerJsdoc(swaggerOptions)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authMiddleware.verifyToken, userRoutes)
app.use('/api/products', authMiddleware.verifyToken, productRoutes)
app.use('/api/inventory', authMiddleware.verifyToken, inventoryRoutes)
app.use('/api/production', authMiddleware.verifyToken, productionRoutes)
app.use('/api/dashboard', authMiddleware.verifyToken, dashboardRoutes)
app.use('/api/bom', authMiddleware.verifyToken, bomRoutes)
app.use('/api/current-stock', authMiddleware.verifyToken, currentStockRoutes)
app.use('/api/suppliers', authMiddleware.verifyToken, supplierRoutes)
app.use('/api/categories', authMiddleware.verifyToken, categoryRoutes)
app.use('/api/product-types', authMiddleware.verifyToken, productTypeRoutes)
app.use('/api/stock-reorder', authMiddleware.verifyToken, stockReorderRoutes)
app.use('/api/stock-transfers', authMiddleware.verifyToken, stockTransferRoutes)
app.use('/api/stock-adjustments', authMiddleware.verifyToken, stockAdjustmentRoutes)
app.use('/api/stock-counts', authMiddleware.verifyToken, stockCountRoutes)
app.use('/api/stockroom-scans', authMiddleware.verifyToken, stockroomScanRoutes)
app.use('/api/purchase-orders', authMiddleware.verifyToken, purchaseOrderRoutes)
app.use('/api/purchase-quotes', authMiddleware.verifyToken, purchaseQuoteRoutes)
app.use('/api/sales-orders', authMiddleware.verifyToken, salesOrderRoutes)
app.use('/api/sales-quotes', authMiddleware.verifyToken, salesQuoteRoutes)
app.use('/api/customers', authMiddleware.verifyToken, customerRoutes)
app.use('/api/projects', authMiddleware.verifyToken, projectRoutes)
app.use('/api/admin', authMiddleware.verifyToken, hashAdminRoutes)
app.use('/api/lookup', authMiddleware.verifyToken, lookupRoutes)
app.use('/api/stats', authMiddleware.verifyToken, statsRoutes)

app.use('/api/settings', authMiddleware.verifyToken, settingsRoutes)

// Global error handler (correct order)
app.use(errorHandler)
app.use(globalErrorHandler)

module.exports = app
