import React, { useState, useEffect } from 'react';
import { 
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiShoppingCart,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiSettings,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiBarChart
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// API Service
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class StockReorderService {
  static async getNeeded(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/stock-reorder/needed?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Yeniden sipariş verisi alınamadı');
    return response.json();
  }

  static async createOrders(items) {
    const response = await fetch(`${API_BASE}/stock-reorder/create-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ items })
    });
    if (!response.ok) throw new Error('Sipariş oluşturulamadı');
    return response.json();
  }

  static async updateSettings(id, settings) {
    const response = await fetch(`${API_BASE}/stock-reorder/settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Ayarlar güncellenemedi');
    return response.json();
  }

  static async getHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/stock-reorder/history?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Sipariş geçmişi alınamadı');
    return response.json();
  }

  static async getSuppliers() {
    const response = await fetch(`${API_BASE}/stock-reorder/suppliers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Tedarikçi listesi alınamadı');
    return response.json();
  }

  static async getCategories() {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Kategori listesi alınamadı');
    return response.json();
  }
}

// Settings Modal
const SettingsModal = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    reorder_point: '',
    reorder_quantity: '',
    lead_time_days: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        reorder_point: item.reorder_point || '',
        reorder_quantity: item.reorder_quantity || '',
        lead_time_days: item.lead_time_days || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await StockReorderService.updateSettings(item.id, formData);
      toast.success('Yeniden sipariş ayarları güncellendi');
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Sipariş Ayarları
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün: {item?.name}
                </label>
                <p className="text-sm text-gray-500">SKU: {item?.sku}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeniden Sipariş Noktası
                </label>
                <input
                  type="number"
                  name="reorder_point"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sipariş Miktarı
                </label>
                <input
                  type="number"
                  name="reorder_quantity"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorder_quantity: e.target.value }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tedarik Süresi (Gün)
                </label>
                <input
                  type="number"
                  name="lead_time_days"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
const StockReorderPage = () => {
  const [reorderItems, setReorderItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('needed'); // needed, history

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        supplier_id: selectedSupplier,
        category_id: selectedCategory
      };

      const [reorderResponse, suppliersResponse, categoriesResponse] = await Promise.all([
        StockReorderService.getNeeded(params),
        StockReorderService.getSuppliers(),
        StockReorderService.getCategories()
      ]);

      setReorderItems(reorderResponse.data.items);
      setTotalPages(reorderResponse.data.pagination.totalPages);
      setStats(reorderResponse.data.stats);
      setSuppliers(suppliersResponse.data);
      setCategories(categoriesResponse.data);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'needed') {
      fetchData();
    }
  }, [currentPage, searchTerm, selectedSupplier, selectedCategory, activeTab]);

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === reorderItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(reorderItems.map(item => item.id));
    }
  };

  const handleCreateOrders = async () => {
    if (selectedItems.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    try {
      const orderItems = reorderItems
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          product_id: item.id,
          quantity: item.suggested_quantity,
          supplier_id: item.supplier_id
        }));

      const response = await StockReorderService.createOrders(orderItems);
      toast.success(response.message);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'urgent':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical':
        return 'Kritik';
      case 'urgent':
        return 'Acil';
      default:
        return 'Normal';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <FiAlertTriangle className="w-4 h-4" />;
      case 'urgent':
        return <FiClock className="w-4 h-4" />;
      default:
        return <FiCheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiRefreshCw className="mr-3 text-red-600" />
            Stok Yeniden Sipariş
          </h1>
          <p className="text-gray-600 mt-1">Yeniden sipariş edilmesi gereken ürünleri yönetin</p>
        </div>

        <div className="flex space-x-3">
          {selectedItems.length > 0 && (
            <button
              onClick={handleCreateOrders}
              className="btn-primary flex items-center"
            >
              <FiShoppingCart className="mr-2" />
              Toplu Sipariş ({selectedItems.length})
            </button>
          )}
          
          <button className="btn-secondary flex items-center">
            <FiDownload className="mr-2" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_items || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kritik</p>
              <p className="text-2xl font-semibold text-red-600">{stats.critical_items || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiClock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acil</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.urgent_items || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tahmini Maliyet</p>
              <p className="text-2xl font-semibold text-green-600">
                ₺{(stats.total_estimated_cost || 0).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('needed')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'needed'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiRefreshCw className="inline mr-2" />
              Sipariş Gerekli
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiBarChart className="inline mr-2" />
              Sipariş Geçmişi
            </button>
          </nav>
        </div>

        {activeTab === 'needed' && (
          <>
            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Tüm Tedarikçiler</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedSupplier('');
                    setCurrentPage(1);
                  }}
                  className="btn-secondary flex items-center justify-center"
                >
                  <FiFilter className="mr-2" />
                  Temizle
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-gray-500">Yükleniyor...</div>
                </div>
              ) : reorderItems.length === 0 ? (
                <div className="text-center py-12">
                  <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Yeniden sipariş gereken ürün yok</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tüm ürünlerin stok seviyesi yeterli.
                  </p>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === reorderItems.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok Durumu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Öncelik
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tedarikçi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tahmini Maliyet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teslim Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reorderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.sku} • {item.category_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Mevcut: {item.current_stock} {item.unit}
                            </div>
                            <div className="text-sm text-gray-500">
                              Nokta: {item.reorder_point} • Önerilen: {item.suggested_quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {getPriorityIcon(item.priority)}
                              <span className="ml-1">{getPriorityText(item.priority)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.supplier_name}</div>
                            <div className="text-sm text-gray-500">{item.supplier_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₺{(item.estimated_cost || 0).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <FiCalendar className="w-3 h-3 mr-1" />
                              {item.expected_delivery ? new Date(item.expected_delivery).toLocaleDateString('tr-TR') : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowSettings(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ayarlar"
                            >
                              <FiSettings />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Önceki
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sonraki
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Sayfa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Önceki
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Sonraki
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="p-6 text-center text-gray-500">
            <FiBarChart className="mx-auto h-12 w-12 mb-4" />
            <p>Sipariş geçmişi özelliği geliştiriliyor...</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSave={fetchData}
      />
    </div>
  );
};

export default StockReorderPage; 