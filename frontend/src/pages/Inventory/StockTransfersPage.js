import React, { useState } from 'react';
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  // FiSearch,
  // FiFilter,
  // FiDownload,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMapPin,
  FiPackage,
  FiEye,
  // FiRefreshCw,
} from 'react-icons/fi';
// import { toast } from 'react-hot-toast';
import {
  useStockTransfers,
  useStockTransferStats,
  useCreateStockTransfer,
} from '../../hooks/useStock';

// Create Transfer Modal Component
const CreateTransferModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    from_location: '',
    to_location: '',
    quantity: '',
    notes: '',
  });

  const createTransferMutation = useCreateStockTransfer();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await createTransferMutation.mutateAsync(formData);
      onClose();
      setFormData({
        product_id: '',
        from_location: '',
        to_location: '',
        quantity: '',
        notes: '',
      });
      if (onSave) onSave();
    } catch (error) {
      // console.error('Error creating transfer:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Yeni Stok Transferi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kaynak Lokasyon
            </label>
            <input
              type="text"
              value={formData.from_location}
              onChange={e =>
                setFormData({ ...formData, from_location: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hedef Lokasyon
            </label>
            <input
              type="text"
              value={formData.to_location}
              onChange={e =>
                setFormData({ ...formData, to_location: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Miktar
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={e =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createTransferMutation.isLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createTransferMutation.isLoading
                ? 'Oluşturuluyor...'
                : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const StockTransfersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFromFilter, setLocationFromFilter] = useState('');
  const [locationToFilter, setLocationToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // React Query hooks
  const {
    data: transfersData,
    isLoading: transfersLoading,
    error: transfersError,
  } = useStockTransfers({
    search: searchTerm,
    status: statusFilter,
    from_location: locationFromFilter,
    to_location: locationToFilter,
    page: currentPage,
  });

  const { data: statsData, isLoading: statsLoading } = useStockTransferStats();

  // Extract data from API responses
  const transfers = transfersData?.data?.transfers || transfersData?.data || [];
  const stats = statsData?.data || {};
  const totalPages = transfersData?.data?.pagination?.totalPages || 1;
  const loading = transfersLoading || statsLoading;

  const getStatusIcon = status => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-4 w-4 text-yellow-600" />;
      case 'in_transit':
        return <FiTruck className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <FiCheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <FiXCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FiClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'in_transit':
        return 'Yolda';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusBadge = status => {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'in_transit':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (transfersError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">
          Stok transferleri yüklenirken hata oluştu: {transfersError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stok Transferleri
          </h1>
          <p className="text-gray-600">
            Lokasyonlar arası stok hareketlerini yönetin
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> Yeni Transfer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <FiTruck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Toplam Transfer
              </p>
              <p className="text-2xl font-semibold text-blue-600">
                {stats.summary?.total_transfers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-2">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Beklemede</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {stats.summary?.pending_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tamamlandı</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.summary?.completed_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-2">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">İptal Edildi</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.summary?.cancelled_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Arama
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Transfer ID veya ürün adı..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Durum
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="in_transit">Yolda</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kaynak Lokasyon
            </label>
            <input
              type="text"
              value={locationFromFilter}
              onChange={e => setLocationFromFilter(e.target.value)}
              placeholder="Kaynak lokasyon..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setLocationFromFilter('');
                setLocationToFilter('');
                setCurrentPage(1);
              }}
              className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {transfers.length === 0 ? (
          <div className="py-12 text-center">
            <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Stok transferi bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Başlamak için yeni bir stok transferi oluşturun.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Yeni Transfer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Transfer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ürün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Lokasyonlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transfers.map(transfer => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        #{transfer.id || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                              <FiPackage className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {transfer.product_name || 'Ürün Adı'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transfer.product_sku || 'SKU'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex items-center">
                            <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {transfer.from_location || 'Kaynak'}
                            </span>
                          </div>
                          <FiArrowRight className="mx-2 h-4 w-4 text-gray-400" />
                          <div className="flex items-center">
                            <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {transfer.to_location || 'Hedef'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {transfer.quantity} {transfer.unit || 'adet'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={getStatusBadge(transfer.status)}>
                          {getStatusIcon(transfer.status)}
                          <span className="ml-1">
                            {getStatusText(transfer.status)}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {transfer.created_at
                          ? new Date(transfer.created_at).toLocaleDateString(
                              'tr-TR'
                            )
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Görüntüle"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Düzenle"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Sayfa <span className="font-medium">{currentPage}</span> /{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() =>
                          setCurrentPage(prev => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Önceki
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(prev => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Create Transfer Modal */}
      <CreateTransferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={() => {
          // Refresh data will be handled by React Query automatically
        }}
      />
    </div>
  );
};

export default StockTransfersPage;
