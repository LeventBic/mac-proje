import axiosClient from '../config/axiosClient';

class AuthService {
  // Login user
  static async login(credentials) {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  }

  // Register user (admin only)
  static async register(userData) {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  }

  // Refresh token
  static async refreshToken(refreshTokenData) {
    const response = await axiosClient.post('/auth/refresh', refreshTokenData);
    return response.data;
  }

  // Get current user profile
  static async getProfile() {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  }

  // Update profile
  static async updateProfile(profileData) {
    const response = await axiosClient.put('/auth/profile', profileData);
    return response.data;
  }

  // Change password
  static async changePassword(passwordData) {
    const response = await axiosClient.put(
      '/auth/change-password',
      passwordData
    );
    return response.data;
  }

  // Forgot password
  static async forgotPassword(email) {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  static async resetPassword(resetData) {
    const response = await axiosClient.post('/auth/reset-password', resetData);
    return response.data;
  }

  // Verify email
  static async verifyEmail(token) {
    const response = await axiosClient.post('/auth/verify-email', { token });
    return response.data;
  }

  // Resend verification email
  static async resendVerification(email) {
    const response = await axiosClient.post('/auth/resend-verification', {
      email,
    });
    return response.data;
  }

  // Logout (client-side only for now)
  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get stored user data
  static getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Store user data
  static setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Store tokens
  static setTokens(token, refreshToken) {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  // Get stored token
  static getToken() {
    return localStorage.getItem('token');
  }

  // Get stored refresh token
  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }
}

export default AuthService;
