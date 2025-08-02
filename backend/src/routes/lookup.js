const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const lookupController = require('../controllers/lookupController')

// Currencies
router.get('/currencies', requireAuth, lookupController.getCurrencies)
router.post('/currencies', requireAuth, lookupController.createCurrency)

// Units
router.get('/units', requireAuth, lookupController.getUnits)
router.post('/units', requireAuth, lookupController.createUnit)

// Locations
router.get('/locations', requireAuth, lookupController.getLocations)
router.post('/locations', requireAuth, lookupController.createLocation)

// Suppliers
router.get('/suppliers', requireAuth, lookupController.getSuppliers)

// Product Categories
router.get('/product-categories', requireAuth, lookupController.getProductCategories)

// Product Types
router.get('/product-types', requireAuth, lookupController.getProductTypes)

module.exports = router