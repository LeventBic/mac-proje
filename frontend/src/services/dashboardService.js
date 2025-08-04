import axiosClient from '../config/axiosClient';

class DashboardService {
  // Get main dashboard data
  static async getDashboardData(params = {}) {
    const response = await axiosClient.get('/dashboard', { params });
    return response.data;
  }

  // Product statistics
  static async getProductStats(params = {}) {
    const response = await axiosClient.get('/dashboard/products', { params });
    return response.data;
  }

  // Stock statistics
  static async getStockStats(params = {}) {
    const response = await axiosClient.get('/dashboard/stock', { params });
    return response.data;
  }

  // Production statistics
  static async getProductionStats(params = {}) {
    const response = await axiosClient.get('/dashboard/production', { params });
    return response.data;
  }

  // Sales statistics
  static async getSalesStats(params = {}) {
    const response = await axiosClient.get('/dashboard/sales', { params });
    return response.data;
  }

  // Financial statistics
  static async getFinancialStats(params = {}) {
    const response = await axiosClient.get('/dashboard/financial', { params });
    return response.data;
  }

  // Recent activities
  static async getRecentActivities(params = {}) {
    const response = await axiosClient.get('/dashboard/activities', { params });
    return response.data;
  }

  // Alerts and notifications
  static async getAlerts(params = {}) {
    const response = await axiosClient.get('/dashboard/alerts', { params });
    return response.data;
  }

  // Get dashboard stats (KPI)
  static async getStats(params = {}) {
    const response = await axiosClient.get('/dashboard/stats', { params });
    return response;
  }

  // Get products per category for charts
  static async getProductsPerCategory(params = {}) {
    const response = await axiosClient.get('/dashboard/products-per-category', { params });
    return response;
  }

  static async markAlertAsRead(alertId) {
    const response = await axiosClient.patch(`/dashboard/alerts/${alertId}/read`);
    return response.data;
  }

  static async markAllAlertsAsRead() {
    const response = await axiosClient.patch('/dashboard/alerts/read-all');
    return response.data;
  }

  // Performance metrics
  static async getPerformanceMetrics(params = {}) {
    const response = await axiosClient.get('/dashboard/performance', { params });
    return response.data;
  }

  // Chart data
  static async getChartData(chartType, params = {}) {
    const response = await axiosClient.get(`/dashboard/charts/${chartType}`, { params });
    return response.data;
  }

  // KPI data
  static async getKPIData(params = {}) {
    const response = await axiosClient.get('/dashboard/kpi', { params });
    return response.data;
  }

  // Inventory alerts
  static async getInventoryAlerts(params = {}) {
    const response = await axiosClient.get('/dashboard/inventory-alerts', { params });
    return response.data;
  }

  // Low stock alerts
  static async getLowStockAlerts(params = {}) {
    const response = await axiosClient.get('/dashboard/low-stock', { params });
    return response.data;
  }

  // Overstock alerts
  static async getOverstockAlerts(params = {}) {
    const response = await axiosClient.get('/dashboard/overstock', { params });
    return response.data;
  }

  // Production alerts
  static async getProductionAlerts(params = {}) {
    const response = await axiosClient.get('/dashboard/production-alerts', { params });
    return response.data;
  }

  // Export dashboard data
  static async exportDashboard(format = 'pdf', params = {}) {
    const response = await axiosClient.get('/dashboard/export', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response;
  }

  // Real-time data
  static async getRealTimeData() {
    const response = await axiosClient.get('/dashboard/realtime');
    return response.data;
  }

  // Widget configuration
  static async getWidgetConfig(userId) {
    const response = await axiosClient.get(`/dashboard/widgets/${userId}`);
    return response.data;
  }

  static async updateWidgetConfig(userId, config) {
    const response = await axiosClient.put(`/dashboard/widgets/${userId}`, config);
    return response.data;
  }
}

export default DashboardService;