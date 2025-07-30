const { Pool } = require('pg')
const winston = require('winston')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'inflow_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

// Create connection pool
const pool = new Pool(dbConfig)

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as now_time')
    client.release()
    winston.info('Database connection successful:', result.rows[0])
    return true
  } catch (err) {
    winston.error('Database connection failed:', err)
    return false
  }
}

// Query helper function
const query = async (text, params = []) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    winston.debug('Query executed', { text, duration, rowCount: result.rowCount })
    
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    }
  } catch (err) {
    winston.error('Query error', { text, error: err.message })
    throw err
  }
}

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Create a query function for the client
    const clientQuery = async (text, params = []) => {
      const result = await client.query(text, params)
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields
      }
    }
    
    const result = await callback(clientQuery)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Get client for complex operations
const getClient = async () => {
  const client = await pool.connect()
  
  // Add enhanced query method to client for compatibility
  const originalQuery = client.query.bind(client)
  client.query = async (text, params = []) => {
    const result = await originalQuery(text, params)
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    }
  }
  
  return client
}

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end()
    winston.info('Database pool closed')
  } catch (err) {
    winston.error('Error closing database pool:', err.message)
  }
}

// Handle process termination
process.on('SIGINT', closePool)
process.on('SIGTERM', closePool)

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  testConnection,
  closePool
}
