const { query } = require('../config/database')
const winston = require('winston')

/**
 * Products Repository
 * Data access layer for product operations
 */
class ProductsRepository {
  /**
   * Find products with filtering and pagination
   */
  async findProducts(options) {
    try {
      const {
        page,
        limit,
        search,
        categoryId,
        productTypeId,
        supplierId,
        isActive,
        isRawMaterial,
        isFinishedProduct
      } = options
      
      const offset = (page - 1) * limit
      
      let whereConditions = []
      let queryParams = []
      let paramIndex = 1
      
      if (isActive !== undefined) {
        whereConditions.push(`p.is_active = $${paramIndex}`)
        queryParams.push(isActive)
        paramIndex++
      }
      
      if (search) {
        whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`)
        queryParams.push(`%${search}%`)
        paramIndex++
      }
      
      if (categoryId) {
        whereConditions.push(`p.category_id = $${paramIndex}`)
        queryParams.push(categoryId)
        paramIndex++
      }
      
      if (productTypeId) {
        whereConditions.push(`p.product_type_id = $${paramIndex}`)
        queryParams.push(productTypeId)
        paramIndex++
      }
      
      if (supplierId) {
        whereConditions.push(`p.supplier_id = $${paramIndex}`)
        queryParams.push(supplierId)
        paramIndex++
      }
      
      if (isRawMaterial !== undefined) {
        whereConditions.push(`p.is_raw_material = $${paramIndex}`)
        queryParams.push(isRawMaterial)
        paramIndex++
      }
      
      if (isFinishedProduct !== undefined) {
        whereConditions.push(`p.is_finished_product = $${paramIndex}`)
        queryParams.push(isFinishedProduct)
        paramIndex++
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        ${whereClause}
      `
      
      const productsQuery = `
        SELECT 
          p.*,
          CASE WHEN c.id IS NOT NULL THEN 
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ELSE NULL END as category,
          CASE WHEN pt.id IS NOT NULL THEN 
            json_build_object('id', pt.id, 'name', pt.name, 'description', pt.description)
          ELSE NULL END as product_type,
          CASE WHEN s.id IS NOT NULL THEN 
            json_build_object('id', s.id, 'name', s.name, 'supplier_code', s.supplier_code)
          ELSE NULL END as supplier,
          0 as total_stock,
          0 as available_stock,
          'normal' as stock_status
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      queryParams.push(limit, offset)
      
      const [countResult, productsResult] = await Promise.all([
        query(countQuery, queryParams.slice(0, -2)),
        query(productsQuery, queryParams)
      ])
      
      return {
        products: productsResult.rows,
        total: parseInt(countResult.rows[0].total)
      }
    } catch (error) {
      winston.error('Error in findProducts repository:', error)
      throw error
    }
  }

  /**
   * Find product by ID
   */
  async findProductById(id) {
    try {
      const productQuery = `
        SELECT 
          p.*,
          CASE WHEN c.id IS NOT NULL THEN 
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ELSE NULL END as category,
          CASE WHEN pt.id IS NOT NULL THEN 
            json_build_object('id', pt.id, 'name', pt.name, 'description', pt.description)
          ELSE NULL END as product_type,
          CASE WHEN s.id IS NOT NULL THEN 
            json_build_object('id', s.id, 'name', s.name, 'supplier_code', s.supplier_code, 'contact_person', s.contact_person, 'email', s.email, 'phone', s.phone)
          ELSE NULL END as supplier
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = $1
      `
      
      const result = await query(productQuery, [id])
      return result.rows[0] || null
    } catch (error) {
      winston.error('Error in findProductById repository:', error)
      throw error
    }
  }

  /**
   * Find product by SKU
   */
  async findProductBySKU(sku) {
    try {
      const productQuery = `
        SELECT id, sku, name, is_active
        FROM products 
        WHERE sku = $1
      `
      
      const result = await query(productQuery, [sku])
      return result.rows[0] || null
    } catch (error) {
      winston.error('Error in findProductBySKU repository:', error)
      throw error
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    try {
      const insertQuery = `
        INSERT INTO products (
          uuid, sku, name, description, barcode, category_id, product_type_id, 
          supplier_id, unit_price, cost_price, unit, min_stock_level, 
          max_stock_level, reorder_point, reorder_quantity, is_raw_material, 
          is_finished_product, is_active
        ) VALUES (
          COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING *
      `
      
      const values = [
        productData.uuid,
        productData.sku,
        productData.name,
        productData.description || null,
        productData.barcode || null,
        productData.categoryId || null,
        productData.productTypeId || null,
        productData.supplierId || null,
        productData.unitPrice || 0,
        productData.costPrice || 0,
        productData.unit,
        productData.minStockLevel || 0,
        productData.maxStockLevel || 0,
        productData.reorderPoint || 0,
        productData.reorderQuantity || 0,
        productData.isRawMaterial || false,
        productData.isFinishedProduct || false,
        productData.isActive !== undefined ? productData.isActive : true
      ]
      
      const result = await query(insertQuery, values)
      return result.rows[0]
    } catch (error) {
      winston.error('Error in createProduct repository:', error)
      throw error
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData) {
    try {
      console.log('💾 ProductsRepository.updateProduct başladı:', {
        productId: id,
        updateData: updateData,
        timestamp: new Date().toISOString()
      })
      
      const allowedFields = [
        'sku', 'name', 'description', 'barcode', 'qr_code', 'brand_id', 'brand', 'category_id', 'product_type_id',
        'supplier_id', 'supplier_name', 'last_supplier_id', 'supplier_product_code', 'lead_time_days',
        'unit_price', 'cost_price', 'purchase_price', 'currency_id', 'unit_id', 'current_stock', 'reserved_stock', 'ordered_stock',
        'unit', 'min_stock_level', 'max_stock_level', 'reorder_point', 'reorder_quantity', 'location_id',
        'is_raw_material', 'is_finished_product', 'is_popular', 'is_active',
        'price_increase_percentage', 'last_price_update', 'updated_by'
      ]
      
      const updateFields = []
      const queryParams = []
      let paramIndex = 1
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`)
          queryParams.push(value)
          paramIndex++
        }
      }
      
      if (updateFields.length === 0) {
        console.log('⚠️  Repository: Güncellenecek geçerli alan bulunamadı')
        throw new Error('No valid fields to update')
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      queryParams.push(id)
      
      const updateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `
      
      console.log('🔍 SQL Sorgusu:', {
        query: updateQuery,
        params: queryParams,
        updateFields: updateFields
      })
      
      const result = await query(updateQuery, queryParams)
      
      // Güncellenen satır sayısını kontrol et
      console.log('📊 SQL Sonucu:', {
        rowCount: result.rowCount,
        affectedRows: result.rowCount,
        hasData: result.rows.length > 0,
        returnedData: result.rows[0] || null
      })
      
      if (result.rowCount === 0) {
        console.log('⚠️  UYARI: Güncellenecek ürün bulunamadı (rowCount = 0), ID:', id)
        console.log('🔍 Kontrol: Bu ID ile ürün var mı?')
        
        // Ürünün var olup olmadığını kontrol et
        const checkQuery = 'SELECT id, name, sku FROM products WHERE id = $1'
        const checkResult = await query(checkQuery, [id])
        
        if (checkResult.rows.length === 0) {
          console.log('❌ Ürün bulunamadı - ID mevcut değil:', id)
        } else {
          console.log('🤔 Ürün mevcut ama güncelleme başarısız:', checkResult.rows[0])
        }
        
        return null
      }
      
      console.log('✅ Repository güncelleme başarılı:', {
        productId: id,
        updatedProduct: result.rows[0]
      })
      
      return result.rows[0]
    } catch (error) {
      console.error('❌ ProductsRepository.updateProduct HATASI:', {
        error: error,
        message: error.message,
        stack: error.stack,
        productId: id,
        updateData: updateData,
        timestamp: new Date().toISOString()
      })
      winston.error('Error in updateProduct repository:', error)
      throw error
    }
  }

  /**
   * Delete product (hard delete)
   */
  async deleteProduct(id, userId) {
    try {
      const deleteQuery = `
        DELETE FROM products 
        WHERE id = $1
        RETURNING id
      `
      
      const result = await query(deleteQuery, [id])
      return result.rows.length > 0
    } catch (error) {
      winston.error('Error in deleteProduct repository:', error)
      throw error
    }
  }

  /**
   * Find product stock levels across all locations
   */
  async findProductStock(id) {
    try {
      const stockQuery = `
        SELECT 
          i.*,
          l.name as location_name,
          l.code as location_code,
          l.type as location_type
        FROM inventory i
        JOIN locations l ON i.location_id = l.id
        WHERE i.product_id = $1
        ORDER BY l.name
      `
      
      const result = await query(stockQuery, [id])
      return result.rows
    } catch (error) {
      winston.error('Error in findProductStock repository:', error)
      throw error
    }
  }

  /**
   * Find product movements history
   */
  async findProductMovements(id, options) {
    try {
      const { page, limit, locationId } = options
      const offset = (page - 1) * limit
      
      let whereConditions = ['sm.product_id = $1']
      let queryParams = [id]
      let paramIndex = 2
      
      if (locationId) {
        whereConditions.push(`sm.location_id = $${paramIndex}`)
        queryParams.push(locationId)
        paramIndex++
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM stock_movements sm
        ${whereClause}
      `
      
      const movementsQuery = `
        SELECT 
          sm.*,
          l.name as location_name,
          l.code as location_code,
          u.username as created_by_username
        FROM stock_movements sm
        JOIN locations l ON sm.location_id = l.id
        LEFT JOIN users u ON sm.created_by = u.id
        ${whereClause}
        ORDER BY sm.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      queryParams.push(limit, offset)
      
      const [countResult, movementsResult] = await Promise.all([
        query(countQuery, queryParams.slice(0, -2)),
        query(movementsQuery, queryParams)
      ])
      
      return {
        movements: movementsResult.rows,
        total: parseInt(countResult.rows[0].total)
      }
    } catch (error) {
      winston.error('Error in findProductMovements repository:', error)
      throw error
    }
  }

  /**
   * Find product BOM (Bill of Materials)
   */
  async findProductBOM(id) {
    try {
      const bomQuery = `
        SELECT 
          b.*,
          bi.id as item_id,
          bi.component_product_id,
          bi.quantity as component_quantity,
          bi.unit as component_unit,
          bi.cost_per_unit,
          bi.total_cost as component_total_cost,
          p.name as component_name,
          p.sku as component_sku,
          p.unit as component_product_unit
        FROM bom b
        LEFT JOIN bom_items bi ON b.id = bi.bom_id
        LEFT JOIN products p ON bi.component_product_id = p.id
        WHERE b.product_id = $1 AND b.is_active = true
        ORDER BY bi.id
      `
      
      const result = await query(bomQuery, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      // Group BOM items
      const bom = {
        id: result.rows[0].id,
        productId: result.rows[0].product_id,
        version: result.rows[0].version,
        description: result.rows[0].description,
        baseCost: result.rows[0].base_cost,
        finalCost: result.rows[0].final_cost,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        items: []
      }
      
      result.rows.forEach(row => {
        if (row.item_id) {
          bom.items.push({
            id: row.item_id,
            componentProductId: row.component_product_id,
            quantity: row.component_quantity,
            unit: row.component_unit,
            costPerUnit: row.cost_per_unit,
            totalCost: row.component_total_cost,
            componentName: row.component_name,
            componentSku: row.component_sku,
            componentProductUnit: row.component_product_unit
          })
        }
      })
      
      return bom
    } catch (error) {
      winston.error('Error in findProductBOM repository:', error)
      throw error
    }
  }

  /**
   * Update product pricing
   */
  async updateProductPricing(id, pricingData) {
    try {
      const updateQuery = `
        UPDATE products 
        SET 
          unit_price = COALESCE($2, unit_price),
          cost_price = COALESCE($3, cost_price),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $4
        WHERE id = $1
        RETURNING *
      `
      
      const values = [
        id,
        pricingData.unitPrice,
        pricingData.costPrice,
        pricingData.updatedBy
      ]
      
      const result = await query(updateQuery, values)
      return result.rows[0] || null
    } catch (error) {
      winston.error('Error in updateProductPricing repository:', error)
      throw error
    }
  }

  /**
   * Find products by category
   */
  async findProductsByCategory(categoryId, options) {
    try {
      const { page, limit } = options
      const offset = (page - 1) * limit
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products 
        WHERE category_id = $1 AND is_active = true
      `
      
      const productsQuery = `
        SELECT 
          p.*,
          CASE WHEN c.id IS NOT NULL THEN 
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ELSE NULL END as category,
          CASE WHEN pt.id IS NOT NULL THEN 
            json_build_object('id', pt.id, 'name', pt.name, 'description', pt.description)
          ELSE NULL END as product_type,
          CASE WHEN s.id IS NOT NULL THEN 
            json_build_object('id', s.id, 'name', s.name, 'supplier_code', s.supplier_code)
          ELSE NULL END as supplier
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.category_id = $1 AND p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `
      
      const [countResult, productsResult] = await Promise.all([
        query(countQuery, [categoryId]),
        query(productsQuery, [categoryId, limit, offset])
      ])
      
      return {
        products: productsResult.rows,
        total: parseInt(countResult.rows[0].total)
      }
    } catch (error) {
      winston.error('Error in findProductsByCategory repository:', error)
      throw error
    }
  }

  /**
   * Search products by SKU or name
   */
  async searchProducts(searchQuery, limit) {
    try {
      const searchProductsQuery = `
        SELECT 
          id, sku, name, unit, unit_price, cost_price,
          min_stock_level, max_stock_level, is_active
        FROM products 
        WHERE 
          (name ILIKE $1 OR sku ILIKE $1) 
          AND is_active = true
        ORDER BY 
          CASE 
            WHEN sku ILIKE $1 THEN 1
            WHEN name ILIKE $2 THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT $3
      `
      
      const result = await query(searchProductsQuery, [
        `%${searchQuery}%`,
        `${searchQuery}%`,
        limit
      ])
      
      return result.rows
    } catch (error) {
      winston.error('Error in searchProducts repository:', error)
      throw error
    }
  }

  /**
   * Check if product is used in active orders
   */
  async checkProductUsageInOrders(id) {
    try {
      const usageQuery = `
        SELECT 1 as used
        FROM (
          SELECT 1 FROM sales_order_items soi 
          JOIN sales_orders so ON soi.sales_order_id = so.id 
          WHERE soi.product_id = $1 AND so.status IN ('pending', 'confirmed', 'in_production')
          UNION
          SELECT 1 FROM purchase_order_items poi 
          JOIN purchase_orders po ON poi.purchase_order_id = po.id 
          WHERE poi.product_id = $1 AND po.status IN ('pending', 'confirmed', 'in_production')
        ) usage
        LIMIT 1
      `
      
      const result = await query(usageQuery, [id])
      return result.rows.length > 0
    } catch (error) {
      winston.error('Error in checkProductUsageInOrders repository:', error)
      throw error
    }
  }

  /**
   * Create initial stock record
   */
  async createInitialStock(productId, quantity, locationId) {
    try {
      const insertQuery = `
        INSERT INTO current_stock (
          product_id, location_id, current_quantity, available_quantity, 
          reserved_quantity, last_movement_date, is_active
        ) VALUES ($1, $2, $3, $3, 0, CURRENT_TIMESTAMP, true)
        ON CONFLICT (product_id, location_id) 
        DO UPDATE SET 
          current_quantity = current_stock.current_quantity + EXCLUDED.current_quantity,
          available_quantity = current_stock.available_quantity + EXCLUDED.available_quantity,
          last_movement_date = CURRENT_TIMESTAMP
      `
      
      await query(insertQuery, [productId, locationId, quantity])
    } catch (error) {
      winston.error('Error in createInitialStock repository:', error)
      throw error
    }
  }

  /**
   * Create pricing log entry
   */
  async createPricingLog(logData) {
    try {
      const insertQuery = `
        INSERT INTO product_pricing_logs (
          product_id, old_unit_price, new_unit_price, old_cost_price, 
          new_cost_price, change_reason, changed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      
      const values = [
        logData.productId,
        logData.oldUnitPrice,
        logData.newUnitPrice,
        logData.oldCostPrice,
        logData.newCostPrice,
        logData.changeReason,
        logData.changedBy
      ]
      
      const result = await query(insertQuery, values)
      return result.rows[0]
    } catch (error) {
      winston.error('Error in createPricingLog repository:', error)
      throw error
    }
  }
}

module.exports = new ProductsRepository()