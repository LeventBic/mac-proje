import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API methods
const authService = {
  // Login user
  login: async (credentials) => {
    const response = await authAPI.post('/login', credentials);
    return response;
  },

  // Register user (admin only)
  register: async (userData) => {
    const token = localStorage.getItem('token');
    const response = await authAPI.post('/register', userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },

  // Refresh token
  refreshToken: async (refreshTokenData) => {
    const response = await authAPI.post('/refresh', refreshTokenData);
    return response;
  },

  // Get current user profile
  getProfile: async () => {
    const token = localStorage.getItem('token');
    const response = await authAPI.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },

  // Logout (client-side only for now)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return Promise.resolve();
  },
};

export default authService;
