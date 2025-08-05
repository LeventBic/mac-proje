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
      
      const productData = {
        // Temel bilgiler
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description,
        brand_id: req.body.brand_id || null,
        brand: req.body.brand && req.body.brand.trim() !== '' ? req.body.brand : null,
        
        // Kategori ve tip
        category_id: req.body.category_id || null,
        product_type_id: req.body.product_type_id || null,
        
        // Fiyat bilgileri
        unit_price: parseFloat(req.body.unit_price) || 0,
        purchase_price: parseFloat(req.body.purchase_price) || 0,
        currency_id: req.body.currency_id || null,
        
        // Birim ve stok
        unit_id: req.body.unit_id || null,
        current_stock: parseFloat(req.body.current_stock) || 0,
        reserved_stock: parseFloat(req.body.reserved_stock) || 0,
        ordered_stock: parseFloat(req.body.ordered_stock) || 0,
        
        // Tedarikçi bilgileri
        supplier_id: req.body.supplier_id || null,
        last_supplier_id: req.body.last_supplier_id || null,
        supplier_product_code: req.body.supplier_product_code,
        lead_time_days: parseInt(req.body.lead_time_days) || 0,
        
        // Lokasyon ve kodlar
        location_id: req.body.location_id || null,
        barcode: req.body.barcode && req.body.barcode.trim() !== '' ? req.body.barcode : null,
        qr_code: req.body.qr_code && req.body.qr_code.trim() !== '' ? req.body.qr_code : null,
        
        // Özellikler
        is_popular: req.body.is_popular === true || req.body.is_popular === 'true',
        is_raw_material: req.body.is_raw_material === true || req.body.is_raw_material === 'true',
        is_finished_product: req.body.is_finished_product === true || req.body.is_finished_product === 'true',
        
        // Fiyat artış bilgileri
        price_increase_percentage: parseFloat(req.body.price_increase_percentage) || 0,
        last_price_update: req.body.last_price_update || null,
        
        // Sistem alanları
        created_by: req.user.id,
        is_active: true
      };
      
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
    // Gelen veriyi loglama
    console.log('🔄 PUT /api/products/:id isteği alındı');
    console.log('📥 Gelen Güncelleme İsteği Body:', JSON.stringify(req.body, null, 2));
    console.log('🆔 Ürün ID:', req.params.id);
    console.log('👤 Kullanıcı ID:', req.user?.id);
    
    try {
      const { id } = req.params;
      
      // Express-validator sonuçlarını kontrol et
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(error => {
          console.log('🔍 Validation Error Detail:', {
            field: error.path || error.param,
            message: error.msg,
            value: error.value,
            location: error.location
          });
          return error.msg;
        });
        
        console.log('❌ Express-Validator Hataları:', validationErrors);
        return res.status(400).json({
          message: 'Validation failed - Express Validator',
          errors: validationErrors
        });
      }
      
      const updateData = {
        // Temel bilgiler
        name: req.body.name,
        sku: req.body.sku,
        description: req.body.description,
        brand_id: req.body.brand_id || null,
        brand: req.body.brand && req.body.brand.trim() !== '' ? req.body.brand : null,
        
        // Kategori ve tip
        category_id: req.body.category_id || null,
        product_type_id: req.body.product_type_id || null,
        
        // Fiyat bilgileri - sayıya dönüştür
        unit_price: req.body.unit_price ? parseFloat(req.body.unit_price) : undefined,
        cost_price: req.body.cost_price ? parseFloat(req.body.cost_price) : undefined,
        currency_id: req.body.currency_id || null,
        
        // Birim ve stok
        unit_id: req.body.unit_id || null,
        current_stock: req.body.current_stock !== undefined ? parseFloat(req.body.current_stock) : undefined,
        reserved_stock: req.body.reserved_stock !== undefined ? parseFloat(req.body.reserved_stock) : undefined,
        ordered_stock: req.body.ordered_stock !== undefined ? parseFloat(req.body.ordered_stock) : undefined,
        
        // Tedarikçi bilgileri
        supplier_id: req.body.supplier_id || null,
        last_supplier_id: req.body.last_supplier_id || null,
        supplier_name: req.body.supplier_name,
        supplier_product_code: req.body.supplier_product_code,
        lead_time_days: req.body.lead_time_days ? parseInt(req.body.lead_time_days) : undefined,
        
        // Lokasyon ve kodlar
        location_id: req.body.location_id || null,
        barcode: req.body.barcode && req.body.barcode.trim() !== '' ? req.body.barcode : null,
        qr_code: req.body.qr_code && req.body.qr_code.trim() !== '' ? req.body.qr_code : null,
        
        // Özellikler
        is_popular: req.body.is_popular !== undefined ? (req.body.is_popular === true || req.body.is_popular === 'true') : undefined,
        is_raw_material: req.body.is_raw_material !== undefined ? (req.body.is_raw_material === true || req.body.is_raw_material === 'true') : undefined,
        is_finished_product: req.body.is_finished_product !== undefined ? (req.body.is_finished_product === true || req.body.is_finished_product === 'true') : undefined,
        
        // Fiyat artış bilgileri
        price_increase_percentage: req.body.price_increase_percentage ? parseFloat(req.body.price_increase_percentage) : undefined,
        last_price_update: req.body.last_price_update || null,
        
        // Aktiflik durumu
        is_active: req.body.is_active !== undefined ? (req.body.is_active === true || req.body.is_active === 'true') : undefined,
        
        // Sistem alanları
        updated_by: req.user.id
      };
      
      // Undefined değerleri temizle
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log('🔧 İşlenmiş Güncelleme Verisi:', JSON.stringify(updateData, null, 2));
      console.log('🎯 Güncellenecek Ürün ID\'si:', id);
      
      const updatedProduct = await productsService.updateProduct(id, updateData);
      
      if (!updatedProduct) {
        console.log('⚠️  UYARI: Güncellenecek ürün bulunamadı, ID:', id);
        return next(new AppError('Product not found', 404));
      }

      console.log('✅ Ürün başarıyla güncellendi:', {
        id: id,
        updatedFields: Object.keys(updateData),
        result: updatedProduct
      });
      winston.info(`Product updated: ${updatedProduct.sku} by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        data: updatedProduct
      });
    } catch (error) {
      // Detaylı hata loglama
      console.error('❌ VERİTABANI GÜNCELLEME HATASI - Tam Detay:', {
        error: error,
        message: error.message,
        stack: error.stack,
        productId: req.params.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });
      
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
      winston.info(`🎯 Controller: Starting deleteProduct for ID: ${id}, User: ${req.user.id}`);
      
      const deleted = await productsService.deleteProduct(id, req.user.id);
      winston.info(`🎯 Controller: Service returned: ${deleted}`);
      
      if (!deleted) {
        winston.warn(`🎯 Controller: Product ${id} not found, returning 404`);
        return next(new AppError('Product not found', 404));
      }

      winston.info(`🎯 Controller: Product deleted successfully: ${id} by user ${req.user.id}`);
      
      res.json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      winston.error('🎯 Controller: Error deleting product:', error);
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