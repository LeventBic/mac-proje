const productsService = require('../services/productsService');
const { AppError } = require('../middleware/errorHandler');
const winston = require('winston');

/**
 * Products Controller
 * Handles all product-related operations
 */
class ProductsController {
  /**
   * Get all products with pagination and filtering
   */
  async getProducts(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search, 
        category_id, 
        product_type_id,
        supplier_id,
        status, // Yeni status parametresi
        is_raw_material,
        is_finished_product
      } = req.query;
      
      // Status parametresine göre is_active değerini belirle
      let is_active;
      if (status === 'all') {
        is_active = undefined; // Tüm kayıtları getir
      } else if (status === 'inactive') {
        is_active = false; // Sadece pasif kayıtları getir
      } else {
        is_active = true; // Varsayılan: sadece aktif kayıtları getir
      }
      
      const result = await productsService.getProducts({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category_id,
        product_type_id,
        supplier_id,
        is_active,
        is_raw_material: is_raw_material ? is_raw_material === 'true' : undefined,
        is_finished_product: is_finished_product ? is_finished_product === 'true' : undefined
      });

      res.json({
        status: 'success',
        data: result.products, // Burada products array'i direkt data'ya atanıyor
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      winston.error('Error fetching products:', error);
      next(error);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productsService.getProductById(id);
      
      if (!product) {
        return next(new AppError('Product not found', 404));
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      winston.error('Error fetching product:', error);
      next(error);
    }
  }

  /**
   * Create new product
   */
  async createProduct(req, res, next) {
    try {
      console.log('=== CREATE PRODUCT DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user);
      
      const productData = req.body;
      productData.created_by = req.user.id;
      
      console.log('Product data with created_by:', JSON.stringify(productData, null, 2));
      
      const newProduct = await productsService.createProduct(productData);
      
      winston.info(`Product created: ${newProduct.sku} by user ${req.user.id}`);
      
      res.status(201).json({
        status: 'success',
        data: newProduct
      });
    } catch (error) {
      winston.error('Error creating product:', error);
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updated_by = req.user.id;
      
      const updatedProduct = await productsService.updateProduct(id, updateData);
      
      if (!updatedProduct) {
        return next(new AppError('Product not found', 404));
      }

      winston.info(`Product updated: ${id} by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        data: updatedProduct
      });
    } catch (error) {
      winston.error('Error updating product:', error);
      next(error);
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await productsService.deleteProduct(id, req.user.id);
      
      if (!deleted) {
        return next(new AppError('Product not found', 404));
      }

      winston.info(`Product deleted: ${id} by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      winston.error('Error deleting product:', error);
      next(error);
    }
  }

  /**
   * Get product stock levels across all locations
   */
  async getProductStock(req, res, next) {
    try {
      const { id } = req.params;
      const stockLevels = await productsService.getProductStock(id);
      
      res.json({
        status: 'success',
        data: stockLevels
      });
    } catch (error) {
      winston.error('Error fetching product stock:', error);
      next(error);
    }
  }

  /**
   * Get product movements history
   */
  async getProductMovements(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, location_id } = req.query;
      
      const result = await productsService.getProductMovements(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        location_id
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
      winston.error('Error fetching product movements:', error);
      next(error);
    }
  }

  /**
   * Get product BOM (Bill of Materials)
   */
  async getProductBOM(req, res, next) {
    try {
      const { id } = req.params;
      const bom = await productsService.getProductBOM(id);
      
      res.json({
        status: 'success',
        data: bom
      });
    } catch (error) {
      winston.error('Error fetching product BOM:', error);
      next(error);
    }
  }

  /**
   * Update product pricing
   */
  async updateProductPricing(req, res, next) {
    try {
      const { id } = req.params;
      const { unit_price, cost_price } = req.body;
      
      const updatedProduct = await productsService.updateProductPricing(id, {
        unit_price,
        cost_price,
        updated_by: req.user.id
      });
      
      if (!updatedProduct) {
        return next(new AppError('Product not found', 404));
      }

      winston.info(`Product pricing updated: ${id} by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        data: updatedProduct
      });
    } catch (error) {
      winston.error('Error updating product pricing:', error);
      next(error);
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(req, res, next) {
    try {
      const { category_id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const result = await productsService.getProductsByCategory(category_id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        status: 'success',
        data: result.products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      winston.error('Error fetching products by category:', error);
      next(error);
    }
  }

  /**
   * Search products by SKU or name
   */
  async searchProducts(req, res, next) {
    try {
      const { q: query, limit = 10 } = req.query;
      
      if (!query || query.length < 2) {
        return next(new AppError('Search query must be at least 2 characters', 400));
      }
      
      const products = await productsService.searchProducts(query, parseInt(limit));
      
      res.json({
        status: 'success',
        data: products
      });
    } catch (error) {
      winston.error('Error searching products:', error);
      next(error);
    }
  }
}

module.exports = new ProductsController();