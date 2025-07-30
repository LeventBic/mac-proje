#!/usr/bin/env node

/**
 * inFlow Backend Server
 * Main entry point for the application
 */

require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, () => {
  logger.info(`🚀 inFlow Backend Server started on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
  
  if (process.env.API_DOCS_ENABLED === 'true') {
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  }
}); 