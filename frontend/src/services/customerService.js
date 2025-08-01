import axiosClient from '../config/axiosClient';

class CustomerService {
  // Get all customers with filters
  static async getAll(params = {}) {
    const response = await axiosClient.get('/customers', { params });
    return response.data;
  }

  // Get single customer by ID
  static async getById(id) {
    const response = await axiosClient.get(`/customers/${id}`);
    return response.data;
  }

  // Create new customer
  static async create(customerData) {
    const response = await axiosClient.post('/customers', customerData);
    return response.data;
  }

  // Update customer
  static async update(id, customerData) {
    const response = await axiosClient.put(`/customers/${id}`, customerData);
    return response.data;
  }

  // Delete customer
  static async delete(id) {
    const response = await axiosClient.delete(`/customers/${id}`);
    return response.data;
  }

  // Customer orders
  static async getCustomerOrders(customerId, params = {}) {
    const response = await axiosClient.get(`/customers/${customerId}/orders`, { params });
    return response.data;
  }

  // Customer projects
  static async getCustomerProjects(customerId, params = {}) {
    const response = await axiosClient.get(`/customers/${customerId}/projects`, { params });
    return response.data;
  }

  // Customer analytics
  static async getCustomerAnalytics(customerId, params = {}) {
    const response = await axiosClient.get(`/customers/${customerId}/analytics`, { params });
    return response.data;
  }

  // Customer contacts
  static async getCustomerContacts(customerId) {
    const response = await axiosClient.get(`/customers/${customerId}/contacts`);
    return response.data;
  }

  static async createCustomerContact(customerId, contactData) {
    const response = await axiosClient.post(`/customers/${customerId}/contacts`, contactData);
    return response.data;
  }

  static async updateCustomerContact(customerId, contactId, contactData) {
    const response = await axiosClient.put(`/customers/${customerId}/contacts/${contactId}`, contactData);
    return response.data;
  }

  static async deleteCustomerContact(customerId, contactId) {
    const response = await axiosClient.delete(`/customers/${customerId}/contacts/${contactId}`);
    return response.data;
  }

  // Customer status operations
  static async updateStatus(id, status) {
    const response = await axiosClient.patch(`/customers/${id}/status`, { status });
    return response.data;
  }

  // Customer reports
  static async getCustomerReport(id, params = {}) {
    const response = await axiosClient.get(`/customers/${id}/report`, { params });
    return response.data;
  }

  static async exportCustomer(id, format = 'pdf') {
    const response = await axiosClient.get(`/customers/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  }

  // Bulk operations
  static async bulkDelete(customerIds) {
    const response = await axiosClient.post('/customers/bulk-delete', { ids: customerIds });
    return response.data;
  }

  static async bulkUpdateStatus(customerIds, status) {
    const response = await axiosClient.post('/customers/bulk-update-status', { ids: customerIds, status });
    return response.data;
  }

  // Customer search
  static async search(query, params = {}) {
    const response = await axiosClient.get('/customers/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }
}

export default CustomerService;