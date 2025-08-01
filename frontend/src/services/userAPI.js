import axiosClient from '../config/axiosClient';

class UserService {
  // Get all users (Admin only)
  static async getAll(params = {}) {
    const response = await axiosClient.get('/users', { params });
    return response.data;
  }

  // Get single user by ID
  static async getById(id) {
    const response = await axiosClient.get(`/users/${id}`);
    return response.data;
  }

  // Create new user (Admin only)
  static async create(userData) {
    const response = await axiosClient.post('/users', userData);
    return response.data;
  }

  // Update user
  static async update(id, userData) {
    const response = await axiosClient.put(`/users/${id}`, userData);
    return response.data;
  }

  // Delete user (Admin only)
  static async delete(id) {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  }

  // Update user status (Admin only)
  static async updateStatus(id, status) {
    const response = await axiosClient.patch(`/users/${id}/status`, { status });
    return response.data;
  }

  // Change user password
  static async changePassword(id, passwordData) {
    const response = await axiosClient.put(`/users/${id}/change-password`, passwordData);
    return response.data;
  }

  // Reset user password (Admin only)
  static async resetPassword(id) {
    const response = await axiosClient.post(`/users/${id}/reset-password`);
    return response.data;
  }

  // Get user permissions
  static async getPermissions(id) {
    const response = await axiosClient.get(`/users/${id}/permissions`);
    return response.data;
  }

  // Update user permissions (Admin only)
  static async updatePermissions(id, permissions) {
    const response = await axiosClient.put(`/users/${id}/permissions`, { permissions });
    return response.data;
  }

  // Get user roles
  static async getRoles() {
    const response = await axiosClient.get('/users/roles');
    return response.data;
  }

  // Assign role to user (Admin only)
  static async assignRole(id, roleId) {
    const response = await axiosClient.post(`/users/${id}/roles`, { roleId });
    return response.data;
  }

  // Remove role from user (Admin only)
  static async removeRole(id, roleId) {
    const response = await axiosClient.delete(`/users/${id}/roles/${roleId}`);
    return response.data;
  }

  // Get user activity log
  static async getActivityLog(id, params = {}) {
    const response = await axiosClient.get(`/users/${id}/activity`, { params });
    return response.data;
  }

  // Bulk operations
  static async bulkDelete(userIds) {
    const response = await axiosClient.post('/users/bulk-delete', { ids: userIds });
    return response.data;
  }

  static async bulkUpdateStatus(userIds, status) {
    const response = await axiosClient.post('/users/bulk-update-status', { ids: userIds, status });
    return response.data;
  }

  // Search users
  static async search(query, params = {}) {
    const response = await axiosClient.get('/users/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  // Export users
  static async export(format = 'csv', filters = {}) {
    const response = await axiosClient.get('/users/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response;
  }

  // Import users
  static async import(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosClient.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get user statistics
  static async getStatistics() {
    const response = await axiosClient.get('/users/statistics');
    return response.data;
  }
}

export default UserService;