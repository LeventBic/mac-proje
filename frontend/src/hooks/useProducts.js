import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProductService from '../services/productService';
import toast from 'react-hot-toast';

// Query Keys
export const PRODUCT_QUERY_KEYS = {
  all: ['products'],
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'],
  list: (filters) => [...PRODUCT_QUERY_KEYS.lists(), filters],
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...PRODUCT_QUERY_KEYS.details(), id],
  categories: () => ['categories'],
  productTypes: () => ['product-types'],
  suppliers: () => ['suppliers'],
};

// Get all products
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => ProductService.getAll(params),
    keepPreviousData: true,
  });
};

// Get single product
export const useProduct = (id) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => ProductService.getById(id),
    enabled: !!id,
  });
};

// Get categories
export const useCategories = () => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.categories(),
    queryFn: ProductService.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get product types
export const useProductTypes = () => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.productTypes(),
    queryFn: ProductService.getProductTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get suppliers
export const useSuppliers = () => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.suppliers(),
    queryFn: ProductService.getSuppliers,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.create,
    onSuccess: (_data) => {
      // Invalidate all product queries (including filtered ones)
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Ürün başarıyla oluşturuldu');
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => ProductService.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate all product queries (including filtered ones)
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      // Update the specific product in cache
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
      toast.success('Ürün başarıyla güncellendi');
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.delete,
    onSuccess: (data, productId) => {
      // Remove the product from cache
      queryClient.removeQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(productId) });
      // Invalidate all product queries (including filtered ones)
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Ürün başarıyla silindi');
    },
  });
};

// Bulk delete products mutation
export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.bulkDelete,
    onSuccess: (data, productIds) => {
      // Remove the products from cache
      productIds.forEach(id => {
        queryClient.removeQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(id) });
      });
      // Invalidate all product queries (including filtered ones)
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success(`${productIds.length} ürün başarıyla silindi`);
    },
  });
};

// Import products mutation
export const useImportProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.import,
    onSuccess: (_data) => {
      // Invalidate all product queries (including filtered ones)
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Ürünler başarıyla içe aktarıldı');
    },
  });
};

// Export products mutation
export const useExportProducts = () => {
  return useMutation({
    mutationFn: ({ format, filters }) => ProductService.export(format, filters),
    onSuccess: (response, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ürünler başarıyla dışa aktarıldı');
    },
  });
};