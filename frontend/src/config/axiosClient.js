import axios from 'axios';
import toast from 'react-hot-toast';

// API Base URL (LAN-friendly default: same host, backend on 3002)
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3002/api`
    : 'http://localhost:3002/api');

// Create axios instance
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
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

// Response interceptor - Handle common errors
axiosClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - Clear token and redirect to login
          localStorage.removeItem('token');
          toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
          window.location.href = '/login';
          break;

        case 403:
          toast.error('Bu işlem için yetkiniz bulunmuyor.');
          break;

        case 404:
          toast.error('İstenen kaynak bulunamadı.');
          break;

        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err.message || err));
          } else {
            toast.error(data.message || 'Geçersiz veri girişi.');
          }
          break;

        case 429:
          toast.error('Çok fazla istek gönderdiniz. Lütfen bekleyin.');
          break;

        case 500:
          toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
          break;

        default:
          toast.error(data.message || 'Bir hata oluştu.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
    } else {
      // Other error
      toast.error('Beklenmeyen bir hata oluştu.');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
