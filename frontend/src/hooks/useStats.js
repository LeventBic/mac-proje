import { useQuery } from '@tanstack/react-query';
import axiosClient from '../config/axiosClient';

// API Service
const StatsService = {
  // Toplam ürün sayısını getir
  getProductCount: async () => {
    const response = await axiosClient.get('/stats/product-count');
    return response.data;
  },
};

// Query Keys
export const STATS_QUERY_KEYS = {
  all: ['stats'],
  productCount: () => [...STATS_QUERY_KEYS.all, 'productCount'],
};

// Toplam ürün sayısını getiren hook
export const useTotalProducts = () => {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.productCount(),
    queryFn: StatsService.getProductCount,
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    cacheTime: 10 * 60 * 1000, // 10 dakika memory'de tut
    refetchOnWindowFocus: false, // Pencere odaklandığında yeniden çekme
  });
};

export default {
  useTotalProducts,
};