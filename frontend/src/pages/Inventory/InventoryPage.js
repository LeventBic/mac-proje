import React, { useEffect, useState } from 'react';
import { apiCall } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const InventoryPage = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [valuation, setValuation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [inventoryResult, alertsResult, analysisResult, valuationResult] = await Promise.all([
        apiCall('/api/inventory'),
        apiCall('/api/inventory/alerts'),
        apiCall('/api/inventory/analysis'),
        apiCall('/api/inventory/valuation')
      ]);

      const summaryData = inventoryResult.data;
      const alertsData = alertsResult.data;
      const analysisData = analysisResult.data;
      const valuationData = valuationResult.data;

      if (summaryData.status === 'success') {
        setSummary(summaryData.data);
        setAlerts(alertsData.data || []);
        setAnalysis(analysisData.data || null);
        setValuation(valuationData.data || []);
      } else {
        setError('Veri alınamadı');
      }
      setLoading(false);
    } catch (err) {
      setError('Veri alınamadı');
      setLoading(false);
    }
  };

  const getAlertBadge = (level) => {
    const colors = {
      'critical': 'bg-red-100 text-red-800',
      'urgent': 'bg-orange-100 text-orange-800',
      'warning': 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      'critical': 'Kritik',
      'urgent': 'Acil',
      'warning': 'Uyarı'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-800'}`}>
        {labels[level] || level}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Stok Yönetimi</h1>
        <p className="text-secondary-600">Stok durumunu takip edin ve yönetin</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Genel Bakış' },
            { key: 'alerts', label: 'Uyarılar' },
            { key: 'analysis', label: 'Analiz' },
            { key: 'valuation', label: 'Değerlendirme' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="card p-6 text-center">
                <h3 className="font-semibold mb-2">Toplam Ürün</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {summary.summary.total_products}
                </div>
                <div className="text-sm text-gray-600">Aktif ürün sayısı</div>
              </div>

              <div className="card p-6 text-center">
                <h3 className="font-semibold mb-2">Stok Değeri</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ₺{(summary.summary.stock_value.total_value || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Toplam piyasa değeri</div>
              </div>

              <div className="card p-6 text-center">
                <h3 className="font-semibold mb-2">Düşük Stok</h3>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {summary.summary.stock_status.low_stock}
                </div>
                <div className="text-sm text-gray-600">Uyarı seviyesinde</div>
              </div>

              <div className="card p-6 text-center">
                <h3 className="font-semibold mb-2">Stok Yok</h3>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {summary.summary.stock_status.out_of_stock}
                </div>
                <div className="text-sm text-gray-600">Tükenen ürünler</div>
              </div>
            </div>

            {/* Stock Status Distribution */}
            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4">Stok Durumu Dağılımı</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      <span>Stokta</span>
                    </div>
                    <span className="font-medium">{summary.summary.stock_status.in_stock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      <span>Düşük Stok</span>
                    </div>
                    <span className="font-medium">{summary.summary.stock_status.low_stock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                      <span>Stok Yok</span>
                    </div>
                    <span className="font-medium">{summary.summary.stock_status.out_of_stock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span>Fazla Stok</span>
                    </div>
                    <span className="font-medium">{summary.summary.stock_status.overstock}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold mb-4">Son 30 Gün Hareketler</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Toplam Hareket</span>
                    <span className="font-medium">{summary.summary.recent_movements.total_movements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">Giriş</span>
                    <span className="font-medium text-green-600">{summary.summary.recent_movements.inbound}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600">Çıkış</span>
                    <span className="font-medium text-red-600">{summary.summary.recent_movements.outbound}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Products */}
            {summary.low_stock_products.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4">Düşük Stoklu Ürünler</h3>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-sm">
                    <thead>
                      <tr>
                        <th>Ürün</th>
                        <th>SKU</th>
                        <th>Mevcut Stok</th>
                        <th>Min. Seviye</th>
                        <th>Eksik</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.low_stock_products.map(product => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td>{product.name}</td>
                          <td className="font-mono">{product.sku}</td>
                          <td className="text-red-600">{product.current_stock}</td>
                          <td>{product.min_stock_level}</td>
                          <td className="text-red-600 font-medium">{product.shortage}</td>
                          <td>
                            <button 
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="btn btn-xs btn-outline"
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
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Stok Uyarıları ({alerts.length})</h3>
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr>
                      <th>Seviye</th>
                      <th>Ürün</th>
                      <th>SKU</th>
                      <th>Kategori</th>
                      <th>Mevcut</th>
                      <th>Min. Seviye</th>
                      <th>Eksik</th>
                      <th>Tedarikçi</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id} className="border-b hover:bg-gray-50">
                        <td>{getAlertBadge(alert.alert_level)}</td>
                        <td>{alert.name}</td>
                        <td className="font-mono">{alert.sku}</td>
                        <td>{alert.category_name || '-'}</td>
                        <td className="text-red-600">{alert.current_stock} {alert.unit}</td>
                        <td>{alert.min_stock_level}</td>
                        <td className="text-red-600 font-medium">{alert.shortage}</td>
                        <td>{alert.supplier_name || '-'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => navigate(`/products/${alert.id}`)}
                              className="btn btn-xs btn-outline"
                            >
                              Detay
                            </button>
                            <button 
                              onClick={() => navigate(`/stock-reorder?product_id=${alert.id}`)}
                              className="btn btn-xs btn-primary"
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
              <div className="text-center py-8 text-gray-500">
                Şu anda stok uyarısı bulunmuyor
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && analysis && (
          <div className="space-y-6">
            {/* Category Analysis */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Kategori Bazında Stok Analizi</h3>
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Ürün Sayısı</th>
                      <th>Toplam Miktar</th>
                      <th>Toplam Değer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.category_analysis.map((cat, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td>{cat.category_name || 'Kategori Yok'}</td>
                        <td>{cat.product_count}</td>
                        <td>{cat.total_quantity}</td>
                        <td>₺{(cat.total_value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Moving Products */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">En Çok Hareket Gören Ürünler</h3>
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>SKU</th>
                      <th>Hareket Sayısı</th>
                      <th>Toplam Giriş</th>
                      <th>Toplam Çıkış</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.top_moving_products.map((product, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td>{product.name}</td>
                        <td className="font-mono">{product.sku}</td>
                        <td>{product.movement_count}</td>
                        <td className="text-green-600">{product.total_in}</td>
                        <td className="text-red-600">{product.total_out}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Stok Değerlendirme Raporu</h3>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Ürün Sayısı</th>
                    <th>Toplam Miktar</th>
                    <th>Maliyet Değeri</th>
                    <th>Piyasa Değeri</th>
                    <th>Potansiyel Kar</th>
                  </tr>
                </thead>
                <tbody>
                  {valuation.map((item, index) => (
                    <tr key={index} className={`border-b hover:bg-gray-50 ${item.category_name === 'TOPLAM' ? 'font-bold bg-gray-100' : ''}`}>
                      <td>{item.category_name}</td>
                      <td>{item.product_count}</td>
                      <td>{item.total_quantity}</td>
                      <td>₺{(item.cost_value || 0).toLocaleString()}</td>
                      <td>₺{(item.market_value || 0).toLocaleString()}</td>
                      <td className="text-green-600">₺{(item.potential_profit || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
