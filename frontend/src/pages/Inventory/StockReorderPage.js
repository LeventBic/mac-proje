import React, { useState } from 'react';
import { 
  FiPlus,
  FiSearch,
  FiShoppingCart,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiSettings,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { 
  useStockReorderNeeded, 
  useStockReorderHistory, 
  useCreateStockReorderOrders, 
  useUpdateStockReorderSettings
} from '../../hooks/useStock';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useCategories } from '../../hooks/useProducts';

const SettingsModal = ({ isOpen, onClose, item, onSave }) => {
  const [settings, setSettings] = useState({
    min_stock: item?.min_stock || 0,
    max_stock: item?.max_stock || 0,
    reorder_point: item?.reorder_point || 0,
    reorder_quantity: item?.reorder_quantity || 0,
    lead_time_days: item?.lead_time_days || 0,
    safety_stock: item?.safety_stock || 0
  });

  const updateSettingsMutation = useUpdateStockReorderSettings();

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        id: item.id,
        settings
      });
      onSave();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Yeniden Sipariş Ayarları</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <strong>{item?.product_name}</strong>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stok
              </label>
              <input
                type="number"
                value={settings.min_stock}
                onChange={(e) => setSettings(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum Stok
              </label>
              <input
                type="number"
                value={settings.max_stock}
                onChange={(e) => setSettings(prev => ({ ...prev, max_stock: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yeniden Sipariş Noktası
              </label>
              <input
                type="number"
                value={settings.reorder_point}
                onChange={(e) => setSettings(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sipariş Miktarı
              </label>
              <input
                type="number"
                value={settings.reorder_quantity}
                onChange={(e) => setSettings(prev => ({ ...prev, reorder_quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tedarik Süresi (Gün)
              </label>
              <input
                type="number"
                value={settings.lead_time_days}
                onChange={(e) => setSettings(prev => ({ ...prev, lead_time_days: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Güvenlik Stoku
              </label>
              <input
                type="number"
                value={settings.safety_stock}
                onChange={(e) => setSettings(prev => ({ ...prev, safety_stock: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateSettingsMutation.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StockReorderPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('needed'); // needed, history

  // React Query hooks
  const { data: suppliersData } = useSuppliers();
  const { data: categoriesData } = useCategories();
  
  const reorderParams = {
    page: currentPage,
    limit: 10,
    search: searchTerm,
    supplier_id: selectedSupplier,
    category_id: selectedCategory
  };

  const { 
    data: reorderData, 
    isLoading: reorderLoading, 
    refetch: refetchReorder 
  } = useStockReorderNeeded(reorderParams, {
    enabled: activeTab === 'needed'
  });

  const { 
    data: historyData, 
    isLoading: historyLoading 
  } = useStockReorderHistory(reorderParams, {
    enabled: activeTab === 'history'
  });

  const createOrdersMutation = useCreateStockReorderOrders();

  // Extract data
  const suppliers = suppliersData?.data || [];
  const categories = categoriesData?.data || [];
  const reorderItems = reorderData?.data?.items || [];
  const stats = reorderData?.data?.stats || {};
  const totalPages = reorderData?.data?.pagination?.totalPages || 1;
  const historyItems = historyData?.data?.items || [];
  const loading = reorderLoading || historyLoading;

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

      await createOrdersMutation.mutateAsync(orderItems);
      setSelectedItems([]);
      refetchReorder();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOpenSettings = (item) => {
    setSelectedItem(item);
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setSelectedItem(null);
  };

  const handleSettingsSaved = () => {
    refetchReorder();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stok Yeniden Siparişi</h1>
          <p className="text-gray-600">Stok seviyelerini izleyin ve otomatik sipariş oluşturun</p>
        </div>

        {/* Stats Cards */}
        {activeTab === 'needed' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kritik Seviye</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical || 0}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <FiAlertTriangle className="text-red-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Acil Seviye</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.urgent || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FiClock className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Normal Seviye</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.normal || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiCheckCircle className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiDollarSign className="text-green-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('needed')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'needed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiShoppingCart className="w-4 h-4" />
                  <span>Sipariş Gerekli</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4" />
                  <span>Sipariş Geçmişi</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Tedarikçiler</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {activeTab === 'needed' && selectedItems.length > 0 && (
                <button
                  onClick={handleCreateOrders}
                  disabled={createOrdersMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>
                    {createOrdersMutation.isLoading 
                      ? 'Oluşturuluyor...' 
                      : `Sipariş Oluştur (${selectedItems.length})`
                    }
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'needed' ? (
              <div>
                {reorderItems.length > 0 ? (
                  <div>
                    {/* Select All */}
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === reorderItems.length && reorderItems.length > 0}
                        onChange={handleSelectAll}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Tümünü Seç</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                      {reorderItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="mr-2"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getPriorityColor(item.priority)}`}>
                                    {getPriorityIcon(item.priority)}
                                    <span>{getPriorityText(item.priority)}</span>
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Mevcut Stok:</span>
                                    <span className="ml-1">{item.current_stock}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Min. Stok:</span>
                                    <span className="ml-1">{item.min_stock}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Önerilen Miktar:</span>
                                    <span className="ml-1 font-semibold text-blue-600">{item.suggested_quantity}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Tedarikçi:</span>
                                    <span className="ml-1">{item.supplier_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(item.estimated_cost)}
                              </span>
                              <button
                                onClick={() => handleOpenSettings(item)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="Ayarları Düzenle"
                              >
                                <FiSettings className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş gerekli ürün yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Tüm ürünler yeterli stok seviyesinde.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {historyItems.length > 0 ? (
                  <div className="space-y-4">
                    {historyItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status === 'completed' ? 'Tamamlandı' :
                                 item.status === 'pending' ? 'Beklemede' : 'İptal Edildi'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Sipariş Miktarı:</span>
                                <span className="ml-1">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="font-medium">Sipariş Tarihi:</span>
                                <span className="ml-1">{formatDate(item.order_date)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Tedarikçi:</span>
                                <span className="ml-1">{item.supplier_name}</span>
                              </div>
                              <div>
                                <span className="font-medium">Tutar:</span>
                                <span className="ml-1">{formatCurrency(item.total_cost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş geçmişi yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Henüz hiç sipariş oluşturulmamış.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                <span className="text-sm text-gray-700">
                  Sayfa {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={handleCloseSettings}
          item={selectedItem}
          onSave={handleSettingsSaved}
        />
      </div>
    </div>
  );
};

export default StockReorderPage;