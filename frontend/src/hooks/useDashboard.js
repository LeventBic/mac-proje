import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';

// Query Keys
export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'],
  main: () => [...DASHBOARD_QUERY_KEYS.all, 'main'],
  products: () => [...DASHBOARD_QUERY_KEYS.all, 'products'],
  stock: () => [...DASHBOARD_QUERY_KEYS.all, 'stock'],
  production: () => [...DASHBOARD_QUERY_KEYS.all, 'production'],
  sales: () => [...DASHBOARD_QUERY_KEYS.all, 'sales'],
  financial: () => [...DASHBOARD_QUERY_KEYS.all, 'financial'],
  activities: () => [...DASHBOARD_QUERY_KEYS.all, 'activities'],
  alerts: () => [...DASHBOARD_QUERY_KEYS.all, 'alerts'],
  performance: () => [...DASHBOARD_QUERY_KEYS.all, 'performance'],
  charts: (chartType) => [...DASHBOARD_QUERY_KEYS.all, 'charts', chartType],
  kpi: () => [...DASHBOARD_QUERY_KEYS.all, 'kpi'],
  inventoryAlerts: () => [...DASHBOARD_QUERY_KEYS.all, 'inventory-alerts'],
  lowStock: () => [...DASHBOARD_QUERY_KEYS.all, 'low-stock'],
  overstock: () => [...DASHBOARD_QUERY_KEYS.all, 'overstock'],
  productionAlerts: () => [...DASHBOARD_QUERY_KEYS.all, 'production-alerts'],
  realtime: () => [...DASHBOARD_QUERY_KEYS.all, 'realtime'],
  widgets: (userId) => [...DASHBOARD_QUERY_KEYS.all, 'widgets', userId],
};

// Main Dashboard Data
export const useDashboard = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.main(),
    queryFn: () => DashboardService.getDashboardData(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Statistics Hooks
export const useProductStats = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.products(),
    queryFn: () => DashboardService.getProductStats(params),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useStockStats = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.stock(),
    queryFn: () => DashboardService.getStockStats(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useProductionStats = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.production(),
    queryFn: () => DashboardService.getProductionStats(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useSalesStats = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.sales(),
    queryFn: () => DashboardService.getSalesStats(params),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useFinancialStats = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.financial(),
    queryFn: () => DashboardService.getFinancialStats(params),
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
};

// Activities and Alerts
export const useRecentActivities = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.activities(),
    queryFn: () => DashboardService.getRecentActivities(params),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useAlerts = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.alerts(),
    queryFn: () => DashboardService.getAlerts(params),
    refetchInterval: 1 * 60 * 1000, // Refetch every minute
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: DashboardService.markAlertAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.alerts() });
    },
  });
};

export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: DashboardService.markAllAlertsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.alerts() });
      toast.success('Tüm uyarılar okundu olarak işaretlendi');
    },
  });
};

// Performance and Analytics
export const usePerformanceMetrics = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.performance(),
    queryFn: () => DashboardService.getPerformanceMetrics(params),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useChartData = (chartType, params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.charts(chartType),
    queryFn: () => DashboardService.getChartData(chartType, params),
    enabled: !!chartType,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useKPIData = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.kpi(),
    queryFn: () => DashboardService.getKPIData(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Inventory Alerts
export const useInventoryAlerts = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.inventoryAlerts(),
    queryFn: () => DashboardService.getInventoryAlerts(params),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useLowStockAlerts = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.lowStock(),
    queryFn: () => DashboardService.getLowStockAlerts(params),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useOverstockAlerts = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.overstock(),
    queryFn: () => DashboardService.getOverstockAlerts(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useProductionAlerts = (params = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.productionAlerts(),
    queryFn: () => DashboardService.getProductionAlerts(params),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

// Real-time Data
export const useRealTimeData = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.realtime(),
    queryFn: DashboardService.getRealTimeData,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Widget Configuration
export const useWidgetConfig = (userId) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.widgets(userId),
    queryFn: () => DashboardService.getWidgetConfig(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateWidgetConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, config }) => DashboardService.updateWidgetConfig(userId, config),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.widgets(variables.userId) });
      toast.success('Widget konfigürasyonu güncellendi');
    },
  });
};

// Export Dashboard
export const useExportDashboard = () => {
  return useMutation({
    mutationFn: ({ format, params }) => DashboardService.exportDashboard(format, params),
    onSuccess: (response, variables) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Dashboard başarıyla dışa aktarıldı');
    },
  });
};

// Combined hook for dashboard overview
export const useDashboardOverview = (params = {}) => {
  const dashboardData = useDashboard(params);
  const productStats = useProductStats(params);
  const stockStats = useStockStats(params);
  const productionStats = useProductionStats(params);
  const alerts = useAlerts(params);
  const recentActivities = useRecentActivities(params);
  
  return {
    dashboard: dashboardData,
    products: productStats,
    stock: stockStats,
    production: productionStats,
    alerts,
    activities: recentActivities,
    isLoading: dashboardData.isLoading || productStats.isLoading || stockStats.isLoading || productionStats.isLoading,
    isError: dashboardData.isError || productStats.isError || stockStats.isError || productionStats.isError,
  };
};