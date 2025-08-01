const inventoryRepository = require('../repositories/inventoryRepository');
const { AppError } = require('../middleware/errorHandler');
const winston = require('winston');

/**
 * Inventory Service
 * Business logic for inventory operations
 */
class InventoryService {
  /**
   * Get inventory items with filtering and pagination
   */
  async getInventoryItems(options) {
    try {
      const { page, limit, search, location_id, category_id, low_stock } = options;
      
      const result = await inventoryRepository.findInventoryItems({
        page,
        limit,
        search,
        location_id,
        category_id,
        low_stock
      });

      return result;
    } catch (error) {
      winston.error('Error in getInventoryItems service:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(id) {
    try {
      const item = await inventoryRepository.findInventoryItemById(id);
      return item;
    } catch (error) {
      winston.error('Error in getInventoryItemById service:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id, updateData) {
    try {
      // Validate update data
      this.validateInventoryUpdateData(updateData);
      
      const updatedItem = await inventoryRepository.updateInventoryItem(id, updateData);
      
      if (updatedItem) {
        // Log inventory change
        await this.logInventoryChange(id, 'update', updateData);
      }
      
      return updatedItem;
    } catch (error) {
      winston.error('Error in updateInventoryItem service:', error);
      throw error;
    }
  }

  /**
   * Get inventory movements for an item
   */
  async getInventoryMovements(itemId, options) {
    try {
      const { page, limit } = options;
      
      const result = await inventoryRepository.findInventoryMovements(itemId, {
        page,
        limit
      });

      return result;
    } catch (error) {
      winston.error('Error in getInventoryMovements service:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(locationId) {
    try {
      const items = await inventoryRepository.findLowStockItems(locationId);
      return items;
    } catch (error) {
      winston.error('Error in getLowStockItems service:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary(locationId) {
    try {
      const summary = await inventoryRepository.getInventorySummary(locationId);
      return summary;
    } catch (error) {
      winston.error('Error in getInventorySummary service:', error);
      throw error;
    }
  }

  /**
   * Process stock movement
   */
  async processStockMovement(movementData) {
    try {
      this.validateStockMovementData(movementData);
      
      const movement = await inventoryRepository.createStockMovement(movementData);
      
      // Update current stock levels
      await this.updateStockLevels(movementData);
      
      // Log the movement
      await this.logInventoryChange(movementData.product_id, 'movement', movementData);
      
      return movement;
    } catch (error) {
      winston.error('Error in processStockMovement service:', error);
      throw error;
    }
  }

  /**
   * Update stock levels based on movement
   */
  async updateStockLevels(movementData) {
    try {
      const { product_id, location_id, movement_type, quantity } = movementData;
      
      await inventoryRepository.updateStockLevel({
        product_id,
        location_id,
        movement_type,
        quantity
      });
    } catch (error) {
      winston.error('Error in updateStockLevels service:', error);
      throw error;
    }
  }

  /**
   * Log inventory changes for audit trail
   */
  async logInventoryChange(itemId, action, data) {
    try {
      await inventoryRepository.createInventoryLog({
        item_id: itemId,
        action,
        data: JSON.stringify(data),
        timestamp: new Date()
      });
    } catch (error) {
      winston.error('Error logging inventory change:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Validate inventory update data
   */
  validateInventoryUpdateData(data) {
    if (data.min_stock_level && data.min_stock_level < 0) {
      throw new AppError('Minimum stock level cannot be negative', 400);
    }
    
    if (data.max_stock_level && data.max_stock_level < 0) {
      throw new AppError('Maximum stock level cannot be negative', 400);
    }
    
    if (data.min_stock_level && data.max_stock_level && data.min_stock_level > data.max_stock_level) {
      throw new AppError('Minimum stock level cannot be greater than maximum stock level', 400);
    }
  }

  /**
   * Validate stock movement data
   */
  validateStockMovementData(data) {
    const requiredFields = ['product_id', 'location_id', 'movement_type', 'quantity'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new AppError(`${field} is required`, 400);
      }
    }
    
    if (data.quantity <= 0) {
      throw new AppError('Quantity must be greater than zero', 400);
    }
    
    const validMovementTypes = ['in', 'out', 'transfer', 'adjustment'];
    if (!validMovementTypes.includes(data.movement_type)) {
      throw new AppError('Invalid movement type', 400);
    }
  }
}

module.exports = new InventoryService();