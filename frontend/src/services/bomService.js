import axiosClient from '../config/axiosClient';

export const bomService = {
  // Get all BOMs
  getBOMs: async () => {
    const response = await axiosClient.get('/bom');
    return response.data;
  },

  // Get BOM by ID
  getBOM: async id => {
    const response = await axiosClient.get(`/bom/${id}`);
    return response.data;
  },

  // Create new BOM
  createBOM: async bomData => {
    const response = await axiosClient.post('/bom', bomData);
    return response.data;
  },

  // Update BOM
  updateBOM: async (id, bomData) => {
    const response = await axiosClient.put(`/bom/${id}`, bomData);
    return response.data;
  },

  // Delete BOM
  deleteBOM: async id => {
    const response = await axiosClient.delete(`/bom/${id}`);
    return response.data;
  },

  // Get BOM cost calculation
  getBOMCost: async (id, quantity = 1) => {
    const response = await axiosClient.get(
      `/bom/${id}/cost?quantity=${quantity}`
    );
    return response.data;
  },

  // Update profit margin
  updateProfitMargin: async (id, profitMargin) => {
    const response = await axiosClient.put(`/bom/${id}/profit-margin`, {
      profit_margin: profitMargin,
    });
    return response.data;
  },

  // Get BOM tree (hierarchical structure)
  getBOMTree: async id => {
    const response = await axiosClient.get(`/bom/${id}/tree`);
    return response.data;
  },

  // Get available sub-BOMs
  getAvailableSubBOMs: async (excludeId = null) => {
    const url = excludeId
      ? `/bom/available-sub-boms/${excludeId}`
      : '/bom/available-sub-boms';
    const response = await axiosClient.get(url);
    return response.data;
  },

  // Get BOM statistics
  getBOMStats: async () => {
    const response = await axiosClient.get('/bom/stats');
    return response.data;
  },

  // Search BOMs
  searchBOMs: async searchTerm => {
    const response = await axiosClient.get(
      `/bom/search?q=${encodeURIComponent(searchTerm)}`
    );
    return response.data;
  },

  // Export BOM data
  exportBOMs: async (format = 'excel') => {
    const response = await axiosClient.get(`/bom/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default bomService;
