import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axiosClient from '../config/axiosClient';

// Query Keys
export const SUPPLIER_QUERY_KEYS = {
  all: ['suppliers'],
  lists: () => [...SUPPLIER_QUERY_KEYS.all, 'list'],
  list: (params) => [...SUPPLIER_QUERY_KEYS.lists(), params],
  details: () => [...SUPPLIER_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...SUPPLIER_QUERY_KEYS.details(), id],
};

// Supplier Service Functions
const supplierService = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get('/suppliers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post('/suppliers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  search: async (query, limit = 10) => {
    const response = await axiosClient.get('/suppliers/search', {
      params: { q: query, limit }
    });
    return response.data;
  },
};

// Hooks
export const useSuppliers = (params = {}) => {
  return useQuery({
    queryKey: SUPPLIER_QUERY_KEYS.list(params),
    queryFn: () => supplierService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSupplier = (id) => {
  return useQuery({
    queryKey: SUPPLIER_QUERY_KEYS.detail(id),
    queryFn: () => supplierService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supplierService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.lists() });
      toast.success('Tedarikçi başarıyla oluşturuldu');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Tedarikçi oluşturulurken hata oluştu');
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => supplierService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.detail(variables.id) });
      toast.success('Tedarikçi başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Tedarikçi güncellenirken hata oluştu');
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supplierService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.lists() });
      toast.success('Tedarikçi başarıyla silindi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Tedarikçi silinirken hata oluştu');
    },
  });
};

export const useSearchSuppliers = (query, options = {}) => {
  return useQuery({
    queryKey: ['suppliers', 'search', query],
    queryFn: () => supplierService.search(query, options.limit),
    enabled: !!query && query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};