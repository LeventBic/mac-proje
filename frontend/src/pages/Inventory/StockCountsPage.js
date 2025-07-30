import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiEye, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiStopCircle } from 'react-icons/fi';

const StockCountsPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCount, setSelectedCount] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 10
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
            
            const response = await fetch(`/api/stock-counts?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Stok sayımları getirilemedi');
            return response.json();
        }
    });

    // Yeni sayım başlat
    const addCountMutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch('/api/stock-counts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Sayım başlatılamadı');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stockCounts']);
            setShowAddModal(false);
        }
    });

    // Sayım başlat
    const startCountMutation = useMutation({
        mutationFn: async (countId) => {
            const response = await fetch(`/api/stock-counts/${countId}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Sayım başlatılamadı');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stockCounts']);
        }
    });

    // Sayım tamamla
    const completeCountMutation = useMutation({
        mutationFn: async (countId) => {
            const response = await fetch(`/api/stock-counts/${countId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Sayım tamamlanamadı');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stockCounts']);
        }
    });

    const getStatusBadge = (status) => {
        const statusConfig = {
            planned: { color: 'bg-blue-100 text-blue-800', text: 'Planlandı', icon: FiCalendar },
            in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'Devam Ediyor', icon: FiClock },
            completed: { color: 'bg-green-100 text-green-800', text: 'Tamamlandı', icon: FiCheckCircle },
            cancelled: { color: 'bg-red-100 text-red-800', text: 'İptal Edildi', icon: FiAlertCircle }
        };
        
        const config = statusConfig[status] || statusConfig.planned;
        const Icon = config.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const AddCountModal = () => {
        const [formData, setFormData] = useState({
            location: 'MAIN',
            scheduled_date: '',
            notes: ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            addCountMutation.mutate(formData);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Yeni Stok Sayımı</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lokasyon
                            </label>
                            <select
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="MAIN">Ana Depo</option>
                                <option value="WAREHOUSE_A">Depo A</option>
                                <option value="WAREHOUSE_B">Depo B</option>
                                <option value="PRODUCTION">Üretim</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Planlanan Tarih
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notlar
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                rows="3"
                                placeholder="Sayım hakkında notlar..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={addCountMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                const response = await fetch(`/api/stock-counts/${selectedCount.id}/items`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) throw new Error('Sayım ürünleri getirilemedi');
                return response.json();
            },
            enabled: !!selectedCount?.id && activeTab === 'items'
        });

        if (!selectedCount) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
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

                    <div className="flex space-x-4 mb-4">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Genel Bilgiler
                        </button>
                        <button
                            onClick={() => setActiveTab('items')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Ürünler ({selectedCount.total_items || 0})
                        </button>
                    </div>

                    {activeTab === 'details' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Temel Bilgiler</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Sayım No:</span> {selectedCount.count_number}</div>
                                    <div><span className="font-medium">Lokasyon:</span> {selectedCount.location}</div>
                                    <div><span className="font-medium">Durum:</span> {getStatusBadge(selectedCount.status)}</div>
                                    <div><span className="font-medium">Planlanan Tarih:</span> {formatDate(selectedCount.scheduled_date)}</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">İstatistikler</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Toplam Ürün:</span> {selectedCount.total_items || 0}</div>
                                    <div><span className="font-medium">Sayılan Ürün:</span> {selectedCount.counted_items || 0}</div>
                                    <div><span className="font-medium">Fark Bulunan:</span> {selectedCount.discrepancies_found || 0}</div>
                                    <div><span className="font-medium">Başlangıç:</span> {formatDate(selectedCount.started_at)}</div>
                                    <div><span className="font-medium">Bitiş:</span> {formatDate(selectedCount.completed_at)}</div>
                                </div>
                            </div>
                            {selectedCount.notes && (
                                <div className="col-span-2">
                                    <h4 className="font-medium text-gray-700 mb-2">Notlar</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedCount.notes}</p>
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beklenen</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sayılan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fark</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {countItems.data.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.product_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.expected_quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.counted_quantity ?? '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {item.variance_quantity ? (
                                                            <span className={`font-medium ${
                                                                item.variance_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {item.variance_quantity > 0 ? '+' : ''}{item.variance_quantity}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.unit}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Sayım ürünleri yükleniyor...
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        {selectedCount.status === 'planned' && (
                            <button
                                onClick={() => startCountMutation.mutate(selectedCount.id)}
                                disabled={startCountMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                                <FiPlay className="w-4 h-4 mr-2" />
                                {startCountMutation.isPending ? 'Başlatılıyor...' : 'Sayımı Başlat'}
                            </button>
                        )}
                        {selectedCount.status === 'in_progress' && (
                            <button
                                onClick={() => completeCountMutation.mutate(selectedCount.id)}
                                disabled={completeCountMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                <FiStopCircle className="w-4 h-4 mr-2" />
                                {completeCountMutation.isPending ? 'Tamamlanıyor...' : 'Sayımı Tamamla'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
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
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stok Sayımları</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Yeni Sayım
                </button>
            </div>

            {/* Filtreler */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                            className="border border-gray-300 rounded-md px-3 py-2"
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sayım No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lokasyon
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Planlanan Tarih
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İlerleme
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fark Bulunan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {counts?.data?.counts?.map((count) => (
                                <tr key={count.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {count.count_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {count.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(count.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(count.scheduled_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {count.total_items ? `${count.counted_items || 0} / ${count.total_items}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {count.discrepancies_found || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCount(count);
                                                    setShowDetailModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            {count.status === 'planned' && (
                                                <button
                                                    onClick={() => startCountMutation.mutate(count.id)}
                                                    disabled={startCountMutation.isPending}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                    title="Sayımı Başlat"
                                                >
                                                    <FiPlay className="w-4 h-4" />
                                                </button>
                                            )}
                                            {count.status === 'in_progress' && (
                                                <button
                                                    onClick={() => completeCountMutation.mutate(count.id)}
                                                    disabled={completeCountMutation.isPending}
                                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                                    title="Sayımı Tamamla"
                                                >
                                                    <FiStopCircle className="w-4 h-4" />
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                                disabled={filters.page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Önceki
                            </button>
                            <button
                                onClick={() => setFilters({...filters, page: Math.min(counts.data.pagination.totalPages, filters.page + 1)})}
                                disabled={filters.page === counts.data.pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sonraki
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Toplam <span className="font-medium">{counts.data.pagination.totalItems}</span> kayıttan{' '}
                                    <span className="font-medium">
                                        {((filters.page - 1) * filters.limit) + 1}
                                    </span>{' '}
                                    - <span className="font-medium">
                                        {Math.min(filters.page * filters.limit, counts.data.pagination.totalItems)}
                                    </span>{' '}
                                    arası gösteriliyor
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: counts.data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setFilters({...filters, page})}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === filters.page
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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