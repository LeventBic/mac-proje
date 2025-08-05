import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bomService from '../services/bomService';
import ProductService from '../services/productService';
import toast from 'react-hot-toast';

// Query keys
export const BOM_QUERY_KEYS = {
  all: ['bom'],
  lists: () => [...BOM_QUERY_KEYS.all, 'list'],
  list: filters => [...BOM_QUERY_KEYS.lists(), { filters }],
  details: () => [...BOM_QUERY_KEYS.all, 'detail'],
  detail: id => [...BOM_QUERY_KEYS.details(), id],
  tree: id => [...BOM_QUERY_KEYS.all, 'tree', id],
  cost: (id, quantity) => [...BOM_QUERY_KEYS.all, 'cost', id, quantity],
  stats: () => [...BOM_QUERY_KEYS.all, 'stats'],
  availableSubBOMs: excludeId => [
    ...BOM_QUERY_KEYS.all,
    'availableSubBOMs',
    excludeId,
  ],
  search: searchTerm => [...BOM_QUERY_KEYS.all, 'search', searchTerm],
};

// Get all BOMs
export const useBOMs = (options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.lists(),
    queryFn: bomService.getBOMs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get BOM by ID
export const useBOM = (id, options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.detail(id),
    queryFn: () => bomService.getBOM(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get BOM tree
export const useBOMTree = (id, options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.tree(id),
    queryFn: () => bomService.getBOMTree(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get BOM cost
export const useBOMCost = (id, quantity = 1, options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.cost(id, quantity),
    queryFn: () => bomService.getBOMCost(id, quantity),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get BOM statistics
export const useBOMStats = (options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.stats(),
    queryFn: bomService.getBOMStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Get available sub-BOMs
export const useAvailableSubBOMs = (excludeId = null, options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.availableSubBOMs(excludeId),
    queryFn: () => bomService.getAvailableSubBOMs(excludeId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get products for BOM creation
export const useBOMProducts = (options = {}) => {
  return useQuery({
    queryKey: ['products', 'for-bom'],
    queryFn: () => ProductService.getAll(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get raw materials for BOM items
export const useBOMRawMaterials = (options = {}) => {
  return useQuery({
    queryKey: ['products', 'raw-materials'],
    queryFn: () => ProductService.getAll({ type: 'raw_material' }),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Search BOMs
export const useSearchBOMs = (searchTerm, options = {}) => {
  return useQuery({
    queryKey: BOM_QUERY_KEYS.search(searchTerm),
    queryFn: () => bomService.searchBOMs(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Create BOM mutation
export const useCreateBOM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bomService.createBOM,
    onSuccess: _data => {
      // Invalidate and refetch BOMs
      queryClient.invalidateQueries({ queryKey: BOM_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate dashboard queries to update BOM stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate stock queries as BOM changes may affect stock calculations
      queryClient.invalidateQueries({ queryKey: ['stock'] });

      toast.success('Reçete başarıyla oluşturuldu');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Reçete oluşturulurken hata oluştu';
      toast.error(message);
    },
  });
};

// Update BOM mutation
export const useUpdateBOM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...bomData }) => bomService.updateBOM(id, bomData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch BOMs
      queryClient.invalidateQueries({ queryKey: BOM_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: BOM_QUERY_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate dashboard queries to update BOM stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate stock queries as BOM changes may affect stock calculations
      queryClient.invalidateQueries({ queryKey: ['stock'] });

      toast.success('Reçete başarıyla güncellendi');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Reçete güncellenirken hata oluştu';
      toast.error(message);
    },
  });
};

// Delete BOM mutation
export const useDeleteBOM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bomService.deleteBOM,
    onSuccess: () => {
      // Invalidate and refetch BOMs
      queryClient.invalidateQueries({ queryKey: BOM_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate dashboard queries to update BOM stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate stock queries as BOM changes may affect stock calculations
      queryClient.invalidateQueries({ queryKey: ['stock'] });

      toast.success('Reçete başarıyla silindi');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Reçete silinirken hata oluştu';
      toast.error(message);
    },
  });
};

// Update profit margin mutation
export const useUpdateProfitMargin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, profitMargin }) =>
      bomService.updateProfitMargin(id, profitMargin),
    onSuccess: (data, variables) => {
      // Invalidate and refetch BOMs
      queryClient.invalidateQueries({ queryKey: BOM_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: BOM_QUERY_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: BOM_QUERY_KEYS.cost(variables.id),
      });

      toast.success('Kar marjı başarıyla güncellendi');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Kar marjı güncellenirken hata oluştu';
      toast.error(message);
    },
  });
};

// Export BOMs mutation
export const useExportBOMs = () => {
  return useMutation({
    mutationFn: bomService.exportBOMs,
    onSuccess: (blob, format) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bom-export.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Reçete verileri başarıyla dışa aktarıldı');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Dışa aktarma sırasında hata oluştu';
      toast.error(message);
    },
  });
};

// Combined hook for BOM overview
export const useBOMOverview = () => {
  const bomsQuery = useBOMs();
  const statsQuery = useBOMStats();

  return {
    boms: bomsQuery.data,
    stats: statsQuery.data,
    isLoading: bomsQuery.isLoading || statsQuery.isLoading,
    error: bomsQuery.error || statsQuery.error,
    refetch: () => {
      bomsQuery.refetch();
      statsQuery.refetch();
    },
  };
};

const bomHooks = {
  useBOMs,
  useBOM,
  useBOMTree,
  useBOMCost,
  useBOMStats,
  useAvailableSubBOMs,
  useBOMProducts,
  useBOMRawMaterials,
  useSearchBOMs,
  useCreateBOM,
  useUpdateBOM,
  useDeleteBOM,
  useUpdateProfitMargin,
  useExportBOMs,
  useBOMOverview,
};

export default bomHooks;
