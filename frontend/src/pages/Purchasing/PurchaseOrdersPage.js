import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    FiPlus, FiEdit2, FiEye, FiCheck, FiX, FiTruck, FiDollarSign, 
    FiCalendar, FiUser, FiPackage, FiFileText, FiDownload 
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const PurchaseOrdersPage = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        supplier_id: '',
        date_from: '',
        date_to: '',
        page: 1,
        limit: 10
    });
    const queryClient = useQueryClient();

    // Satın alma siparişlerini getir
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['purchaseOrders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            const response = await fetch(`/api/purchase-orders?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Sipariş verileri getirilemedi');
            return response.json();
        }
    });

    // Tedarikçi listesi
    const { data: suppliersData } = useQuery({
        queryKey: ['purchaseOrderSuppliers'],
        queryFn: async () => {
            const response = await fetch('/api/purchase-orders/suppliers/list', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Tedarikçi listesi getirilemedi');
            return response.json();
        }
    });

    // Ürün listesi
    const { data: productsData } = useQuery({
        queryKey: ['purchaseOrderProducts'],
        queryFn: async () => {
            const response = await fetch('/api/purchase-orders/products/list', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Ürün listesi getirilemedi');
            return response.json();
        }
    });

    // Yeni sipariş oluştur
    const createOrderMutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Sipariş oluşturulamadı');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setShowCreateModal(false);
            toast.success('Sipariş başarıyla oluşturuldu');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Sipariş onaylama
    const approveOrderMutation = useMutation({
        mutationFn: async (orderId) => {
            const response = await fetch(`/api/purchase-orders/${orderId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Sipariş onaylanamadı');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            toast.success('Sipariş onaylandı');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Durum güncelleme
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }) => {
            const response = await fetch(`/api/purchase-orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) throw new Error('Durum güncellenemedi');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            toast.success('Sipariş durumu güncellendi');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Mal kabul
    const receiveOrderMutation = useMutation({
        mutationFn: async ({ orderId, received_items, delivery_date }) => {
            const response = await fetch(`/api/purchase-orders/${orderId}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ received_items, delivery_date })
            });
            
            if (!response.ok) throw new Error('Mal kabul işlemi başarısız');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setShowReceiveModal(false);
            toast.success('Mal kabul işlemi tamamlandı');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', text: 'Taslak', icon: FiFileText },
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor', icon: FiCalendar },
            approved: { color: 'bg-blue-100 text-blue-800', text: 'Onaylandı', icon: FiCheck },
            ordered: { color: 'bg-purple-100 text-purple-800', text: 'Sipariş Verildi', icon: FiPackage },
            partial: { color: 'bg-orange-100 text-orange-800', text: 'Kısmi Teslim', icon: FiTruck },
            completed: { color: 'bg-green-100 text-green-800', text: 'Tamamlandı', icon: FiCheck },
            cancelled: { color: 'bg-red-100 text-red-800', text: 'İptal Edildi', icon: FiX }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount || 0);
    };

    const CreateOrderModal = () => {
        const [formData, setFormData] = useState({
            supplier_id: '',
            order_date: new Date().toISOString().split('T')[0],
            required_date: '',
            notes: '',
            items: []
        });
        const [newItem, setNewItem] = useState({
            product_id: '',
            quantity: '',
            unit_price: ''
        });

        const addItem = () => {
            if (!newItem.product_id || !newItem.quantity || !newItem.unit_price) {
                toast.error('Tüm ürün bilgilerini doldurun');
                return;
            }

            const product = productsData?.data?.find(p => p.id === parseInt(newItem.product_id));
            if (!product) return;

            const item = {
                ...newItem,
                product_id: parseInt(newItem.product_id),
                quantity: parseFloat(newItem.quantity),
                unit_price: parseFloat(newItem.unit_price),
                product_name: product.name,
                sku: product.sku,
                unit: product.unit,
                total_price: parseFloat(newItem.quantity) * parseFloat(newItem.unit_price)
            };

            setFormData(prev => ({
                ...prev,
                items: [...prev.items, item]
            }));

            setNewItem({ product_id: '', quantity: '', unit_price: '' });
        };

        const removeItem = (index) => {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        };

        const getTotalAmount = () => {
            return formData.items.reduce((sum, item) => sum + item.total_price, 0);
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (formData.items.length === 0) {
                toast.error('En az bir ürün ekleyin');
                return;
            }
            createOrderMutation.mutate(formData);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Yeni Satın Alma Siparişi</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    Sipariş Tarihi *
                                </label>
                                <input
                                    type="date"
                                    value={formData.order_date}
                                    onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teslim Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={formData.required_date}
                                    onChange={(e) => setFormData({...formData, required_date: e.target.value})}
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
                                placeholder="Sipariş notları..."
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
                                        onChange={(e) => {
                                            const product = productsData?.data?.find(p => p.id === parseInt(e.target.value));
                                            setNewItem({
                                                ...newItem,
                                                product_id: e.target.value,
                                                unit_price: product?.unit_price || ''
                                            });
                                        }}
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
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Birim Fiyat (₺)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newItem.unit_price}
                                        onChange={(e) => setNewItem({...newItem, unit_price: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="0.00"
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
                                <h4 className="font-medium text-gray-900 mb-3">Sipariş Kalemleri</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ürün</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Miktar</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Birim Fiyat</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Toplam</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {formData.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm">{item.product_name}</td>
                                                    <td className="px-4 py-2 text-sm">{item.sku}</td>
                                                    <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-2 text-sm">{formatCurrency(item.unit_price)}</td>
                                                    <td className="px-4 py-2 text-sm font-medium">{formatCurrency(item.total_price)}</td>
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
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="4" className="px-4 py-2 text-sm font-medium text-right">
                                                    Ara Toplam:
                                                </td>
                                                <td className="px-4 py-2 text-sm font-bold">
                                                    {formatCurrency(getTotalAmount())}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan="4" className="px-4 py-2 text-sm font-medium text-right">
                                                    KDV (%18):
                                                </td>
                                                <td className="px-4 py-2 text-sm font-bold">
                                                    {formatCurrency(getTotalAmount() * 0.18)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan="4" className="px-4 py-2 text-sm font-medium text-right">
                                                    Genel Toplam:
                                                </td>
                                                <td className="px-4 py-2 text-sm font-bold text-green-600">
                                                    {formatCurrency(getTotalAmount() * 1.18)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
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
                                disabled={createOrderMutation.isPending || formData.items.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createOrderMutation.isPending ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
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
                <h1 className="text-2xl font-bold text-gray-900">Satın Alma Siparişleri</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                        <FiPlus className="w-4 h-4 mr-2" />
                        Yeni Sipariş
                    </button>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center">
                        <FiDownload className="w-4 h-4 mr-2" />
                        Dışa Aktar
                    </button>
                </div>
            </div>

            {/* Filtreler */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="draft">Taslak</option>
                            <option value="pending">Bekliyor</option>
                            <option value="approved">Onaylandı</option>
                            <option value="ordered">Sipariş Verildi</option>
                            <option value="partial">Kısmi Teslim</option>
                            <option value="completed">Tamamlandı</option>
                            <option value="cancelled">İptal Edildi</option>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({...filters, date_from: e.target.value, page: 1})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({...filters, date_to: e.target.value, page: 1})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                status: '',
                                supplier_id: '',
                                date_from: '',
                                date_to: '',
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

            {/* Sipariş Listesi */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sipariş No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tedarikçi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sipariş Tarihi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Toplam Tutar
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
                            {ordersData?.data?.orders?.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.po_number}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.first_name} {order.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.supplier_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.contact_person}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(order.order_date)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Teslim: {formatDate(order.required_date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total_with_tax)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            KDV Dahil
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.item_count} kalem
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowDetailModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Detayları Görüntüle"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => approveOrderMutation.mutate(order.id)}
                                                    disabled={approveOrderMutation.isPending}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                    title="Onayla"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(order.status === 'approved' || order.status === 'ordered' || order.status === 'partial') && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowReceiveModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Mal Kabul"
                                                >
                                                    <FiTruck className="w-4 h-4" />
                                                </button>
                                            )}
                                            {order.status === 'draft' && (
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                                                    disabled={updateStatusMutation.isPending}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                    title="İptal Et"
                                                >
                                                    <FiX className="w-4 h-4" />
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
                {ordersData?.data?.pagination && ordersData.data.pagination.totalPages > 1 && (
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
                                onClick={() => setFilters({...filters, page: Math.min(ordersData.data.pagination.totalPages, filters.page + 1)})}
                                disabled={filters.page === ordersData.data.pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sonraki
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Toplam <span className="font-medium">{ordersData.data.pagination.totalItems}</span> kayıttan{' '}
                                    <span className="font-medium">
                                        {((filters.page - 1) * filters.limit) + 1}
                                    </span>{' '}
                                    - <span className="font-medium">
                                        {Math.min(filters.page * filters.limit, ordersData.data.pagination.totalItems)}
                                    </span>{' '}
                                    arası gösteriliyor
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: ordersData.data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
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
            {showCreateModal && <CreateOrderModal />}
        </div>
    );
};

export default PurchaseOrdersPage; 