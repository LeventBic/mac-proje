import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { useStockMovements } from '../../hooks/useStock';
import { FiArrowLeft, FiPackage, FiTrendingUp, /* FiList, */ FiAlertTriangle } from 'react-icons/fi';
import { formatCurrency, formatQuantity } from '../../utils/formatters';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  // React Query hooks
  const { data: productData, isLoading: productLoading, error: productError } = useProduct(id);
  const { data: movementsData, isLoading: movementsLoading } = useStockMovements({ product_id: id });

  // Extract data
  const product = productData?.data;
  const stockMovements = movementsData?.data || [];
  const loading = productLoading || movementsLoading;

  const getStockStatusBadge = (status) => {
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800',
      'overstock': 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      'in_stock': 'Stokta',
      'low_stock': 'Düşük Stok',
      'out_of_stock': 'Stok Yok',
      'overstock': 'Fazla Stok'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || 'Bilinmiyor'}
      </span>
    );
  };



  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (productError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">Ürün detayları yüklenirken hata oluştu: {productError.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Belirtilen ID'ye sahip ürün mevcut değil.</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ürünlere Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/products')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600">SKU: {product.sku}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Product Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Mevcut Stok</h3>
              <p className="text-2xl font-bold text-gray-900">{formatQuantity(product.current_stock || 0)}</p>
              <p className="text-sm text-gray-600">{product.unit || 'Adet'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Birim Fiyat</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.unit_price)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Toplam Değer</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency((product.current_stock || 0) * (product.unit_price || 0))}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Durum</h3>
              {getStockStatusBadge(product.stock_status)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiPackage className="w-4 h-4" />
                  <span>Ürün Bilgileri</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('movements')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'movements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiTrendingUp className="w-4 h-4" />
                  <span>Stok Hareketleri</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Ürün Adı</label>
                      <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">SKU</label>
                      <p className="mt-1 text-sm text-gray-900">{product.sku}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Kategori</label>
                      <p className="mt-1 text-sm text-gray-900">{product.category_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Ürün Tipi</label>
                      <p className="mt-1 text-sm text-gray-900">{product.product_type_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Birim</label>
                      <p className="mt-1 text-sm text-gray-900">{product.unit || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Açıklama</label>
                      <p className="mt-1 text-sm text-gray-900">{product.description || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Bilgileri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Mevcut Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{formatQuantity(product.current_stock || 0)} {product.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Minimum Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{formatQuantity(product.min_stock || 0)} {product.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Maksimum Stok</label>
                      <p className="mt-1 text-sm text-gray-900">{formatQuantity(product.max_stock || 0)} {product.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Yeniden Sipariş Noktası</label>
                      <p className="mt-1 text-sm text-gray-900">{formatQuantity(product.reorder_point || 0)} {product.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Birim Fiyat</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(product.unit_price)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Son Güncelleme</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(product.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'movements' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Son Stok Hareketleri</h3>
                {stockMovements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hareket Tipi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Miktar
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Açıklama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Referans
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stockMovements.map((movement) => (
                          <tr key={movement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(movement.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                movement.movement_type === 'in' ? 'bg-green-100 text-green-800' :
                                movement.movement_type === 'out' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {movement.movement_type === 'in' ? 'Giriş' :
                                 movement.movement_type === 'out' ? 'Çıkış' : 'Transfer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={movement.movement_type === 'out' ? 'text-red-600' : 'text-green-600'}>
                                {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity} {product.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {movement.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {movement.reference_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiTrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Stok hareketi yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Bu ürün için henüz stok hareketi kaydedilmemiş.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
