import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StockService from '../services/stockService';
import toast from 'react-hot-toast';

// Query Keys
export const STOCK_QUERY_KEYS = {
  all: ['stock'],
  currentStock: () => [...STOCK_QUERY_KEYS.all, 'current'],
  currentStockList: (filters) => [...STOCK_QUERY_KEYS.currentStock(), 'list', filters],
  currentStockDetail: (id) => [...STOCK_QUERY_KEYS.currentStock(), 'detail', id],
  adjustments: () => [...STOCK_QUERY_KEYS.all, 'adjustments'],
  adjustmentsList: (filters) => [...STOCK_QUERY_KEYS.adjustments(), 'list', filters],
  adjustmentDetail: (id) => [...STOCK_QUERY_KEYS.adjustments(), 'detail', id],
  transfers: () => [...STOCK_QUERY_KEYS.all, 'transfers'],
  transfersList: (filters) => [...STOCK_QUERY_KEYS.transfers(), 'list', filters],
  transferDetail: (id) => [...STOCK_QUERY_KEYS.transfers(), 'detail', id],
  reorder: () => [...STOCK_QUERY_KEYS.all, 'reorder'],
  reorderList: (filters) => [...STOCK_QUERY_KEYS.reorder(), 'list', filters],
  locations: () => ['locations'],
  reports: () => [...STOCK_QUERY_KEYS.all, 'reports'],
  valuation: () => [...STOCK_QUERY_KEYS.all, 'valuation'],
  movements: (filters) => [...STOCK_QUERY_KEYS.all, 'movements', filters],
  stats: (params) => [...STOCK_QUERY_KEYS.all, 'stats', params],
  inventoryAnalysis: (params) => [...STOCK_QUERY_KEYS.all, 'inventory-analysis', params],
};

// Current Stock Hooks
export const useCurrentStock = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.currentStockList(params),
    queryFn: () => StockService.getCurrentStock(params),
    keepPreviousData: true,
  });
};

export const useCurrentStockItem = (id) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.currentStockDetail(id),
    queryFn: () => StockService.getStockById(id),
    enabled: !!id,
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => StockService.updateStock(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStockDetail(variables.id) });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok başarıyla güncellendi');
    },
  });
};

// Stock Adjustments Hooks
export const useStockAdjustments = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.adjustmentsList(params),
    queryFn: () => StockService.getStockAdjustments(params),
    keepPreviousData: true,
  });
};

export const useStockAdjustment = (id) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.adjustmentDetail(id),
    queryFn: () => StockService.getStockAdjustmentById(id),
    enabled: !!id,
  });
};

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.adjustments() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok düzeltmesi başarıyla oluşturuldu');
    },
  });
};

export const useUpdateStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => StockService.updateStockAdjustment(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.adjustments() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.adjustmentDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok düzeltmesi başarıyla güncellendi');
    },
  });
};

export const useDeleteStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.deleteStockAdjustment,
    onSuccess: (data, adjustmentId) => {
      queryClient.removeQueries({ queryKey: STOCK_QUERY_KEYS.adjustmentDetail(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.adjustments() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      toast.success('Stok düzeltmesi başarıyla silindi');
    },
  });
};

// Stock Transfers Hooks
export const useStockTransfers = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.transfersList(params),
    queryFn: () => StockService.getStockTransfers(params),
    keepPreviousData: true,
  });
};

export const useStockTransfer = (id) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.transferDetail(id),
    queryFn: () => StockService.getStockTransferById(id),
    enabled: !!id,
  });
};

export const useCreateStockTransfer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.createStockTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transfers() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok transferi başarıyla oluşturuldu');
    },
  });
};

export const useUpdateStockTransfer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => StockService.updateStockTransfer(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transfers() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transferDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok transferi başarıyla güncellendi');
    },
  });
};

export const useDeleteStockTransfer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.deleteStockTransfer,
    onSuccess: (data, transferId) => {
      queryClient.removeQueries({ queryKey: STOCK_QUERY_KEYS.transferDetail(transferId) });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transfers() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      toast.success('Stok transferi başarıyla silindi');
    },
  });
};

export const useApproveStockTransfer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.approveStockTransfer,
    onSuccess: (data, transferId) => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transfers() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transferDetail(transferId) });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.currentStock() });
      // Invalidate dashboard queries to update stock stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate product queries as stock changes may affect product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok transferi başarıyla onaylandı');
    },
  });
};

export const useRejectStockTransfer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }) => StockService.rejectStockTransfer(id, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transfers() });
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.transferDetail(variables.id) });
      toast.success('Stok transferi reddedildi');
    },
  });
};

// Stock Reorder Hooks
export const useStockReorder = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.reorderList(params),
    queryFn: () => StockService.getReorderData(params),
    keepPreviousData: true,
  });
};

export const useUpdateReorderLevels = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => StockService.updateReorderLevels(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.reorder() });
      toast.success('Yeniden sipariş seviyeleri güncellendi');
    },
  });
};

// Locations Hooks
export const useLocations = () => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.locations(),
    queryFn: StockService.getLocations,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.locations() });
      toast.success('Lokasyon başarıyla oluşturuldu');
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => StockService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.locations() });
      toast.success('Lokasyon başarıyla güncellendi');
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: StockService.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.locations() });
      toast.success('Lokasyon başarıyla silindi');
    },
  });
};

// Reports and Analytics
export const useStockReport = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.reports(),
    queryFn: () => StockService.getStockReport(params),
    enabled: Object.keys(params).length > 0,
  });
};

export const useStockValuation = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.valuation(),
    queryFn: () => StockService.getStockValuation(params),
  });
};

export const useExportStockReport = () => {
  return useMutation({
    mutationFn: ({ format, filters }) => StockService.exportStockReport(format, filters),
    onSuccess: (response, variables) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock-report.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Stok raporu başarıyla dışa aktarıldı');
    },
  });
};

// Stock Movements Hook
export const useStockMovements = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.movements(params),
    queryFn: () => StockService.getStockMovements(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Stock Transfer Stats Hook
export const useStockTransferStats = () => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.transfers(), 'stats'],
    queryFn: () => StockService.getStockTransferStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create Stock Reorder Orders Hook
export const useCreateStockReorderOrders = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData) => StockService.createStockReorderOrders(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.reorder() });
      toast.success('Yeniden sipariş emirleri başarıyla oluşturuldu');
    },
  });
};

// Stock Reorder History Hook
export const useStockReorderHistory = (params = {}) => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.reorder(), 'history', params],
    queryFn: () => StockService.getStockReorderHistory(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Stock Reorder Needed Hook
export const useStockReorderNeeded = (params = {}) => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.reorder(), 'needed', params],
    queryFn: () => StockService.getStockReorderNeeded(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Update Stock Reorder Settings Hook
export const useUpdateStockReorderSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, settings }) => StockService.updateStockReorderSettings(id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.reorder() });
      toast.success('Yeniden sipariş ayarları güncellendi');
    },
  });
};

// Stock Adjustment Stats Hook
export const useStockAdjustmentStats = () => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.adjustments(), 'stats'],
    queryFn: () => StockService.getStockAdjustmentStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Inventory Valuation Hook
export const useInventoryValuation = (params = {}) => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.valuation(), params],
    queryFn: () => StockService.getInventoryValuation(params),
    keepPreviousData: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Inventory Alerts Hook
export const useInventoryAlerts = (params = {}) => {
  return useQuery({
    queryKey: [...STOCK_QUERY_KEYS.all, 'alerts', params],
    queryFn: () => StockService.getInventoryAlerts(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Inventory Analysis Hook
export const useInventoryAnalysis = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.inventoryAnalysis(params),
    queryFn: () => StockService.getInventoryAnalysis(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStockStats = (params = {}) => {
  return useQuery({
    queryKey: STOCK_QUERY_KEYS.stats(params),
    queryFn: () => StockService.getStockStats(params),
    staleTime: 5 * 60 * 1000,
  });
};