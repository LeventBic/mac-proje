import React, { useState } from 'react';
import { 
  FiSettings,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  // FiSearch,
  // FiFilter,
  // FiDownload,
  FiEye,
  FiBarChart2,
  FiPackage,
  FiUser,
  FiCalendar,
  // FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
// import { toast } from 'react-hot-toast';
import { useStockAdjustments, useStockAdjustmentStats, useCreateStockAdjustment } from '../../hooks/useStock';

// Create Adjustment Modal Component
const CreateAdjustmentModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    adjustment_type: 'increase',
    quantity: '',
    reason: '',
    notes: ''
  });
  
  const createAdjustmentMutation = useCreateStockAdjustment();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdjustmentMutation.mutateAsync(formData);
      onClose();
      setFormData({
        product_id: '',
        adjustment_type: 'increase',
        quantity: '',
        reason: '',
        notes: ''
      });
      if (onSave) onSave();
    } catch (error) {
      // console.error('Error creating adjustment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Yeni Stok Düzeltmesi</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Düzeltme Tipi
            </label>
            <select
              value={formData.adjustment_type}
              onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="increase">Artış</option>
              <option value="decrease">Azalış</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miktar
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sebep
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createAdjustmentMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createAdjustmentMutation.isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const StockAdjustmentsPage = () => {
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // React Query hooks
  const { data: adjustmentsData, isLoading: adjustmentsLoading, error: adjustmentsError } = useStockAdjustments({
    type: adjustmentTypeFilter,
    page: currentPage,
  });
  
  const { data: statsData, isLoading: statsLoading } = useStockAdjustmentStats();
  
  // Extract data from API responses
  const adjustments = adjustmentsData?.data?.adjustments || adjustmentsData?.data || [];
  const stats = statsData?.data || {};
  const totalPages = adjustmentsData?.data?.pagination?.totalPages || 1;
  const loading = adjustmentsLoading || statsLoading;

  const getAdjustmentTypeIcon = (type) => {
    switch (type) {
      case 'increase':
        return <FiTrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <FiTrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <FiSettings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAdjustmentTypeText = (type) => {
    switch (type) {
      case 'increase':
        return 'Artış';
      case 'decrease':
        return 'Azalış';
      default:
        return 'Bilinmiyor';
    }
  };

  const getAdjustmentTypeBadge = (type) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (type) {
      case 'increase':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'decrease':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (adjustmentsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Stok düzeltmeleri yüklenirken hata oluştu: {adjustmentsError.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Düzeltmeleri</h1>
          <p className="text-gray-600">Stok seviyelerini düzeltin ve takip edin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus /> Yeni Düzeltme
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Düzeltme</p>
              <p className="text-2xl font-semibold text-blue-600">
                {stats.summary?.total_adjustments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Artış</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.summary?.increase_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiTrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Azalış</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.summary?.decrease_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Değişim</p>
              <p className="text-2xl font-semibold text-purple-600">
                {((stats.summary?.total_increased || 0) - (stats.summary?.total_decreased || 0)).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Düzeltme Tipi
            </label>
            <select
              value={adjustmentTypeFilter}
              onChange={(e) => setAdjustmentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Tipler</option>
              <option value="increase">Artış</option>
              <option value="decrease">Azalış</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setAdjustmentTypeFilter('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {adjustments.length === 0 ? (
          <div className="text-center py-12">
            <FiSettings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Stok düzeltmesi bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Başlamak için yeni bir stok düzeltmesi oluşturun.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Yeni Düzeltme
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Düzeltme Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sebep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <FiPackage className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {adjustment.product_name || 'Ürün Adı'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {adjustment.product_sku || 'SKU'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getAdjustmentTypeBadge(adjustment.adjustment_type)}>
                          {getAdjustmentTypeIcon(adjustment.adjustment_type)}
                          <span className="ml-1">{getAdjustmentTypeText(adjustment.adjustment_type)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adjustment.quantity} {adjustment.unit || 'adet'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adjustment.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {adjustment.created_by_name || 'Bilinmiyor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {adjustment.created_at ? new Date(adjustment.created_at).toLocaleDateString('tr-TR') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Detayları Görüntüle"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      {/* Create Adjustment Modal */}
      <CreateAdjustmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={() => {
          // Refresh data will be handled by React Query automatically
        }}
      />
    </div>
  );
};

export default StockAdjustmentsPage;