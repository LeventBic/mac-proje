import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryAnalysis, useInventoryAlerts, useInventoryValuation } from '../../hooks/useStock';
import { FiPackage, FiAlertTriangle, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import TotalProductsWidget from '../../components/TotalProductsWidget';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // React Query hooks
  const { data: analysisData, isLoading: analysisLoading, error: analysisError } = useInventoryAnalysis();
  const { data: alertsData, isLoading: alertsLoading } = useInventoryAlerts();
  const { data: valuationData, isLoading: valuationLoading } = useInventoryValuation();

  // Extract data
  const summary = analysisData?.data;
  const alerts = alertsData?.data || [];
  const valuation = valuationData?.data || [];
  const loading = analysisLoading || alertsLoading || valuationLoading;

  const getAlertBadge = (level) => {
    const badges = {
      critical: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Kritik
        </span>
      ),
      urgent: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Acil
        </span>
      ),
      warning: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Uyarı
        </span>
      )
    };
    return badges[level] || badges.warning;
  };



  if (analysisError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">Stok verileri yüklenirken hata oluştu: {analysisError.message}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Stok Yönetimi</h1>
          <p className="text-gray-600">Stok durumunu takip edin ve yönetin</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiPackage className="w-4 h-4" />
                  <span>Genel Bakış</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span>Uyarılar ({alerts.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiBarChart2 className="w-4 h-4" />
                  <span>Analiz</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('valuation')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'valuation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="w-4 h-4" />
                  <span>Değerlendirme</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && summary && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <TotalProductsWidget />

                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stok Değeri</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(summary.summary?.stock_value?.total_value || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Toplam piyasa değeri</div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Düşük Stok</h3>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {formatNumber(summary.summary?.stock_status?.low_stock || 0, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Uyarı seviyesinde</div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stok Yok</h3>
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {formatNumber(summary.summary?.stock_status?.out_of_stock || 0, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tükenen ürünler</div>
                  </div>
                </div>

                {/* Stock Status Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Durumu Dağılımı</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                          <span>Stokta</span>
                        </div>
                        <span className="font-medium">{formatNumber(summary.summary?.stock_status?.in_stock || 0, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                          <span>Düşük Stok</span>
                        </div>
                        <span className="font-medium">{formatNumber(summary.summary?.stock_status?.low_stock || 0, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                          <span>Stok Yok</span>
                        </div>
                        <span className="font-medium">{formatNumber(summary.summary?.stock_status?.out_of_stock || 0, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                          <span>Fazla Stok</span>
                        </div>
                        <span className="font-medium">{summary.summary?.stock_status?.overstock || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Son 30 Gün Hareketler</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Toplam Hareket</span>
                        <span className="font-medium">{summary.summary?.recent_movements?.total_movements || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Giriş</span>
                        <span className="font-medium text-green-600">{formatNumber(summary.summary?.recent_movements?.inbound || 0, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600">Çıkış</span>
                        <span className="font-medium text-red-600">{formatNumber(summary.summary?.recent_movements?.outbound || 0, 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Low Stock Products */}
                {summary.low_stock_products && summary.low_stock_products.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Düşük Stoklu Ürünler</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mevcut Stok</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Seviye</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eksik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {summary.low_stock_products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{product.sku}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatNumber(product.current_stock, 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(product.min_stock_level, 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatNumber(product.shortage, 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button 
                                  onClick={() => navigate(`/products/${product.id}`)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                                >
                                  Detay
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Uyarıları ({alerts.length})</h3>
                {alerts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seviye</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mevcut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Seviye</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eksik</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tedarikçi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alerts.map(alert => (
                          <tr key={alert.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{getAlertBadge(alert.alert_level)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{alert.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.category_name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatNumber(alert.current_stock, 2)} {alert.unit}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(alert.min_stock_level, 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatNumber(alert.shortage, 2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.supplier_name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => navigate(`/products/${alert.id}`)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                                >
                                  Detay
                                </button>
                                <button 
                                  onClick={() => navigate(`/stock-reorder?product_id=${alert.id}`)}
                                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                >
                                  Sipariş
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Stok uyarısı yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Şu anda stok uyarısı bulunmuyor</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && summary && (
              <div className="space-y-6">
                {/* Category Analysis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Kategori Bazında Stok Analizi</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Sayısı</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Miktar</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Değer</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.category_analysis?.map((cat, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.category_name || 'Kategori Yok'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(cat.product_count, 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(cat.total_quantity, 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(cat.total_value || 0)}</td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Moving Products */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">En Çok Hareket Gören Ürünler</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hareket Sayısı</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Giriş</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Çıkış</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.top_moving_products?.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{product.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(product.movement_count, 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatNumber(product.total_in, 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatNumber(product.total_out, 0)}</td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'valuation' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Değerlendirme Raporu</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Sayısı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Miktar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maliyet Değeri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piyasa Değeri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potansiyel Kar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {valuation?.map((item, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${
                          item.category_name === 'TOPLAM' ? 'font-bold bg-gray-100' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.product_count, 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.total_quantity, 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cost_value || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.market_value || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(item.potential_profit || 0)}</td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
