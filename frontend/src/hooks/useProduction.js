import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import ProductionService from '../services/productionService';

// Query keys
const QUERY_KEYS = {
  PRODUCTION_ORDERS: 'productionOrders',
  PRODUCTION_ORDER: 'productionOrder',
  PRODUCTION_STATS: 'productionStats',
  PRODUCTION_BOMS: 'productionBOMs',
  PRODUCTION_CAPACITY: 'productionCapacity',
  PRODUCTION_SCHEDULE: 'productionSchedule',
};

// Get all production orders
export const useProductionOrders = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_ORDERS, params],
    queryFn: () => ProductionService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single production order
export const useProductionOrder = id => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_ORDER, id],
    queryFn: () => ProductionService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Get production statistics
export const useProductionStats = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_STATS, params],
    queryFn: () => ProductionService.getStats(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get BOMs for production
export const useProductionBOMs = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_BOMS, params],
    queryFn: () => ProductionService.getBOMs(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get production capacity
export const useProductionCapacity = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_CAPACITY, params],
    queryFn: () => ProductionService.getCapacity(params),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get production schedule
export const useProductionSchedule = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_SCHEDULE, params],
    queryFn: () => ProductionService.getSchedule(params),
    staleTime: 10 * 60 * 1000,
  });
};

// Create production order mutation
export const useCreateProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductionService.create,
    onSuccess: _data => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_STATS],
      });
      toast.success('Üretim emri başarıyla oluşturuldu');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message ||
          'Üretim emri oluşturulurken hata oluştu'
      );
    },
  });
};

// Update production order mutation
export const useUpdateProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => ProductionService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDER, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_STATS],
      });
      toast.success('Üretim emri başarıyla güncellendi');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message ||
          'Üretim emri güncellenirken hata oluştu'
      );
    },
  });
};

// Delete production order mutation
export const useDeleteProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_STATS],
      });
      toast.success('Üretim emri başarıyla silindi');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Üretim emri silinirken hata oluştu'
      );
    },
  });
};

// Start production order mutation
export const useStartProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductionService.start,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDER, id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_STATS],
      });
      toast.success('Üretim başarıyla başlatıldı');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Üretim başlatılırken hata oluştu'
      );
    },
  });
};

// Complete production order mutation
export const useCompleteProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => ProductionService.complete(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDER, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_STATS],
      });
      toast.success('Üretim başarıyla tamamlandı');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Üretim tamamlanırken hata oluştu'
      );
    },
  });
};

// Add production movement mutation
export const useAddProductionMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => ProductionService.addMovement(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDER, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PRODUCTION_ORDERS],
      });
      toast.success('Üretim hareketi başarıyla kaydedildi');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message ||
          'Üretim hareketi kaydedilirken hata oluştu'
      );
    },
  });
};

// Search production orders
export const useSearchProductionOrders = (query, params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTION_ORDERS, 'search', query, params],
    queryFn: () => ProductionService.search(query, params),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

// Export production data mutation
export const useExportProductionData = () => {
  return useMutation({
    mutationFn: ({ format, ...params }) =>
      ProductionService.export(format, params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production-data.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Üretim verileri başarıyla dışa aktarıldı');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Veri dışa aktarılırken hata oluştu'
      );
    },
  });
};

// Combined hook for production overview
export const useProductionOverview = (params = {}) => {
  const orders = useProductionOrders(params);
  const stats = useProductionStats(params);
  const capacity = useProductionCapacity(params);
  const schedule = useProductionSchedule(params);

  return {
    orders,
    stats,
    capacity,
    schedule,
    isLoading:
      orders.isLoading ||
      stats.isLoading ||
      capacity.isLoading ||
      schedule.isLoading,
    isError:
      orders.isError || stats.isError || capacity.isError || schedule.isError,
  };
};

const productionHooks = {
  useProductionOrders,
  useProductionOrder,
  useProductionStats,
  useProductionBOMs,
  useProductionCapacity,
  useProductionSchedule,
  useCreateProductionOrder,
  useUpdateProductionOrder,
  useDeleteProductionOrder,
  useStartProductionOrder,
  useCompleteProductionOrder,
  useAddProductionMovement,
  useSearchProductionOrders,
  useExportProductionData,
  useProductionOverview,
};

export default productionHooks;
