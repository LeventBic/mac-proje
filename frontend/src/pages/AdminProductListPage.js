import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import { FaPlus, FaEdit, FaFilter } from 'react-icons/fa';

// API fonksiyonları
const fetchProducts = async (status = '') => {
  const params = status ? { status } : {};
  const response = await axios.get('/api/products', { params });
  return response.data;
};

const deleteProduct = async (id) => {
  await axios.delete(`/api/products/${id}`);
};

const AdminProductListPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState(''); // '', 'all', 'inactive'

  // Ürünleri getir - status filtresine göre
  const {
    data: products = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['products', statusFilter], // Status değiştiğinde yeniden fetch et
    queryFn: () => fetchProducts(statusFilter)
  });

  // Silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Başarılı silme sonrası cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['products'] });
      console.log('Ürün başarıyla silindi!');
    },
    onError: (error) => {
      console.error('Ürün silinirken hata oluştu:', error);
      alert('Ürün silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // Silme işlemini başlat
  const handleDelete = (productId) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(productId);
    }
  };

  // Filtre değiştirme
  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  // Durum badge'i
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Pasif
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
          <p>Ürünler yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sayfa başlığı ve kontroller */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin - Ürün Yönetimi</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
          <FaPlus className="mr-2" />
          Yeni Ürün
        </button>
      </div>

      {/* Filtre butonları */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Durum Filtresi:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => handleFilterChange('inactive')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pasif
            </button>
          </div>
        </div>
      </div>

      {/* Ürün tablosu */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maliyet Fiyatı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liste Fiyatı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturma Tarihi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {statusFilter === 'inactive' 
                    ? 'Pasif ürün bulunmuyor.' 
                    : statusFilter === 'all'
                    ? 'Hiç ürün bulunmuyor.'
                    : 'Aktif ürün bulunmuyor.'
                  }
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{product.cost_price?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{product.list_price?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(product.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* Düzenle butonu */}
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                        <FaEdit className="mr-1" size={12} />
                        Düzenle
                      </button>
                      
                      {/* DeleteButton bileşeni */}
                      <DeleteButton
                        onClick={() => handleDelete(product.id)}
                        isLoading={deleteMutation.isPending}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toplam ürün sayısı ve filtre bilgisi */}
      <div className="mt-4 text-sm text-gray-600">
        {statusFilter === 'inactive' && (
          <span>Toplam {products.length} pasif ürün listeleniyor.</span>
        )}
        {statusFilter === 'all' && (
          <span>Toplam {products.length} ürün (aktif + pasif) listeleniyor.</span>
        )}
        {statusFilter === '' && (
          <span>Toplam {products.length} aktif ürün listeleniyor.</span>
        )}
      </div>
    </div>
  );
};

export default AdminProductListPage;