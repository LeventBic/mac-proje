import React, { useState /*, useEffect */ } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPlus,
  // FiEdit2,
  FiEye,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPlay,
  FiStopCircle,
} from 'react-icons/fi';
import axiosClient from '../../config/axiosClient';
// import { toast } from 'react-hot-toast';

const StockCountsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10,
  });
  const queryClient = useQueryClient();

  // Stok sayımlarını getir
  const { data: counts, isLoading } = useQuery({
    queryKey: ['stockCounts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axiosClient.get(`/stock-counts?${params}`);
      return response.data;
    },
  });

  // Yeni sayım başlat
  const addCountMutation = useMutation({
    mutationFn: async data => {
      const response = await axiosClient.post('/stock-counts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stockCounts']);
      setShowAddModal(false);
    },
  });

  // Sayım başlat
  const startCountMutation = useMutation({
    mutationFn: async countId => {
      const response = await axiosClient.post(`/stock-counts/${countId}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stockCounts']);
    },
  });

  // Sayım tamamla
  const completeCountMutation = useMutation({
    mutationFn: async countId => {
      const response = await axiosClient.post(
        `/stock-counts/${countId}/complete`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stockCounts']);
    },
  });

  const getStatusBadge = status => {
    const statusConfig = {
      planned: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Planlandı',
        icon: FiCalendar,
      },
      in_progress: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Devam Ediyor',
        icon: FiClock,
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        text: 'Tamamlandı',
        icon: FiCheckCircle,
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        text: 'İptal Edildi',
        icon: FiAlertCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.planned;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = dateString => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const AddCountModal = () => {
    const [formData, setFormData] = useState({
      location: 'MAIN',
      scheduled_date: '',
      notes: '',
    });

    const handleSubmit = e => {
      e.preventDefault();
      addCountMutation.mutate(formData);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Yeni Stok Sayımı</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lokasyon
              </label>
              <select
                value={formData.location}
                onChange={e =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="MAIN">Ana Depo</option>
                <option value="WAREHOUSE_A">Depo A</option>
                <option value="WAREHOUSE_B">Depo B</option>
                <option value="PRODUCTION">Üretim</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Planlanan Tarih
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={e =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
                placeholder="Sayım hakkında notlar..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={addCountMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addCountMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CountDetailModal = () => {
    const [activeTab, setActiveTab] = useState('details');

    const { data: countItems } = useQuery({
      queryKey: ['stockCountItems', selectedCount?.id],
      queryFn: async () => {
        const response = await axiosClient.get(
          `/stock-counts/${selectedCount.id}/items`
        );
        return response.data;
      },
      enabled: !!selectedCount?.id && activeTab === 'items',
    });

    if (!selectedCount) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Sayım Detayı - {selectedCount.count_number}
            </h3>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 flex space-x-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`rounded-md px-4 py-2 ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`rounded-md px-4 py-2 ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Ürünler ({selectedCount.total_items || 0})
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium text-gray-700">
                  Temel Bilgiler
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Sayım No:</span>{' '}
                    {selectedCount.count_number}
                  </div>
                  <div>
                    <span className="font-medium">Lokasyon:</span>{' '}
                    {selectedCount.location}
                  </div>
                  <div>
                    <span className="font-medium">Durum:</span>{' '}
                    {getStatusBadge(selectedCount.status)}
                  </div>
                  <div>
                    <span className="font-medium">Planlanan Tarih:</span>{' '}
                    {formatDate(selectedCount.scheduled_date)}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">
                  İstatistikler
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Toplam Ürün:</span>{' '}
                    {selectedCount.total_items || 0}
                  </div>
                  <div>
                    <span className="font-medium">Sayılan Ürün:</span>{' '}
                    {selectedCount.counted_items || 0}
                  </div>
                  <div>
                    <span className="font-medium">Fark Bulunan:</span>{' '}
                    {selectedCount.discrepancies_found || 0}
                  </div>
                  <div>
                    <span className="font-medium">Başlangıç:</span>{' '}
                    {formatDate(selectedCount.started_at)}
                  </div>
                  <div>
                    <span className="font-medium">Bitiş:</span>{' '}
                    {formatDate(selectedCount.completed_at)}
                  </div>
                </div>
              </div>
              {selectedCount.notes && (
                <div className="col-span-2">
                  <h4 className="mb-2 font-medium text-gray-700">Notlar</h4>
                  <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                    {selectedCount.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              {countItems?.data ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Ürün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Beklenen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Sayılan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Fark
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Birim
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {countItems.data.map(item => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {item.product_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {item.sku}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {item.expected_quantity}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {item.counted_quantity ?? '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {item.variance_quantity ? (
                              <span
                                className={`font-medium ${
                                  item.variance_quantity > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {item.variance_quantity > 0 ? '+' : ''}
                                {item.variance_quantity}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Sayım ürünleri yükleniyor...
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            {selectedCount.status === 'planned' && (
              <button
                onClick={() => startCountMutation.mutate(selectedCount.id)}
                disabled={startCountMutation.isPending}
                className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <FiPlay className="mr-2 h-4 w-4" />
                {startCountMutation.isPending
                  ? 'Başlatılıyor...'
                  : 'Sayımı Başlat'}
              </button>
            )}
            {selectedCount.status === 'in_progress' && (
              <button
                onClick={() => completeCountMutation.mutate(selectedCount.id)}
                disabled={completeCountMutation.isPending}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FiStopCircle className="mr-2 h-4 w-4" />
                {completeCountMutation.isPending
                  ? 'Tamamlanıyor...'
                  : 'Sayımı Tamamla'}
              </button>
            )}
            <button
              onClick={() => setShowDetailModal(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stok Sayımları</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          Yeni Sayım
        </button>
      </div>

      {/* Filtreler */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tüm Durumlar</option>
              <option value="planned">Planlandı</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sayım Listesi */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sayım No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lokasyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Planlanan Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  İlerleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fark Bulunan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {counts?.data?.counts?.map(count => (
                <tr key={count.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {count.count_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {count.location}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(count.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(count.scheduled_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {count.total_items
                      ? `${count.counted_items || 0} / ${count.total_items}`
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {count.discrepancies_found || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCount(count);
                          setShowDetailModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      {count.status === 'planned' && (
                        <button
                          onClick={() => startCountMutation.mutate(count.id)}
                          disabled={startCountMutation.isPending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Sayımı Başlat"
                        >
                          <FiPlay className="h-4 w-4" />
                        </button>
                      )}
                      {count.status === 'in_progress' && (
                        <button
                          onClick={() => completeCountMutation.mutate(count.id)}
                          disabled={completeCountMutation.isPending}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Sayımı Tamamla"
                        >
                          <FiStopCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {counts?.data?.pagination && counts.data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: Math.max(1, filters.page - 1),
                  })
                }
                disabled={filters.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: Math.min(
                      counts.data.pagination.totalPages,
                      filters.page + 1
                    ),
                  })
                }
                disabled={filters.page === counts.data.pagination.totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Toplam{' '}
                  <span className="font-medium">
                    {counts.data.pagination.totalItems}
                  </span>{' '}
                  kayıttan{' '}
                  <span className="font-medium">
                    {(filters.page - 1) * filters.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(
                      filters.page * filters.limit,
                      counts.data.pagination.totalItems
                    )}
                  </span>{' '}
                  arası gösteriliyor
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                  {Array.from(
                    { length: counts.data.pagination.totalPages },
                    (_, i) => i + 1
                  ).map(page => (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                        page === filters.page
                          ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal'lar */}
      {showAddModal && <AddCountModal />}
      {showDetailModal && <CountDetailModal />}
    </div>
  );
};

export default StockCountsPage;
