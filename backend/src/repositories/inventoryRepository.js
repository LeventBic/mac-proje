const { query } = require('../config/database');
const winston = require('winston');

/**
 * Inventory Repository
 * Data access layer for inventory operations
 */
class InventoryRepository {
  /**
   * Find inventory items with filtering and pagination
   */
  async findInventoryItems(options) {
    try {
      const { page, limit, search, location_id, category_id, low_stock } = options;
      const offset = (page - 1) * limit;
      
      let whereConditions = ['cs.is_active = true'];
      let queryParams = [];
      let paramIndex = 1;
      
      if (search) {
        whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }
      
      if (location_id) {
        whereConditions.push(`cs.location_id = $${paramIndex}`);
        queryParams.push(location_id);
        paramIndex++;
      }
      
      if (category_id) {
        whereConditions.push(`p.category_id = $${paramIndex}`);
        queryParams.push(category_id);
        paramIndex++;
      }
      
      if (low_stock) {
        whereConditions.push('cs.current_quantity <= p.min_stock_level');
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM current_stock cs
        JOIN products p ON cs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN locations l ON cs.location_id = l.id
        ${whereClause}
      `;
      
      const itemsQuery = `
        SELECT 
          cs.id,
          cs.product_id,
          cs.location_id,
          cs.current_quantity,
          cs.reserved_quantity,
          cs.available_quantity,
          cs.last_movement_date,
          p.name as product_name,
          p.sku,
          p.unit,
          p.min_stock_level,
          p.max_stock_level,
          p.reorder_point,
          p.reorder_quantity,
          c.name as category_name,
          l.name as location_name,
          l.code as location_code,
          CASE 
            WHEN cs.current_quantity <= p.min_stock_level THEN 'low'
            WHEN cs.current_quantity >= p.max_stock_level THEN 'high'
            ELSE 'normal'
          END as stock_status
        FROM current_stock cs
        JOIN products p ON cs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN locations l ON cs.location_id = l.id
        ${whereClause}
        ORDER BY p.name, l.name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      const [countResult, itemsResult] = await Promise.all([
        query(countQuery, queryParams.slice(0, -2)),
        query(itemsQuery, queryParams)
      ]);
      
      return {
        items: itemsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      winston.error('Error in findInventoryItems repository:', error);
      throw error;
    }
  }

  /**
   * Find inventory item by ID
   */
  async findInventoryItemById(id) {
    try {
      const itemQuery = `
        SELECT 
          cs.*,
          p.name as product_name,
          p.sku,
          p.description as product_description,
          p.unit,
          p.min_stock_level,
          p.max_stock_level,
          p.reorder_point,
          p.reorder_quantity,
          p.unit_price,
          p.cost_price,
          c.name as category_name,
          l.name as location_name,
          l.code as location_code,
          l.address as location_address
        FROM current_stock cs
        JOIN products p ON cs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN locations l ON cs.location_id = l.id
        WHERE cs.id = $1 AND cs.is_active = true
      `;
      
      const result = await query(itemQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      winston.error('Error in findInventoryItemById repository:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id, updateData) {
    try {
      const allowedFields = [
        'current_quantity', 'reserved_quantity', 'available_quantity',
        'min_stock_level', 'max_stock_level', 'reorder_point', 'reorder_quantity'
      ];
      
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      queryParams.push(id);
      
      const updateQuery = `
        UPDATE current_stock 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await query(updateQuery, queryParams);
      return result.rows[0] || null;
    } catch (error) {
      winston.error('Error in updateInventoryItem repository:', error);
      throw error;
    }
  }

  /**
   * Find inventory movements for an item
   */
  async findInventoryMovements(itemId, options) {
    try {
      const { page, limit } = options;
      const offset = (page - 1) * limit;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM stock_movements sm
        JOIN current_stock cs ON sm.product_id = cs.product_id AND sm.location_id = cs.location_id
        WHERE cs.id = $1
      `;
      
      const movementsQuery = `
        SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          l.name as location_name,
          u.username as created_by_username
        FROM stock_movements sm
        JOIN current_stock cs ON sm.product_id = cs.product_id AND sm.location_id = cs.location_id
        JOIN products p ON sm.product_id = p.id
        JOIN locations l ON sm.location_id = l.id
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE cs.id = $1
        ORDER BY sm.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const [countResult, movementsResult] = await Promise.all([
        query(countQuery, [itemId]),
        query(movementsQuery, [itemId, limit, offset])
      ]);
      
      return {
        movements: movementsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      winston.error('Error in findInventoryMovements repository:', error);
      throw error;
    }
  }

  /**
   * Find low stock items
   */
  async findLowStockItems(locationId) {
    try {
      let whereClause = 'WHERE cs.current_quantity <= p.min_stock_level AND cs.is_active = true';
      const queryParams = [];
      
      if (locationId) {
        whereClause += ' AND cs.location_id = $1';
        queryParams.push(locationId);
      }
      
      const lowStockQuery = `
        SELECT 
          cs.id,
          cs.product_id,
          cs.location_id,
          cs.current_quantity,
          p.name as product_name,
          p.sku,
          p.min_stock_level,
          p.reorder_point,
          p.reorder_quantity,
          l.name as location_name,
          l.code as location_code,
          (p.min_stock_level - cs.current_quantity) as shortage_quantity
        FROM current_stock cs
        JOIN products p ON cs.product_id = p.id
        JOIN locations l ON cs.location_id = l.id
        ${whereClause}
        ORDER BY (p.min_stock_level - cs.current_quantity) DESC
      `;
      
      const result = await query(lowStockQuery, queryParams);
      return result.rows;
    } catch (error) {
      winston.error('Error in findLowStockItems repository:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary(locationId) {
    try {
      let whereClause = 'WHERE cs.is_active = true';
      const queryParams = [];
      
      if (locationId) {
        whereClause += ' AND cs.location_id = $1';
        queryParams.push(locationId);
      }
      
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_items,
          SUM(cs.current_quantity * p.cost_price) as total_value,
          COUNT(CASE WHEN cs.current_quantity <= p.min_stock_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN cs.current_quantity >= p.max_stock_level THEN 1 END) as overstock_items,
          COUNT(CASE WHEN cs.current_quantity = 0 THEN 1 END) as out_of_stock_items,
          AVG(cs.current_quantity) as avg_stock_level
        FROM current_stock cs
        JOIN products p ON cs.product_id = p.id
        ${whereClause}
      `;
      
      const result = await query(summaryQuery, queryParams);
      return result.rows[0];
    } catch (error) {
      winston.error('Error in getInventorySummary repository:', error);
      throw error;
    }
  }

  /**
   * Create stock movement record
   */
  async createStockMovement(movementData) {
    try {
      const insertQuery = `
        INSERT INTO stock_movements (
          product_id, location_id, movement_type, quantity, 
          reference_type, reference_id, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        movementData.product_id,
        movementData.location_id,
        movementData.movement_type,
        movementData.quantity,
        movementData.reference_type || null,
        movementData.reference_id || null,
        movementData.notes || null,
        movementData.created_by || null
      ];
      
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      winston.error('Error in createStockMovement repository:', error);
      throw error;
    }
  }

  /**
   * Update stock level based on movement
   */
  async updateStockLevel(data) {
    try {
      const { product_id, location_id, movement_type, quantity } = data;
      
      let updateQuery;
      if (movement_type === 'in') {
        updateQuery = `
          UPDATE current_stock 
          SET 
            current_quantity = current_quantity + $3,
            available_quantity = available_quantity + $3,
            last_movement_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND location_id = $2
        `;
      } else if (movement_type === 'out') {
        updateQuery = `
          UPDATE current_stock 
          SET 
            current_quantity = current_quantity - $3,
            available_quantity = available_quantity - $3,
            last_movement_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND location_id = $2
        `;
      } else {
        // For adjustments, set the exact quantity
        updateQuery = `
          UPDATE current_stock 
          SET 
            current_quantity = $3,
            available_quantity = $3,
            last_movement_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND location_id = $2
        `;
      }
      
      await query(updateQuery, [product_id, location_id, quantity]);
    } catch (error) {
      winston.error('Error in updateStockLevel repository:', error);
      throw error;
    }
  }

  /**
   * Create inventory log entry
   */
  async createInventoryLog(logData) {
    try {
      const insertQuery = `
        INSERT INTO inventory_logs (item_id, action, data, timestamp)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        logData.item_id,
        logData.action,
        logData.data,
        logData.timestamp
      ];
      
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      winston.error('Error in createInventoryLog repository:', error);
      throw error;
    }
  }
}

module.exports = new InventoryRepository();