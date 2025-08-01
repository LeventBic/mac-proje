import axiosClient from '../config/axiosClient';

/**
 * Production Service
 * Handles all production-related API calls
 */
class ProductionService {
  // Get all production orders
  static async getAll(params = {}) {
    const response = await axiosClient.get('/production', { params });
    return response.data;
  }

  // Get single production order
  static async getById(id) {
    const response = await axiosClient.get(`/production/${id}`);
    return response.data;
  }

  // Create new production order
  static async create(orderData) {
    const response = await axiosClient.post('/production', orderData);
    return response.data;
  }

  // Update production order
  static async update(id, orderData) {
    const response = await axiosClient.put(`/production/${id}`, orderData);
    return response.data;
  }

  // Delete production order
  static async delete(id) {
    const response = await axiosClient.delete(`/production/${id}`);
    return response.data;
  }

  // Start production order
  static async start(id) {
    const response = await axiosClient.post(`/production/${id}/start`);
    return response.data;
  }

  // Complete production order
  static async complete(id, data = {}) {
    const response = await axiosClient.post(`/production/${id}/complete`, data);
    return response.data;
  }

  // Add production movement
  static async addMovement(id, movementData) {
    const response = await axiosClient.post(`/production/${id}/movement`, movementData);
    return response.data;
  }

  // Get production statistics
  static async getStats(params = {}) {
    const response = await axiosClient.get('/production/stats', { params });
    return response.data;
  }

  // Get BOMs for production
  static async getBOMs(params = {}) {
    const response = await axiosClient.get('/bom', { params });
    return response.data;
  }

  // Search production orders
  static async search(query, params = {}) {
    const response = await axiosClient.get('/production/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  // Export production data
  static async export(format = 'csv', params = {}) {
    const response = await axiosClient.get('/production/export', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response;
  }

  // Get production capacity
  static async getCapacity(params = {}) {
    const response = await axiosClient.get('/production/capacity', { params });
    return response.data;
  }

  // Get production schedule
  static async getSchedule(params = {}) {
    const response = await axiosClient.get('/production/schedule', { params });
    return response.data;
  }
}

export default ProductionService;