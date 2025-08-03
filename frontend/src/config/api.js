// DEPRECATED: This file is no longer used in the new architecture
// The project has been migrated to use:
// - Centralized axiosClient (src/config/axiosClient.js)
// - Service layer (src/services/)
// - React Query hooks (src/hooks/)
// This file is kept for backward compatibility but should not be used in new code

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

// Remove trailing /api if it exists to prevent double /api/api
const cleanBaseUrl = API_BASE_URL.replace(/\/api$/, '');

// API Helper function
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  // ✅ FIX: Remove extra /api to prevent double /api/api
  const url = `${cleanBaseUrl}${endpoint}`;
  
  console.log('🔗 API Call URL:', url); // Debug log
  console.log('📝 Endpoint:', endpoint); // Debug log
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default apiCall;