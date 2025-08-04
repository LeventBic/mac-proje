import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateCategoryData {
  name: string;
  description?: string;
}

interface UpdateCategoryData {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

// API fonksiyonları
const fetchCategories = async (): Promise<Category[]> => {
  const response = await axios.get('/api/categories');
  return response.data.data;
};

const createCategory = async (categoryData: CreateCategoryData): Promise<Category> => {
  const response = await axios.post('/api/categories', categoryData);
  return response.data.data;
};

const updateCategory = async (categoryData: UpdateCategoryData): Promise<Category> => {
  const response = await axios.put(`/api/categories/${categoryData.id}`, categoryData);
  return response.data;
};

const deleteCategory = async (id: number): Promise<void> => {
  await axios.delete(`/api/categories/${id}`);
};

// Custom hook - kategorileri getir
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 10 * 60 * 1000, // 10 dakika
  });
};

// Custom hook - kategori ekle
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      // Kategori listesini yenile
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Custom hook - kategori güncelle
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      // Kategori listesini yenile
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Custom hook - kategori sil
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      // Kategori listesini yenile
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Export types
export type { Category, CreateCategoryData, UpdateCategoryData };