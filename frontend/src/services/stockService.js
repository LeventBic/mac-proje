import axiosClient from '../config/axiosClient';

class StockService {
  // Current Stock Operations
  static async getCurrentStock(params = {}) {
    const response = await axiosClient.get('/current-stock', { params });
    return response.data;
  }

  static async getStockById(id) {
    const response = await axiosClient.get(`/current-stock/${id}`);
    return response.data;
  }

  static async updateStock(id, stockData) {
    const response = await axiosClient.put(`/current-stock/${id}`, stockData);
    return response.data;
  }

  // Stock Adjustments
  static async getStockAdjustments(params = {}) {
    const response = await axiosClient.get('/stock-adjustments', { params });
    return response.data;
  }

  static async createStockAdjustment(adjustmentData) {
    const response = await axiosClient.post('/stock-adjustments', adjustmentData);
    return response.data;
  }

  static async getStockAdjustmentById(id) {
    const response = await axiosClient.get(`/stock-adjustments/${id}`);
    return response.data;
  }

  static async updateStockAdjustment(id, adjustmentData) {
    const response = await axiosClient.put(`/stock-adjustments/${id}`, adjustmentData);
    return response.data;
  }

  static async deleteStockAdjustment(id) {
    const response = await axiosClient.delete(`/stock-adjustments/${id}`);
    return response.data;
  }

  // Stock Transfers
  static async getStockTransfers(params = {}) {
    const response = await axiosClient.get('/stock-transfers', { params });
    return response.data;
  }

  static async createStockTransfer(transferData) {
    const response = await axiosClient.post('/stock-transfers', transferData);
    return response.data;
  }

  static async getStockTransferById(id) {
    const response = await axiosClient.get(`/stock-transfers/${id}`);
    return response.data;
  }

  static async updateStockTransfer(id, transferData) {
    const response = await axiosClient.put(`/stock-transfers/${id}`, transferData);
    return response.data;
  }

  static async deleteStockTransfer(id) {
    const response = await axiosClient.delete(`/stock-transfers/${id}`);
    return response.data;
  }

  static async approveStockTransfer(id) {
    const response = await axiosClient.post(`/stock-transfers/${id}/approve`);
    return response.data;
  }

  static async rejectStockTransfer(id, reason) {
    const response = await axiosClient.post(`/stock-transfers/${id}/reject`, { reason });
    return response.data;
  }

  // Stock Reorder
  static async getReorderData(params = {}) {
    const response = await axiosClient.get('/stock-reorder', { params });
    return response.data;
  }

  static async updateReorderLevels(id, reorderData) {
    const response = await axiosClient.put(`/stock-reorder/${id}`, reorderData);
    return response.data;
  }

  // Stock Locations
  static async getLocations() {
    const response = await axiosClient.get('/locations');
    return response.data;
  }

  static async createLocation(locationData) {
    const response = await axiosClient.post('/locations', locationData);
    return response.data;
  }

  static async updateLocation(id, locationData) {
    const response = await axiosClient.put(`/locations/${id}`, locationData);
    return response.data;
  }

  static async deleteLocation(id) {
    const response = await axiosClient.delete(`/locations/${id}`);
    return response.data;
  }

  // Stock Reports
  static async getStockReport(params = {}) {
    const response = await axiosClient.get('/stock-reports', { params });
    return response.data;
  }

  static async exportStockReport(format = 'csv', filters = {}) {
    const response = await axiosClient.get('/stock-reports/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response;
  }

  // Stock Valuation
  static async getStockValuation(params = {}) {
    const response = await axiosClient.get('/stock-valuation', { params });
    return response.data;
  }

  // Stock Movements
  static async getStockMovements(params = {}) {
    const { product_id, ...otherParams } = params;
    if (product_id) {
      const response = await axiosClient.get(`/current-stock/${product_id}/movements`, { params: otherParams });
      return response.data;
    }
    // If no product_id provided, return empty data
    return { success: true, data: [] };
  }

  // Stock Transfer Stats
  static async getStockTransferStats() {
    const response = await axiosClient.get('/stock-transfers/stats');
    return response.data;
  }

  // Create Stock Reorder Orders
  static async createStockReorderOrders(orderData) {
    const response = await axiosClient.post('/stock-reorder/orders', orderData);
    return response.data;
  }

  // Get Stock Reorder History
  static async getStockReorderHistory(params = {}) {
    const response = await axiosClient.get('/stock-reorder/history', { params });
    return response.data;
  }

  // Get Stock Reorder Needed
  static async getStockReorderNeeded(params = {}) {
    const response = await axiosClient.get('/stock-reorder/needed', { params });
    return response.data;
  }

  // Update Stock Reorder Settings
  static async updateStockReorderSettings(id, settings) {
    const response = await axiosClient.put(`/stock-reorder/settings/${id}`, settings);
    return response.data;
  }

  // Get Stock Adjustment Stats
  static async getStockAdjustmentStats() {
    const response = await axiosClient.get('/stock-adjustments/stats');
    return response.data;
  }

  // Get Inventory Valuation
  static async getInventoryValuation(params = {}) {
    const response = await axiosClient.get('/inventory/valuation', { params });
    return response.data;
  }

  // Get Inventory Alerts
  static async getInventoryAlerts(params = {}) {
    const response = await axiosClient.get('/inventory/alerts', { params });
    return response.data;
  }

  // Get Inventory Analysis
  static async getInventoryAnalysis(params = {}) {
    const response = await axiosClient.get('/inventory/analysis', { params });
    return response.data;
  }

  // Get Stock Stats
  static async getStockStats(params = {}) {
    const response = await axiosClient.get('/stock/stats', { params });
    return response.data;
  }
}

export default StockService;