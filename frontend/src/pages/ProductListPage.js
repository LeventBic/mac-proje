import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import EditButton from '../components/EditButton.tsx';
import { FaPlus } from 'react-icons/fa';

// API fonksiyonları
const fetchProducts = async () => {
  const response = await axios.get('/api/products');
  return response.data;
};

const deleteProduct = async (id) => {
  await axios.delete(`/api/products/${id}`);
};

const ProductListPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Ürünleri getir
  const {
    data: products = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  // Silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Başarılı silme sonrası cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Başarı mesajı gösterilebilir
      console.log('Ürün başarıyla silindi!');
    },
    onError: (error) => {
      // Hata durumunda kullanıcıya bilgi ver
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

  // Düzenleme sayfasına yönlendirme
  const handleEdit = (productId) => {
    navigate(`/products/edit/${productId}`);
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
      {/* Sayfa başlığı ve yeni ürün butonu */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
          <FaPlus className="mr-2" />
          Yeni Ürün
        </button>
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
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Henüz ürün bulunmuyor.
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{product.cost_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{product.list_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(product.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* Tekrar kullanılabilir EditButton bileşeni */}
                      <EditButton
                        onClick={() => handleEdit(product.id)}
                        size="sm"
                        title="Ürünü düzenle"
                      />
                      
                      {/* Tekrar kullanılabilir DeleteButton bileşeni */}
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

      {/* Toplam ürün sayısı */}
      <div className="mt-4 text-sm text-gray-600">
        Toplam {products.length} ürün listeleniyor.
      </div>
    </div>
  );
};

export default ProductListPage;