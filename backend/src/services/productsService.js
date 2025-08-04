const productsRepository = require('../repositories/productsRepository');
const { AppError } = require('../middleware/errorHandler');
const winston = require('winston');

/**
 * Products Service
 * Business logic for product operations
 */
class ProductsService {
  /**
   * Get products with filtering and pagination
   */
  async getProducts(options) {
    try {
      const result = await productsRepository.findProducts(options);
      return result;
    } catch (error) {
      winston.error('Error in getProducts service:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    try {
      const product = await productsRepository.findProductById(id);
      return product;
    } catch (error) {
      winston.error('Error in getProductById service:', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    try {
      // Validate product data
      await this.validateProductData(productData);
      
      // Check if SKU already exists
      const existingProduct = await productsRepository.findProductBySKU(productData.sku);
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }
      
      // Generate UUID if not provided
      if (!productData.uuid) {
        productData.uuid = require('crypto').randomUUID();
      }
      
      const newProduct = await productsRepository.createProduct(productData);
      
      // Create initial stock record if needed
      if (productData.initial_stock && productData.initial_stock > 0) {
        await this.createInitialStock(newProduct.id, productData.initial_stock, productData.location_id || 1);
      }
      
      return newProduct;
    } catch (error) {
      winston.error('Error in createProduct service:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData) {
    try {
      console.log('🔧 ProductsService.updateProduct başladı:', {
        productId: id,
        updateData: updateData,
        timestamp: new Date().toISOString()
      });
      
      // Validate update data
      console.log('✅ Veri doğrulama başlıyor...');
      await this.validateProductUpdateData(updateData);
      console.log('✅ Veri doğrulama tamamlandı');
      
      // Check if SKU is being updated and if it already exists
      if (updateData.sku) {
        console.log('🔍 SKU kontrolü yapılıyor:', updateData.sku);
        const existingProduct = await productsRepository.findProductBySKU(updateData.sku);
        if (existingProduct && existingProduct.id !== parseInt(id)) {
          console.log('❌ SKU çakışması tespit edildi:', {
            newSKU: updateData.sku,
            existingProductId: existingProduct.id,
            currentProductId: id
          });
          throw new AppError('Product with this SKU already exists', 400);
        }
        console.log('✅ SKU kontrolü başarılı');
      }
      
      console.log('💾 Repository güncelleme işlemi başlıyor...');
      const updatedProduct = await productsRepository.updateProduct(id, updateData);
      
      if (updatedProduct) {
        console.log('✅ ProductsService güncelleme başarılı:', {
          productId: id,
          updatedProduct: updatedProduct
        });
      } else {
        console.log('⚠️  ProductsService: Repository null döndürdü');
      }
      
      return updatedProduct;
    } catch (error) {
      console.error('❌ ProductsService.updateProduct HATASI:', {
        error: error,
        message: error.message,
        productId: id,
        updateData: updateData,
        timestamp: new Date().toISOString()
      });
      winston.error('Error in updateProduct service:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id, userId) {
    try {
      // Check if product has active stock
      const stockLevels = await this.getProductStock(id);
      const hasActiveStock = stockLevels.some(stock => stock.current_quantity > 0);
      
      if (hasActiveStock) {
        throw new AppError('Cannot delete product with active stock. Please adjust stock to zero first.', 400);
      }
      
      // Check if product is used in active orders
      const isUsedInOrders = await productsRepository.checkProductUsageInOrders(id);
      if (isUsedInOrders) {
        throw new AppError('Cannot delete product that is used in active orders', 400);
      }
      
      const deleted = await productsRepository.deleteProduct(id, userId);
      return deleted;
    } catch (error) {
      winston.error('Error in deleteProduct service:', error);
      throw error;
    }
  }

  /**
   * Get product stock levels across all locations
   */
  async getProductStock(id) {
    try {
      const stockLevels = await productsRepository.findProductStock(id);
      return stockLevels;
    } catch (error) {
      winston.error('Error in getProductStock service:', error);
      throw error;
    }
  }

  /**
   * Get product movements history
   */
  async getProductMovements(id, options) {
    try {
      const result = await productsRepository.findProductMovements(id, options);
      return result;
    } catch (error) {
      winston.error('Error in getProductMovements service:', error);
      throw error;
    }
  }

  /**
   * Get product BOM (Bill of Materials)
   */
  async getProductBOM(id) {
    try {
      const bom = await productsRepository.findProductBOM(id);
      return bom;
    } catch (error) {
      winston.error('Error in getProductBOM service:', error);
      throw error;
    }
  }

  /**
   * Update product pricing
   */
  async updateProductPricing(id, pricingData) {
    try {
      this.validatePricingData(pricingData);
      
      const updatedProduct = await productsRepository.updateProductPricing(id, pricingData);
      
      // Log pricing change
      if (updatedProduct) {
        await this.logPricingChange(id, pricingData);
      }
      
      return updatedProduct;
    } catch (error) {
      winston.error('Error in updateProductPricing service:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, options) {
    try {
      const result = await productsRepository.findProductsByCategory(categoryId, options);
      return result;
    } catch (error) {
      winston.error('Error in getProductsByCategory service:', error);
      throw error;
    }
  }

  /**
   * Search products by SKU or name
   */
  async searchProducts(query, limit) {
    try {
      const products = await productsRepository.searchProducts(query, limit);
      return products;
    } catch (error) {
      winston.error('Error in searchProducts service:', error);
      throw error;
    }
  }

  /**
   * Create initial stock record for new product
   */
  async createInitialStock(productId, quantity, locationId) {
    try {
      await productsRepository.createInitialStock(productId, quantity, locationId);
    } catch (error) {
      winston.error('Error creating initial stock:', error);
      // Don't throw error for initial stock creation failure
    }
  }

  /**
   * Log pricing changes for audit trail
   */
  async logPricingChange(productId, pricingData) {
    try {
      await productsRepository.createPricingLog({
        product_id: productId,
        old_unit_price: pricingData.old_unit_price,
        new_unit_price: pricingData.unit_price,
        old_cost_price: pricingData.old_cost_price,
        new_cost_price: pricingData.cost_price,
        changed_by: pricingData.updated_by,
        timestamp: new Date()
      });
    } catch (error) {
      winston.error('Error logging pricing change:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Validate product data
   */
  async validateProductData(data) {
    const requiredFields = ['name', 'sku'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new AppError(`${field} is required`, 400);
      }
    }
    
    if (data.unit_price && data.unit_price < 0) {
      throw new AppError('Unit price cannot be negative', 400);
    }
    
    if (data.cost_price && data.cost_price < 0) {
      throw new AppError('Cost price cannot be negative', 400);
    }
    
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
   * Validate product update data
   */
  async validateProductUpdateData(data) {
    if (data.unit_price && data.unit_price < 0) {
      throw new AppError('Unit price cannot be negative', 400);
    }
    
    if (data.cost_price && data.cost_price < 0) {
      throw new AppError('Cost price cannot be negative', 400);
    }
    
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
   * Validate pricing data
   */
  validatePricingData(data) {
    if (data.unit_price && data.unit_price < 0) {
      throw new AppError('Unit price cannot be negative', 400);
    }
    
    if (data.cost_price && data.cost_price < 0) {
      throw new AppError('Cost price cannot be negative', 400);
    }
  }
}

module.exports = new ProductsService();