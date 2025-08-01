import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomerService from '../services/customerService';
import toast from 'react-hot-toast';

// Query Keys
export const CUSTOMER_QUERY_KEYS = {
  all: ['customers'],
  lists: () => [...CUSTOMER_QUERY_KEYS.all, 'list'],
  list: (filters) => [...CUSTOMER_QUERY_KEYS.lists(), filters],
  details: () => [...CUSTOMER_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...CUSTOMER_QUERY_KEYS.details(), id],
  orders: (customerId) => [...CUSTOMER_QUERY_KEYS.all, 'orders', customerId],
  projects: (customerId) => [...CUSTOMER_QUERY_KEYS.all, 'projects', customerId],
  analytics: (customerId) => [...CUSTOMER_QUERY_KEYS.all, 'analytics', customerId],
  contacts: (customerId) => [...CUSTOMER_QUERY_KEYS.all, 'contacts', customerId],
  reports: (customerId) => [...CUSTOMER_QUERY_KEYS.all, 'reports', customerId],
  search: (query) => [...CUSTOMER_QUERY_KEYS.all, 'search', query],
};

// Get all customers
export const useCustomers = (params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => CustomerService.getAll(params),
    keepPreviousData: true,
  });
};

// Get single customer
export const useCustomer = (id) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.detail(id),
    queryFn: () => CustomerService.getById(id),
    enabled: !!id,
  });
};

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: CustomerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      toast.success('Müşteri başarıyla oluşturuldu');
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => CustomerService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(variables.id) });
      toast.success('Müşteri başarıyla güncellendi');
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: CustomerService.delete,
    onSuccess: (data, customerId) => {
      queryClient.removeQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      toast.success('Müşteri başarıyla silindi');
    },
  });
};

// Update customer status
export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => CustomerService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(variables.id) });
      toast.success('Müşteri durumu güncellendi');
    },
  });
};

// Customer Orders
export const useCustomerOrders = (customerId, params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.orders(customerId),
    queryFn: () => CustomerService.getCustomerOrders(customerId, params),
    enabled: !!customerId,
  });
};

// Customer Projects
export const useCustomerProjects = (customerId, params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.projects(customerId),
    queryFn: () => CustomerService.getCustomerProjects(customerId, params),
    enabled: !!customerId,
  });
};

// Customer Analytics
export const useCustomerAnalytics = (customerId, params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.analytics(customerId),
    queryFn: () => CustomerService.getCustomerAnalytics(customerId, params),
    enabled: !!customerId,
  });
};

// Customer Contacts
export const useCustomerContacts = (customerId) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.contacts(customerId),
    queryFn: () => CustomerService.getCustomerContacts(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, data }) => CustomerService.createCustomerContact(customerId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.contacts(variables.customerId) });
      toast.success('İletişim kişisi başarıyla oluşturuldu');
    },
  });
};

export const useUpdateCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, contactId, data }) => CustomerService.updateCustomerContact(customerId, contactId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.contacts(variables.customerId) });
      toast.success('İletişim kişisi başarıyla güncellendi');
    },
  });
};

export const useDeleteCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, contactId }) => CustomerService.deleteCustomerContact(customerId, contactId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.contacts(variables.customerId) });
      toast.success('İletişim kişisi başarıyla silindi');
    },
  });
};

// Customer Reports
export const useCustomerReport = (customerId, params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.reports(customerId),
    queryFn: () => CustomerService.getCustomerReport(customerId, params),
    enabled: !!customerId,
  });
};

export const useExportCustomer = () => {
  return useMutation({
    mutationFn: ({ id, format }) => CustomerService.exportCustomer(id, format),
    onSuccess: (response, variables) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer-${variables.id}.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Müşteri başarıyla dışa aktarıldı');
    },
  });
};

// Bulk Operations
export const useBulkDeleteCustomers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: CustomerService.bulkDelete,
    onSuccess: (data, customerIds) => {
      customerIds.forEach(id => {
        queryClient.removeQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      toast.success(`${customerIds.length} müşteri başarıyla silindi`);
    },
  });
};

export const useBulkUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, status }) => CustomerService.bulkUpdateStatus(ids, status),
    onSuccess: (data, variables) => {
      variables.ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() });
      toast.success(`${variables.ids.length} müşteri durumu güncellendi`);
    },
  });
};

// Customer Search
export const useCustomerSearch = (query, params = {}) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.search(query),
    queryFn: () => CustomerService.search(query, params),
    enabled: !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};