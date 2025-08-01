import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsService } from '../services/reportsService';
import toast from 'react-hot-toast';

// Query keys
export const REPORTS_QUERY_KEYS = {
  all: ['reports'],
  stock: filters => [...REPORTS_QUERY_KEYS.all, 'stock', { filters }],
  production: filters => [...REPORTS_QUERY_KEYS.all, 'production', { filters }],
  sales: filters => [...REPORTS_QUERY_KEYS.all, 'sales', { filters }],
  financial: filters => [...REPORTS_QUERY_KEYS.all, 'financial', { filters }],
  inventory: filters => [...REPORTS_QUERY_KEYS.all, 'inventory', { filters }],
  customers: filters => [...REPORTS_QUERY_KEYS.all, 'customers', { filters }],
  suppliers: filters => [...REPORTS_QUERY_KEYS.all, 'suppliers', { filters }],
  summary: () => [...REPORTS_QUERY_KEYS.all, 'summary'],
};

// Get stock report
export const useStockReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.stock(filters),
    queryFn: () => reportsService.getStockReport(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get production report
export const useProductionReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.production(filters),
    queryFn: () => reportsService.getProductionReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get sales report
export const useSalesReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.sales(filters),
    queryFn: () => reportsService.getSalesReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get financial report
export const useFinancialReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.financial(filters),
    queryFn: () => reportsService.getFinancialReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get inventory report
export const useInventoryReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.inventory(filters),
    queryFn: () => reportsService.getInventoryReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get customer report
export const useCustomerReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.customers(filters),
    queryFn: () => reportsService.getCustomerReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get supplier report
export const useSupplierReport = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.suppliers(filters),
    queryFn: () => reportsService.getSupplierReport(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get report summary
export const useReportSummary = (options = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.summary(),
    queryFn: reportsService.getReportSummary,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Export report mutation
export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ reportType, format, filters }) =>
      reportsService.exportReport(reportType, format, filters),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variables.reportType}-report.${variables.format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Rapor başarıyla dışa aktarıldı');
    },
    onError: error => {
      const message =
        error.response?.data?.message || 'Rapor dışa aktarılırken hata oluştu';
      toast.error(message);
    },
  });
};

// Combined hook for dashboard reports
export const useDashboardReports = (activeTab = 'stock', filters = {}) => {
  const stockQuery = useStockReport(filters, {
    enabled: activeTab === 'stock',
  });
  const productionQuery = useProductionReport(filters, {
    enabled: activeTab === 'production',
  });
  const salesQuery = useSalesReport(filters, {
    enabled: activeTab === 'sales',
  });

  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'stock':
        return stockQuery;
      case 'production':
        return productionQuery;
      case 'sales':
        return salesQuery;
      default:
        return stockQuery;
    }
  };

  const currentQuery = getCurrentQuery();

  return {
    data: currentQuery.data,
    isLoading: currentQuery.isLoading,
    error: currentQuery.error,
    refetch: currentQuery.refetch,
    stockData: stockQuery.data,
    productionData: productionQuery.data,
    salesData: salesQuery.data,
  };
};

const reportsHooks = {
  useStockReport,
  useProductionReport,
  useSalesReport,
  useFinancialReport,
  useInventoryReport,
  useCustomerReport,
  useSupplierReport,
  useReportSummary,
  useExportReport,
  useDashboardReports,
};

export default reportsHooks;
