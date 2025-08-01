import axiosClient from '../config/axiosClient';

export const reportsService = {
  // Get stock report
  getStockReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/dashboard/stock?${params}`);
    return response.data;
  },

  // Get production report
  getProductionReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/dashboard/production?${params}`);
    return response.data;
  },

  // Get sales report
  getSalesReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/dashboard/sales?${params}`);
    return response.data;
  },

  // Get financial report
  getFinancialReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/reports/financial?${params}`);
    return response.data;
  },

  // Get inventory report
  getInventoryReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/reports/inventory?${params}`);
    return response.data;
  },

  // Get customer report
  getCustomerReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/reports/customers?${params}`);
    return response.data;
  },

  // Get supplier report
  getSupplierReport: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/api/reports/suppliers?${params}`);
    return response.data;
  },

  // Export report
  exportReport: async (reportType, format = 'excel', filters = {}) => {
    const params = new URLSearchParams({ ...filters, format });
    const response = await axiosClient.get(`/api/reports/${reportType}/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get report summary
  getReportSummary: async () => {
    const response = await axiosClient.get('/api/reports/summary');
    return response.data;
  }
};

export default reportsService;