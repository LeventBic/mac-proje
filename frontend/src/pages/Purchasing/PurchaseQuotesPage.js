import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEye, FiCheck, FiX, FiRefreshCw, FiMail, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '../../config/axiosClient';

const PurchaseQuotesPage = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        supplier_id: '',
        page: 1,
        limit: 10
    });
    const queryClient = useQueryClient();

    // Teklifleri getir
    const { data: quotesData, isLoading } = useQuery({
        queryKey: ['purchaseQuotes', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            const response = await axiosClient.get(`/purchase-quotes?${params}`);
            return response.data;
        }
    });

    // Tedarikçi listesi
    const { data: suppliersData } = useQuery({
        queryKey: ['quotesSuppliers'],
        queryFn: async () => {
            const response = await axiosClient.get('/purchase-orders/suppliers/list');
            return response.data;
        }
    });

    // Ürün listesi
    const { data: productsData } = useQuery({
        queryKey: ['quotesProducts'],
        queryFn: async () => {
            const response = await axiosClient.get('/purchase-orders/products/list');
            return response.data;
        }
    });

    // Yeni teklif talebi oluştur
    const createQuoteMutation = useMutation({
        mutationFn: async (data) => {
            const response = await axiosClient.post('/purchase-quotes', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseQuotes']);
            setShowCreateModal(false);
            toast.success('Teklif talebi oluşturuldu');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Durum güncelleme
    const updateStatusMutation = useMutation({
        mutationFn: async ({ quoteId, status }) => {
            const response = await axiosClient.patch(`/purchase-quotes/${quoteId}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseQuotes']);
            toast.success('Teklif durumu güncellendi');
        }
    });

    // Siparişe çevir
    const convertToOrderMutation = useMutation({
        mutationFn: async (quoteId) => {
            const response = await axiosClient.post(`/purchase-quotes/${quoteId}/convert-to-order`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['purchaseQuotes']);
            toast.success(`Sipariş oluşturuldu: ${data.data.po_number}`);
        }
    });

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor', icon: FiFileText },
            sent: { color: 'bg-blue-100 text-blue-800', text: 'Gönderildi', icon: FiMail },
            received: { color: 'bg-purple-100 text-purple-800', text: 'Alındı', icon: FiCheck },
            accepted: { color: 'bg-green-100 text-green-800', text: 'Kabul Edildi', icon: FiCheck },
            rejected: { color: 'bg-red-100 text-red-800', text: 'Reddedildi', icon: FiX },
            expired: { color: 'bg-gray-100 text-gray-800', text: 'Süresi Doldu', icon: FiX },
            converted: { color: 'bg-indigo-100 text-indigo-800', text: 'Siparişe Çevrildi', icon: FiRefreshCw }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
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
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const CreateQuoteModal = () => {
        const [formData, setFormData] = useState({
            supplier_id: '',
            request_date: new Date().toISOString().split('T')[0],
            due_date: '',
            notes: '',
            items: []
        });
        const [newItem, setNewItem] = useState({
            product_id: '',
            quantity: '',
            requested_price: ''
        });

        const addItem = () => {
            if (!newItem.product_id || !newItem.quantity) {
                toast.error('Ürün ve miktar gerekli');
                return;
            }

            const product = productsData?.data?.find(p => p.id === parseInt(newItem.product_id));
            if (!product) return;

            const item = {
                ...newItem,
                product_id: parseInt(newItem.product_id),
                quantity: parseFloat(newItem.quantity),
                requested_price: parseFloat(newItem.requested_price) || 0,
                product_name: product.name,
                sku: product.sku,
                unit: product.unit
            };

            setFormData(prev => ({
                ...prev,
                items: [...prev.items, item]
            }));

            setNewItem({ product_id: '', quantity: '', requested_price: '' });
        };

        const removeItem = (index) => {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (formData.items.length === 0) {
                toast.error('En az bir ürün ekleyin');
                return;
            }
            createQuoteMutation.mutate(formData);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Yeni Teklif Talebi</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tedarikçi *
                                </label>
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                >
                                    <option value="">Tedarikçi Seçin</option>
                                    {suppliersData?.data?.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Talep Tarihi *
                                </label>
                                <input
                                    type="date"
                                    value={formData.request_date}
                                    onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Son Tarih
                                </label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
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
                                placeholder="Teklif notları..."
                            />
                        </div>

                        {/* Ürün Ekleme */}
                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Ürün Ekle</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ürün
                                    </label>
                                    <select
                                        value={newItem.product_id}
                                        onChange={(e) => setNewItem({...newItem, product_id: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Ürün Seçin</option>
                                        {productsData?.data?.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.sku})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Miktar
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Beklenen Fiyat (₺)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newItem.requested_price}
                                        onChange={(e) => setNewItem({...newItem, requested_price: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ürün Listesi */}
                        {formData.items.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Talep Edilen Ürünler</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ürün</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Miktar</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Beklenen Fiyat</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {formData.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm">{item.product_name}</td>
                                                    <td className="px-4 py-2 text-sm">{item.sku}</td>
                                                    <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-2 text-sm">₺{item.requested_price}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Kaldır
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 border-t pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={createQuoteMutation.isPending || formData.items.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createQuoteMutation.isPending ? 'Oluşturuluyor...' : 'Teklif Talebi Oluştur'}
                            </button>
                        </div>
                    </form>
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
                <h1 className="text-2xl font-bold text-gray-900">Satın Alma Teklifleri</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Yeni Teklif Talebi
                </button>
            </div>

            {/* Filtreler */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="pending">Bekliyor</option>
                            <option value="sent">Gönderildi</option>
                            <option value="received">Alındı</option>
                            <option value="accepted">Kabul Edildi</option>
                            <option value="rejected">Reddedildi</option>
                            <option value="expired">Süresi Doldu</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
                        <select
                            value={filters.supplier_id}
                            onChange={(e) => setFilters({...filters, supplier_id: e.target.value, page: 1})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Tüm Tedarikçiler</option>
                            {suppliersData?.data?.map(supplier => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                status: '',
                                supplier_id: '',
                                page: 1,
                                limit: 10
                            })}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Temizle
                        </button>
                    </div>
                </div>
            </div>

            {/* Teklif Listesi */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Teklif No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tedarikçi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Talep Tarihi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Son Tarih
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kalem Sayısı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quotesData?.data?.quotes?.map((quote) => (
                                <tr key={quote.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {quote.quote_number}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {quote.first_name} {quote.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {quote.supplier_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {quote.contact_person}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(quote.request_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(quote.due_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(quote.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {quote.item_count} kalem
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Detayları Görüntüle"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            {quote.status === 'pending' && (
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({ quoteId: quote.id, status: 'sent' })}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Gönderildi Olarak İşaretle"
                                                >
                                                    <FiMail className="w-4 h-4" />
                                                </button>
                                            )}
                                            {quote.status === 'received' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ quoteId: quote.id, status: 'accepted' })}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Kabul Et"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ quoteId: quote.id, status: 'rejected' })}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Reddet"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {quote.status === 'accepted' && (
                                                <button
                                                    onClick={() => convertToOrderMutation.mutate(quote.id)}
                                                    disabled={convertToOrderMutation.isPending}
                                                    className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                                                    title="Siparişe Çevir"
                                                >
                                                    <FiRefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal'lar */}
            {showCreateModal && <CreateQuoteModal />}
        </div>
    );
};

export default PurchaseQuotesPage;