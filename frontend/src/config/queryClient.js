import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      onError: error => {
        // Don't show toast for 401 errors as they're handled by axios interceptor
        if (error?.response?.status !== 401) {
          toast.error(
            error?.response?.data?.message || 'Veri yüklenirken hata oluştu'
          );
        }
      },
    },
    mutations: {
      retry: false,
      onError: error => {
        // Don't show toast for 401 errors as they're handled by axios interceptor
        if (error?.response?.status !== 401) {
          toast.error(
            error?.response?.data?.message || 'İşlem sırasında hata oluştu'
          );
        }
      },
    },
  },
});

export default queryClient;
