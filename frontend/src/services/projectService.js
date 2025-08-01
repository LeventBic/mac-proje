import axiosClient from '../config/axiosClient';

class ProjectService {
  // Get all projects with filters
  static async getAll(params = {}) {
    const response = await axiosClient.get('/projects', { params });
    return response.data;
  }

  // Get single project by ID
  static async getById(id) {
    const response = await axiosClient.get(`/projects/${id}`);
    return response.data;
  }

  // Create new project
  static async create(projectData) {
    const response = await axiosClient.post('/projects', projectData);
    return response.data;
  }

  // Update project
  static async update(id, projectData) {
    const response = await axiosClient.put(`/projects/${id}`, projectData);
    return response.data;
  }

  // Delete project
  static async delete(id) {
    const response = await axiosClient.delete(`/projects/${id}`);
    return response.data;
  }

  // Project status operations
  static async updateStatus(id, status) {
    const response = await axiosClient.patch(`/projects/${id}/status`, { status });
    return response.data;
  }

  // Project tasks
  static async getTasks(projectId, params = {}) {
    const response = await axiosClient.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  }

  static async createTask(projectId, taskData) {
    const response = await axiosClient.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  }

  static async updateTask(projectId, taskId, taskData) {
    const response = await axiosClient.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  }

  static async deleteTask(projectId, taskId) {
    const response = await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }

  // Project timeline
  static async getTimeline(projectId) {
    const response = await axiosClient.get(`/projects/${projectId}/timeline`);
    return response.data;
  }

  // Project reports
  static async getProjectReport(id) {
    const response = await axiosClient.get(`/projects/${id}/report`);
    return response.data;
  }

  static async exportProject(id, format = 'pdf') {
    const response = await axiosClient.get(`/projects/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  }

  // Project analytics
  static async getProjectAnalytics(params = {}) {
    const response = await axiosClient.get('/projects/analytics', { params });
    return response.data;
  }
}

export default ProjectService;