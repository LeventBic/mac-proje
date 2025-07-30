import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const userAPI = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
userAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API methods
const userService = {
  // Get all users (Admin only)
  getUsers: async () => {
    const response = await userAPI.get('/');
    return response;
  },

  // Create new user (Admin only)
  createUser: async (userData) => {
    const response = await userAPI.post('/', userData);
    return response;
  },

  // Update user status (Admin only)
  updateUser: async (userId, userData) => {
    const response = await userAPI.put(`/${userId}`, userData);
    return response;
  },

  // Delete user (Admin only)
  deleteUser: async (userId) => {
    const response = await userAPI.delete(`/${userId}`);
    return response;
  },

  // Change own password
  changePassword: async (userId, data) => {
    // Sadece gerekli parametreleri gönder
    const payload = {};
    if (typeof data.oldPassword === 'string') payload.oldPassword = data.oldPassword;
    if (typeof data.newPassword === 'string') payload.newPassword = data.newPassword;
    const response = await userAPI.put(`/${userId}/password`, payload);
    return response;
  },
};

export default userService; 