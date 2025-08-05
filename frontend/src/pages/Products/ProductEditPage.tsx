import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { formatPriceTR, parseFormattedNumber } from '../../utils/formatters';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  brand_id?: number;
  category_id?: number;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  supplier_id?: number;
  barcode?: string;
  qr_code?: string;
  is_active: boolean;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  brand_id: number | null;
  category_id: number | null;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  supplier_id: number | null;
  barcode: string;
  qr_code: string;
  is_active: boolean;
}

// API Functions
const fetchProduct = async (id: string): Promise<Product> => {
  const response = await axios.get(`/api/products/${id}`);
  return response.data.data;
};

const updateProduct = async ({ id, data }: { id: string; data: ProductFormData }): Promise<Product> => {
  const response = await axios.put(`/api/products/${id}`, data);
  return response.data.data;
};

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<ProductFormData>();

  // Fetch product data using React Query
  const {
    data: product,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id, // Only run query if id exists
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update mutation using React Query
  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      // KRİTİK: Önbellek güncelleme işlemleri
      // Ana ürün listesini yenilemek için
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Şu anki düzenleme sayfasındaki veriyi yenilemek için
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      
      // Başarı mesajı göster
      toast.success('Ürün başarıyla güncellendi!');
      
      // Ürün listesi sayfasına yönlendir
      navigate('/products');
    },
    onError: (error: AxiosError) => {
      // Kullanıcıya hata mesajı göster
      const errorMessage = (error?.response?.data as any)?.message || 
                          error?.message || 
                          'Ürün güncellenirken bir hata oluştu';
      toast.error(`Güncelleme Hatası: ${errorMessage}`);
    }
  });

  // Form verilerini product data ile doldur
  useEffect(() => {
    if (product) {
      // Form alanlarını mevcut ürün verileriyle doldur
      setValue('name', product.name || '');
      setValue('sku', product.sku || '');
      setValue('description', product.description || '');
      setValue('brand_id', product.brand_id || null);
      setValue('category_id', product.category_id || null);
      setValue('unit_price', product.unit_price || 0);
      setValue('cost_price', product.cost_price || 0);
      setValue('current_stock', product.current_stock || 0);
      setValue('supplier_id', product.supplier_id || null);
      setValue('barcode', product.barcode || '');
      setValue('qr_code', product.qr_code || '');
      setValue('is_active', product.is_active ?? true);
    }
  }, [product, setValue]);

  // Form submit handler
  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!id) return;
    
    try {
      // Mutation'ı çağır
      await updateMutation.mutateAsync({ id, data });
    } catch (error) {
      // Error handling is done in mutation's onError
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ürün bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ürün Bulunamadı</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Ürün bilgileri yüklenirken bir hata oluştu'}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Ürün Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ürün Düzenle</h1>
              <p className="mt-2 text-gray-600">
                {product?.name} - {product?.sku}
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ürün Adı */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Ürün adı zorunludur' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ürün adını girin"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  {...register('sku', { required: 'SKU zorunludur' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SKU girin"
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                )}
              </div>

              {/* Marka */}
              <div>
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Marka ID
                </label>
                <input
                  type="number"
                  id="brand_id"
                  {...register('brand_id', {
                    setValueAs: (value) => value ? parseInt(value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Marka ID girin"
                />
              </div>

              {/* Kategori ID */}
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori ID
                </label>
                <input
                  type="text"
                  id="category_id"
                  {...register('category_id', { 
                    setValueAs: (value) => value ? parseFormattedNumber(value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kategori ID girin"
                  defaultValue={product && product.category_id ? formatPriceTR(product.category_id, 0) : ''}
                />
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ürün açıklamasını girin"
              />
            </div>

            {/* Fiyat Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Satış Fiyatı */}
              <div>
                <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Satış Fiyatı *
                </label>
                <input
                  type="text"
                  id="unit_price"
                  {...register('unit_price', { 
                    required: 'Satış fiyatı zorunludur',
                    setValueAs: (value) => parseFormattedNumber(value),
                    validate: (value) => value >= 0 || 'Fiyat 0\'dan küçük olamaz'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  defaultValue={product ? formatPriceTR(product.unit_price) : ''}
                />
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
                )}
              </div>

              {/* Alış Fiyatı */}
              <div>
                <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Alış Fiyatı *
                </label>
                <input
                  type="text"
                  id="cost_price"
                  {...register('cost_price', { 
                    required: 'Alış fiyatı zorunludur',
                    setValueAs: (value) => parseFormattedNumber(value),
                    validate: (value) => value >= 0 || 'Fiyat 0\'dan küçük olamaz'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  defaultValue={product ? formatPriceTR(product.cost_price) : ''}
                />
                {errors.cost_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.cost_price.message}</p>
                )}
              </div>

              {/* Stok Miktarı */}
              <div>
                <label htmlFor="current_stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı
                </label>
                <input
                  type="text"
                  id="current_stock"
                  {...register('current_stock', { 
                    setValueAs: (value) => parseFormattedNumber(value),
                    validate: (value) => value >= 0 || 'Stok 0\'dan küçük olamaz'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  defaultValue={product ? formatPriceTR(product.current_stock, 0) : ''}
                />
                {errors.current_stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_stock.message}</p>
                )}
              </div>
            </div>

            {/* Diğer Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tedarikçi ID */}
              <div>
                <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Tedarikçi ID
                </label>
                <input
                  type="text"
                  id="supplier_id"
                  {...register('supplier_id', { 
                    setValueAs: (value) => value ? parseFormattedNumber(value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tedarikçi ID girin"
                  defaultValue={product && product.supplier_id ? formatPriceTR(product.supplier_id, 0) : ''}
                />
              </div>

              {/* Barkod */}
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Barkod
                </label>
                <input
                  type="text"
                  id="barcode"
                  {...register('barcode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Barkod girin"
                />
              </div>

              {/* QR Kod */}
              <div>
                <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Kod
                </label>
                <input
                  type="text"
                  id="qr_code"
                  {...register('qr_code')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="QR kod girin"
                />
              </div>
            </div>

            {/* Aktiflik Durumu */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                defaultChecked={product?.is_active ?? true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Ürün aktif
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting || updateMutation.isPending}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {(isSubmitting || updateMutation.isPending) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {(isSubmitting || updateMutation.isPending) ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;