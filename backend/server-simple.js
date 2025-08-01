#!/usr/bin/env node

/**
 * Simple Backend Server for Testing
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({
    status: 'success',
    data: {
      token: 'mock-jwt-token',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
  });
});

// Mock endpoints
app.get('/api/products', (req, res) => {
  res.json({ status: 'success', data: { products: [], total: 0 } });
});

app.get('/api/categories', (req, res) => {
  res.json({ status: 'success', data: { categories: [] } });
});

app.get('/api/product-types', (req, res) => {
  res.json({ status: 'success', data: { productTypes: [] } });
});

app.get('/api/suppliers', (req, res) => {
  res.json({ status: 'success', data: { suppliers: [] } });
});

app.get('/api/dashboard', (req, res) => {
  res.json({ 
    status: 'success', 
    data: {
      productStats: { total_products: 0 },
      stockStats: { total_stock_value: 0 },
      productionStats: { total_orders: 0 }
    }
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server started on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});