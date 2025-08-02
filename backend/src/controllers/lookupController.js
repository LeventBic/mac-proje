const db = require('../config/database')
const winston = require('winston')

/**
 * Lookup Controller
 * Handles lookup data for dropdowns and selects
 */
class LookupController {
  /**
   * Get all currencies
   */
  async getCurrencies(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, code, name, symbol FROM currencies WHERE is_active = true ORDER BY code'
      );

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching currencies:', error);
      next(error);
    }
  }

  /**
   * Get all units
   */
  async getUnits(req, res, next) {
    try {
      const { category } = req.query;
      
      let query = 'SELECT id, code, name, category FROM units WHERE is_active = true';
      const params = [];
      
      if (category) {
        query += ' AND category = $1';
        params.push(category);
      }
      
      query += ' ORDER BY category, name';
      
      const result = await db.query(query, params);

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching units:', error);
      next(error);
    }
  }

  /**
   * Get all locations
   */
  async getLocations(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, code, name, description FROM locations WHERE is_active = true ORDER BY code'
      );

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching locations:', error);
      next(error);
    }
  }

  /**
   * Get all suppliers
   */
  async getSuppliers(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, supplier_code, name, contact_person FROM suppliers WHERE is_active = true ORDER BY name'
      );

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching suppliers:', error);
      next(error);
    }
  }

  /**
   * Get all product categories
   */
  async getProductCategories(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, name, description, parent_id FROM product_categories WHERE is_active = true ORDER BY name'
      );

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching product categories:', error);
      next(error);
    }
  }

  /**
   * Get all product types
   */
  async getProductTypes(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, name, description FROM product_types WHERE is_active = true ORDER BY name'
      );

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      winston.error('Error fetching product types:', error);
      next(error);
    }
  }

  /**
   * Create new currency
   */
  async createCurrency(req, res, next) {
    try {
      const { code, name, symbol } = req.body;
      
      const result = await db.query(
        'INSERT INTO currencies (code, name, symbol) VALUES ($1, $2, $3) RETURNING *',
        [code, name, symbol]
      );

      res.status(201).json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      winston.error('Error creating currency:', error);
      next(error);
    }
  }

  /**
   * Create new unit
   */
  async createUnit(req, res, next) {
    try {
      const { code, name, category } = req.body;
      
      const result = await db.query(
        'INSERT INTO units (code, name, category) VALUES ($1, $2, $3) RETURNING *',
        [code, name, category]
      );

      res.status(201).json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      winston.error('Error creating unit:', error);
      next(error);
    }
  }

  /**
   * Create new location
   */
  async createLocation(req, res, next) {
    try {
      const { code, name, description, warehouse_id, aisle, shelf, bin } = req.body;
      
      const result = await db.query(
        'INSERT INTO locations (code, name, description, warehouse_id, aisle, shelf, bin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [code, name, description, warehouse_id, aisle, shelf, bin]
      );

      res.status(201).json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      winston.error('Error creating location:', error);
      next(error);
    }
  }
}

module.exports = new LookupController();