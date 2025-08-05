import axiosClient from '../config/axiosClient';

class ProductService {
  // Get all products with filters
  static async getAll(params = {}) {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  }

  // Get single product by ID
  static async getById(id) {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  }

  // Create new product
  static async create(productData) {
    const response = await axiosClient.post('/products', productData);
    return response.data;
  }

  // Update product
  static async update(id, productData) {
    const response = await axiosClient.put(`/products/${id}`, productData);
    return response.data;
  }

  // Delete product
  static async delete(id) {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  }

  // Get product categories
  static async getCategories() {
    const response = await axiosClient.get('/categories');
    return response.data;
  }

  // Get product types
  static async getProductTypes() {
    const response = await axiosClient.get('/product-types');
    return response.data;
  }

  // Get suppliers
  static async getSuppliers() {
    const response = await axiosClient.get('/suppliers');
    return response.data;
  }

  // Create product type
  static async createProductType(productTypeData) {
    const response = await axiosClient.post('/product-types', productTypeData);
    return response.data;
  }

  // Bulk operations
  static async bulkDelete(productIds) {
    const response = await axiosClient.post('/products/bulk-delete', { ids: productIds });
    return response.data;
  }

  // Export products
  static async export(format = 'csv', filters = {}) {
    const response = await axiosClient.get('/products/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response;
  }

  // Import products
  static async import(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosClient.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default ProductService;