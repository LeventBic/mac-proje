import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeService from '../services/employeeService';
import toast from 'react-hot-toast';

// Query Keys
export const EMPLOYEE_QUERY_KEYS = {
  all: ['employees'],
  lists: () => [...EMPLOYEE_QUERY_KEYS.all, 'list'],
  list: (filters) => [...EMPLOYEE_QUERY_KEYS.lists(), filters],
  details: () => [...EMPLOYEE_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...EMPLOYEE_QUERY_KEYS.details(), id],
  departments: () => ['departments'],
  positions: () => ['positions'],
  statistics: () => [...EMPLOYEE_QUERY_KEYS.all, 'statistics'],
  search: (query) => [...EMPLOYEE_QUERY_KEYS.all, 'search', query],
};

// Hooks
export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.list(params),
    queryFn: () => EmployeeService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployee = (id) => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.detail(id),
    queryFn: () => EmployeeService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeDepartments = () => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.departments(),
    queryFn: EmployeeService.getDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useEmployeePositions = () => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.positions(),
    queryFn: EmployeeService.getPositions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useEmployeeStatistics = () => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.statistics(),
    queryFn: EmployeeService.getStatistics,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchEmployees = (query) => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.search(query),
    queryFn: () => EmployeeService.search(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutations
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: EmployeeService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      toast.success('Çalışan başarıyla oluşturuldu');
      return data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışan oluşturulurken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => EmployeeService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.detail(variables.id) });
      toast.success('Çalışan başarıyla güncellendi');
      return data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışan güncellenirken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: EmployeeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      toast.success('Çalışan başarıyla silindi');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışan silinirken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => EmployeeService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.detail(variables.id) });
      toast.success('Çalışan durumu başarıyla güncellendi');
      return data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışan durumu güncellenirken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};

export const useImportEmployees = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: EmployeeService.import,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.all });
      toast.success(`${data.imported || 0} çalışan başarıyla içe aktarıldı`);
      return data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışanlar içe aktarılırken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};

export const useExportEmployees = () => {
  return useMutation({
    mutationFn: ({ format, filters }) => EmployeeService.export(format, filters),
    onSuccess: (response, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees.${variables.format || 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Çalışanlar başarıyla dışa aktarıldı');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Çalışanlar dışa aktarılırken hata oluştu';
      toast.error(message);
      throw error;
    },
  });
};