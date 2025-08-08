import axiosClient from '../config/axiosClient';

class EmployeeService {
  // Get all employees with filters
  static async getAll(params = {}) {
    const response = await axiosClient.get('/employees', { params });
    return response.data;
  }

  // Get single employee by ID
  static async getById(id) {
    const response = await axiosClient.get(`/employees/${id}`);
    return response.data;
  }

  // Create new employee
  static async create(employeeData) {
    const response = await axiosClient.post('/employees', employeeData);
    return response.data;
  }

  // Update employee
  static async update(id, employeeData) {
    const response = await axiosClient.put(`/employees/${id}`, employeeData);
    return response.data;
  }

  // Delete employee
  static async delete(id) {
    const response = await axiosClient.delete(`/employees/${id}`);
    return response.data;
  }

  // Update employee status
  static async updateStatus(id, status) {
    const response = await axiosClient.patch(`/employees/${id}/status`, { status });
    return response.data;
  }

  // Search employees
  static async search(query, params = {}) {
    const response = await axiosClient.get('/employees/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  // Get employee statistics
  static async getStatistics() {
    const response = await axiosClient.get('/employees/statistics');
    return response.data;
  }

  // Export employees
  static async export(format = 'csv', filters = {}) {
    const response = await axiosClient.get('/employees/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response;
  }

  // Import employees
  static async import(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosClient.post('/employees/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get employee departments
  static async getDepartments() {
    const response = await axiosClient.get('/employees/departments');
    return response.data;
  }

  // Get employee positions
  static async getPositions() {
    const response = await axiosClient.get('/employees/positions');
    return response.data;
  }
}

export default EmployeeService;