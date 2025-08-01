const inventoryService = require('../services/inventoryService');
const { AppError } = require('../middleware/errorHandler');
const winston = require('winston');

/**
 * Inventory Controller
 * Handles all inventory-related operations
 */
class InventoryController {
  /**
   * Get all inventory items with pagination and filtering
   */
  async getInventoryItems(req, res, next) {
    try {
      const { page = 1, limit = 50, search, location_id, category_id, low_stock } = req.query;
      
      const result = await inventoryService.getInventoryItems({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        location_id,
        category_id,
        low_stock: low_stock === 'true'
      });

      res.json({
        status: 'success',
        data: result.items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      winston.error('Error fetching inventory items:', error);
      next(error);
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await inventoryService.getInventoryItemById(id);
      
      if (!item) {
        return next(new AppError('Inventory item not found', 404));
      }

      res.json({
        status: 'success',
        data: item
      });
    } catch (error) {
      winston.error('Error fetching inventory item:', error);
      next(error);
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedItem = await inventoryService.updateInventoryItem(id, updateData);
      
      if (!updatedItem) {
        return next(new AppError('Inventory item not found', 404));
      }

      winston.info(`Inventory item ${id} updated by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        data: updatedItem
      });
    } catch (error) {
      winston.error('Error updating inventory item:', error);
      next(error);
    }
  }

  /**
   * Get inventory movements for an item
   */
  async getInventoryMovements(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await inventoryService.getInventoryMovements(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        status: 'success',
        data: result.movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      winston.error('Error fetching inventory movements:', error);
      next(error);
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(req, res, next) {
    try {
      const { location_id } = req.query;
      const items = await inventoryService.getLowStockItems(location_id);

      res.json({
        status: 'success',
        data: items
      });
    } catch (error) {
      winston.error('Error fetching low stock items:', error);
      next(error);
    }
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(req, res, next) {
    try {
      const { location_id } = req.query;
      const summary = await inventoryService.getInventorySummary(location_id);

      res.json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      winston.error('Error fetching inventory summary:', error);
      next(error);
    }
  }
}

module.exports = new InventoryController();