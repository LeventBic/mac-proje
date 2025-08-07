import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';
import { useProduct, useCategories, useProductTypes, useSuppliers } from '../../hooks/useProducts';
import ProductService from '../../services/productService';
import { toast } from 'react-hot-toast';

interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  category_id?: number;
  product_type_id?: number;
  unit_price?: number;
  cost_price?: number;
  currency_id?: number;
  unit_id?: number;
  current_stock?: number;
  reserved_stock?: number;
  ordered_stock?: number;
  supplier_id?: number;
  last_supplier_id?: number;
  supplier_product_code?: string;
  lead_time_days?: number;
  location_id?: number;
  barcode?: string;
  qr_code?: string;
  is_popular?: boolean;
  is_raw_material?: boolean;
  is_finished_product?: boolean;
  price_increase_percentage?: number;
  last_price_update?: string;
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for modal-like behavior
  const [activeTab, setActiveTab] = useState('basic');
  
  // Mock data - replace with actual API calls
  const currencies = [
    { id: 1, name: 'TRY', symbol: '₺' },
    { id: 2, name: 'USD', symbol: '$' },
    { id: 3, name: 'EUR', symbol: '€' }
  ];

  const units = [
    { id: 1, name: 'Adet', symbol: 'adet' },
    { id: 2, name: 'Kilogram', symbol: 'kg' },
    { id: 3, name: 'Litre', symbol: 'lt' },
    { id: 4, name: 'Metre', symbol: 'm' }
  ];

  const locations = [
    { id: 1, name: 'Ana Depo' },
    { id: 2, name: 'Üretim Alanı' },
    { id: 3, name: 'Sevkiyat Alanı' }
  ];
  
  // API hooks
  const { data: suppliers } = useSuppliers();
  const { data: categories } = useCategories();
  const { data: productTypes } = useProductTypes();
  
  const { data: product, isLoading, error } = useProduct(id!);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProductFormData>();
  
  // Reset form when product data is loaded
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        brand: product.brand || '',
        category_id: product.category_id || undefined,
        product_type_id: product.product_type_id || undefined,
        unit_price: product.unit_price || undefined,
        cost_price: product.cost_price || undefined,
        currency_id: product.currency_id || 1,
        unit_id: product.unit_id || 1,
        current_stock: product.current_stock || 0,
        reserved_stock: product.reserved_stock || 0,
        ordered_stock: product.ordered_stock || 0,
        supplier_id: product.supplier_id || undefined,
        last_supplier_id: product.last_supplier_id || undefined,
        supplier_product_code: product.supplier_product_code || '',
        lead_time_days: product.lead_time_days || undefined,
        location_id: product.location_id || 1,
        barcode: product.barcode || '',
        qr_code: product.qr_code || '',
        is_popular: product.is_popular || false,
        is_raw_material: product.is_raw_material || false,
        is_finished_product: product.is_finished_product || false,
        price_increase_percentage: product.price_increase_percentage || undefined,
        last_price_update: product.last_price_update || ''
      });
    }
  }, [product, reset]);
  
  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => ProductService.update(id!, data),
    onSuccess: () => {
      toast.success('Ürün başarıyla güncellendi!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      navigate('/products');
    },
    onError: (error: any) => {
      console.error('❌ Ürün güncelleme hatası:', error);
      
      // Backend'den gelen spesifik hata mesajlarını yakala
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.join('\n');
        toast.error(`Validation hatası:\n${errorMessages}`);
        console.log('📋 Validation hataları:', error.response.data.errors);
      } else if (error?.response?.data?.message) {
        toast.error(`Hata: ${error.response.data.message}`);
      } else {
        toast.error('Ürün güncellenirken beklenmeyen bir hata oluştu!');
      }
    }
  });
  
  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('📤 Form verisi (ham):', data);
      
      // Veri tipi dönüşümü ve filtreleme
      const processedData = {
        name: data.name,
        sku: data.sku,
        description: data.description,
        brand: data.brand,
        category_id: data.category_id,
        product_type_id: data.product_type_id,
        // Sayısal alanları parseFloat ile dönüştür
        unit_price: data.unit_price ? parseFloat(data.unit_price.toString()) : undefined,
        cost_price: data.cost_price ? parseFloat(data.cost_price.toString()) : undefined,
        currency_id: data.currency_id,
        unit_id: data.unit_id,
        current_stock: data.current_stock ? parseFloat(data.current_stock.toString()) : undefined,
        reserved_stock: data.reserved_stock ? parseFloat(data.reserved_stock.toString()) : undefined,
        ordered_stock: data.ordered_stock ? parseFloat(data.ordered_stock.toString()) : undefined,
        supplier_id: data.supplier_id,
        last_supplier_id: data.last_supplier_id,
        supplier_product_code: data.supplier_product_code,
        lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days.toString()) : undefined,
        location_id: data.location_id,
        barcode: data.barcode,
        qr_code: data.qr_code,
        is_popular: Boolean(data.is_popular),
        is_raw_material: Boolean(data.is_raw_material),
        is_finished_product: Boolean(data.is_finished_product),
        price_increase_percentage: data.price_increase_percentage ? parseFloat(data.price_increase_percentage.toString()) : undefined
      };
      
      // Undefined değerleri temizle
      Object.keys(processedData).forEach(key => {
        if (processedData[key as keyof typeof processedData] === undefined) {
          delete processedData[key as keyof typeof processedData];
        }
      });
      
      console.log('🚀 Backend\'e Gönderilen Veri:', JSON.stringify(processedData, null, 2));
      
      await updateMutation.mutateAsync(processedData);
    } catch (error) {
      console.error('❌ Submit error:', error);
    }
  };
  

  
  // Helper components
  const FormField: React.FC<{
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
  }> = ({ label, required, error, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
  
  const tabs = [
    { id: 'basic', label: 'Temel Bilgiler' },
    { id: 'pricing', label: 'Fiyatlandırma' },
    { id: 'inventory', label: 'Stok' },
    { id: 'supplier', label: 'Tedarikçi' },
    { id: 'settings', label: 'Ayarlar' }
  ];
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ürün bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Hata</h2>
          <p className="text-gray-600 mb-4">Ürün bilgileri yüklenirken bir hata oluştu.</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl max-h-[95vh] rounded-lg bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sm:p-6 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Ürün Düzenle
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {product?.name || 'Mevcut ürün bilgilerini güncelleyin'}
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
            title="Kapat"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex-shrink-0">
          <nav className="flex overflow-x-auto px-4 sm:px-6 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form id="product-edit-form" onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Ürün Adı"
                    required
                    error={errors.name?.message}
                  >
                    <input
                      type="text"
                      {...register('name' /* { required: 'Ürün adı zorunludur' } */)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ürün adını girin"
                    />
                  </FormField>

                  <FormField
                    label="SKU"
                    required
                    error={errors.sku?.message}
                  >
                    <input
                      type="text"
                      {...register('sku' /* { required: 'SKU zorunludur' } */)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ürün kodunu girin"
                    />
                  </FormField>

                  <FormField
                    label="Marka"
                    error={errors.brand?.message}
                  >
                    <input
                      type="text"
                      {...register('brand')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Marka adını girin"
                    />
                  </FormField>

                  <FormField
                    label="Kategori"
                    error={errors.category_id?.message}
                  >
                    <select
                      {...register('category_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Kategori seçin</option>
                      {categories?.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Ürün Tipi"
                    error={errors.product_type_id?.message}
                  >
                    <select
                      {...register('product_type_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Ürün tipi seçin</option>
                      {productTypes?.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField
                  label="Açıklama"
                  error={errors.description?.message}
                >
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ürün açıklamasını girin"
                  />
                </FormField>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Satış Fiyatı"
                    error={errors.unit_price?.message}
                  >
                    <input
                      type="number"
                      step="0.01"
                      {...register('unit_price', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </FormField>

                  <FormField
                    label="Alış Fiyatı"
                    error={errors.cost_price?.message}
                  >
                    <input
                      type="number"
                      step="0.01"
                      {...register('cost_price', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </FormField>

                  <FormField
                    label="Para Birimi"
                    error={errors.currency_id?.message}
                  >
                    <select
                      {...register('currency_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Para birimi seçin</option>
                      {currencies.map(currency => (
                        <option key={currency.id} value={currency.id}>
                          {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Birim"
                    error={errors.unit_id?.message}
                  >
                    <select
                      {...register('unit_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Birim seçin</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    label="Mevcut Stok"
                    error={errors.current_stock?.message}
                  >
                    <input
                      type="number"
                      {...register('current_stock', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </FormField>

                  <FormField
                    label="Rezerve Stok"
                    error={errors.reserved_stock?.message}
                  >
                    <input
                      type="number"
                      {...register('reserved_stock', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </FormField>

                  <FormField
                    label="Sipariş Edilen Stok"
                    error={errors.ordered_stock?.message}
                  >
                    <input
                      type="number"
                      {...register('ordered_stock', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Konum"
                  error={errors.location_id?.message}
                >
                  <select
                    {...register('location_id', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}

            {activeTab === 'supplier' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Ana Tedarikçi"
                    error={errors.supplier_id?.message}
                  >
                    <select
                      {...register('supplier_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tedarikçi seçin</option>
                      {suppliers?.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Son Tedarikçi"
                    error={errors.last_supplier_id?.message}
                  >
                    <select
                      {...register('last_supplier_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tedarikçi seçin</option>
                      {suppliers?.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Tedarikçi Ürün Kodu"
                    error={errors.supplier_product_code?.message}
                  >
                    <input
                      type="text"
                      {...register('supplier_product_code')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tedarikçi ürün kodunu girin"
                    />
                  </FormField>

                  <FormField
                    label="Temin Süresi (Gün)"
                    error={errors.lead_time_days?.message}
                  >
                    <input
                      type="number"
                      {...register('lead_time_days', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Barkod"
                    error={errors.barcode?.message}
                  >
                    <input
                      type="text"
                      {...register('barcode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Barkod numarasını girin"
                    />
                  </FormField>

                  <FormField
                    label="QR Kod"
                    error={errors.qr_code?.message}
                  >
                    <input
                      type="text"
                      {...register('qr_code')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="QR kod bilgisini girin"
                    />
                  </FormField>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_popular"
                      {...register('is_popular')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_popular" className="ml-2 block text-sm text-gray-700">
                      Popüler ürün
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_raw_material"
                      {...register('is_raw_material')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_raw_material" className="ml-2 block text-sm text-gray-700">
                      Hammadde
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_finished_product"
                      {...register('is_finished_product')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_finished_product" className="ml-2 block text-sm text-gray-700">
                      Bitmiş ürün
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Form Actions */}
        <div className="border-t p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting || updateMutation.isPending}
            >
              İptal
            </button>
            <button
              type="submit"
              form="product-edit-form"
              disabled={isSubmitting || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(isSubmitting || updateMutation.isPending) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {(isSubmitting || updateMutation.isPending) ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;