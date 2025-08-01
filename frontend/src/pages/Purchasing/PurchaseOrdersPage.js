/* eslint-disable no-unused-vars */
import React, { useState /*, useEffect */ } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPlus,
  /* FiEdit2, */ FiEye,
  FiCheck,
  FiX,
  FiTruck /* FiDollarSign, */,
  FiCalendar,
  /* FiUser, */ FiPackage,
  FiFileText,
  FiDownload,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '../../config/axiosClient';
import { formatCurrency } from '../../utils/formatters';

const PurchaseOrdersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const [showDetailModal, setShowDetailModal] = useState(false);
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 10,
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

      const response = await axiosClient.get(`/purchase-orders?${params}`);
      return response.data;
    },
  });

  // Tedarikçi listesi
  const { data: suppliersData } = useQuery({
    queryKey: ['purchaseOrderSuppliers'],
    queryFn: async () => {
      const response = await axiosClient.get('/purchase-orders/suppliers/list');
      return response.data;
    },
  });

  // Ürün listesi
  const { data: productsData } = useQuery({
    queryKey: ['purchaseOrderProducts'],
    queryFn: async () => {
      const response = await axiosClient.get('/purchase-orders/products/list');
      return response.data;
    },
  });

  // Yeni sipariş oluştur
  const createOrderMutation = useMutation({
    mutationFn: async data => {
      const response = await axiosClient.post('/purchase-orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseOrders']);
      setShowCreateModal(false);
      toast.success('Sipariş başarıyla oluşturuldu');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Sipariş onaylama
  const approveOrderMutation = useMutation({
    mutationFn: async orderId => {
      const response = await axiosClient.post(
        `/purchase-orders/${orderId}/approve`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseOrders']);
      toast.success('Sipariş onaylandı');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Durum güncelleme
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await axiosClient.patch(
        `/purchase-orders/${orderId}/status`,
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseOrders']);
      toast.success('Sipariş durumu güncellendi');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Mal kabul
  // const receiveOrderMutation = useMutation({
  //     mutationFn: async ({ orderId, received_items, delivery_date }) => {
  //         const response = await axiosClient.post(`/purchase-orders/${orderId}/receive`, { received_items, delivery_date });
  //         return response.data;
  //     },
  //     onSuccess: () => {
  //         queryClient.invalidateQueries(['purchaseOrders']);
  //         setShowReceiveModal(false);
  //         toast.success('Mal kabul işlemi tamamlandı');
  //     },
  //     onError: (error) => {
  //         toast.error(error.message);
  //     }
  // });

  const getStatusBadge = status => {
    const statusConfig = {
      draft: {
        color: 'bg-gray-100 text-gray-800',
        text: 'Taslak',
        icon: FiFileText,
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Bekliyor',
        icon: FiCalendar,
      },
      approved: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Onaylandı',
        icon: FiCheck,
      },
      ordered: {
        color: 'bg-purple-100 text-purple-800',
        text: 'Sipariş Verildi',
        icon: FiPackage,
      },
      partial: {
        color: 'bg-orange-100 text-orange-800',
        text: 'Kısmi Teslim',
        icon: FiTruck,
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        text: 'Tamamlandı',
        icon: FiCheck,
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        text: 'İptal Edildi',
        icon: FiX,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
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
    return new Date(dateString).toLocaleDateString('tr-TR');
  };



  const CreateOrderModal = () => {
    const [formData, setFormData] = useState({
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      required_date: '',
      notes: '',
      items: [],
    });
    const [newItem, setNewItem] = useState({
      product_id: '',
      quantity: '',
      unit_price: '',
    });

    const addItem = () => {
      if (!newItem.product_id || !newItem.quantity || !newItem.unit_price) {
        toast.error('Tüm ürün bilgilerini doldurun');
        return;
      }

      const product = productsData?.data?.find(
        p => p.id === parseInt(newItem.product_id)
      );
      if (!product) return;

      const item = {
        ...newItem,
        product_id: parseInt(newItem.product_id),
        quantity: parseFloat(newItem.quantity),
        unit_price: parseFloat(newItem.unit_price),
        product_name: product.name,
        sku: product.sku,
        unit: product.unit,
        total_price:
          parseFloat(newItem.quantity) * parseFloat(newItem.unit_price),
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, item],
      }));

      setNewItem({ product_id: '', quantity: '', unit_price: '' });
    };

    const removeItem = index => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    };

    const getTotalAmount = () => {
      return formData.items.reduce((sum, item) => sum + item.total_price, 0);
    };

    const handleSubmit = e => {
      e.preventDefault();
      if (formData.items.length === 0) {
        toast.error('En az bir ürün ekleyin');
        return;
      }
      createOrderMutation.mutate(formData);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Yeni Satın Alma Siparişi
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tedarikçi *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={e =>
                    setFormData({ ...formData, supplier_id: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sipariş Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={e =>
                    setFormData({ ...formData, order_date: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teslim Tarihi
                </label>
                <input
                  type="date"
                  value={formData.required_date}
                  onChange={e =>
                    setFormData({ ...formData, required_date: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
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
                placeholder="Sipariş notları..."
              />
            </div>

            {/* Ürün Ekleme */}
            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium text-gray-900">Ürün Ekle</h4>
              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ürün
                  </label>
                  <select
                    value={newItem.product_id}
                    onChange={e => {
                      const product = productsData?.data?.find(
                        p => p.id === parseInt(e.target.value)
                      );
                      setNewItem({
                        ...newItem,
                        product_id: e.target.value,
                        unit_price: product?.unit_price || '',
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Miktar
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newItem.quantity}
                    onChange={e =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Birim Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={e =>
                      setNewItem({ ...newItem, unit_price: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Ürün Listesi */}
            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium text-gray-900">
                  Sipariş Kalemleri
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Ürün
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          SKU
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Miktar
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Birim Fiyat
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Toplam
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.sku}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {formatCurrency(item.total_price)}
                          </td>
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
                        <td
                          colSpan="4"
                          className="px-4 py-2 text-right text-sm font-medium"
                        >
                          Ara Toplam:
                        </td>
                        <td className="px-4 py-2 text-sm font-bold">
                          {formatCurrency(getTotalAmount())}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-2 text-right text-sm font-medium"
                        >
                          KDV (%18):
                        </td>
                        <td className="px-4 py-2 text-sm font-bold">
                          {formatCurrency(getTotalAmount() * 0.18)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-2 text-right text-sm font-medium"
                        >
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
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={
                  createOrderMutation.isPending || formData.items.length === 0
                }
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createOrderMutation.isPending
                  ? 'Oluşturuluyor...'
                  : 'Sipariş Oluştur'}
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
        <h1 className="text-2xl font-bold text-gray-900">
          Satın Alma Siparişleri
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Yeni Sipariş
          </button>
          <button className="flex items-center rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
            <FiDownload className="mr-2 h-4 w-4" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tedarikçi
            </label>
            <select
              value={filters.supplier_id}
              onChange={e =>
                setFilters({ ...filters, supplier_id: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={e =>
                setFilters({ ...filters, date_from: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={e =>
                setFilters({ ...filters, date_to: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  status: '',
                  supplier_id: '',
                  date_from: '',
                  date_to: '',
                  page: 1,
                  limit: 10,
                })
              }
              className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Sipariş Listesi */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sipariş No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tedarikçi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sipariş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Toplam Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kalem Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ordersData?.data?.orders?.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.po_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.first_name} {order.last_name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.supplier_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.contact_person}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.order_date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Teslim: {formatDate(order.required_date)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_with_tax)}
                    </div>
                    <div className="text-sm text-gray-500">KDV Dahil</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {order.item_count} kalem
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Detayları Görüntüle"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => approveOrderMutation.mutate(order.id)}
                          disabled={approveOrderMutation.isPending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Onayla"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      {(order.status === 'approved' ||
                        order.status === 'ordered' ||
                        order.status === 'partial') && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReceiveModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Mal Kabul"
                        >
                          <FiTruck className="h-4 w-4" />
                        </button>
                      )}
                      {order.status === 'draft' && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: 'cancelled',
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="İptal Et"
                        >
                          <FiX className="h-4 w-4" />
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
        {ordersData?.data?.pagination &&
          ordersData.data.pagination.totalPages > 1 && (
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
                        ordersData.data.pagination.totalPages,
                        filters.page + 1
                      ),
                    })
                  }
                  disabled={
                    filters.page === ordersData.data.pagination.totalPages
                  }
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
                      {ordersData.data.pagination.totalItems}
                    </span>{' '}
                    kayıttan{' '}
                    <span className="font-medium">
                      {(filters.page - 1) * filters.limit + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-medium">
                      {Math.min(
                        filters.page * filters.limit,
                        ordersData.data.pagination.totalItems
                      )}
                    </span>{' '}
                    arası gösteriliyor
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                    {Array.from(
                      { length: ordersData.data.pagination.totalPages },
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
      {showCreateModal && <CreateOrderModal />}
    </div>
  );
};

export default PurchaseOrdersPage;
