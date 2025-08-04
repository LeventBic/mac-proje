import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductionOrders, useProductionBOMs, useCreateProductionOrder } from '../../hooks/useProduction';
import { FiPlus, FiEye, FiPlay, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { formatQuantity } from '../../utils/formatters';

const ProductionPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    bom_id: '', 
    planned_quantity: '', 
    priority: 'medium', 
    notes: '' 
  });
  const navigate = useNavigate();

  // React Query hooks
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useProductionOrders();
  const { data: bomsData, isLoading: bomsLoading } = useProductionBOMs();
  const createOrderMutation = useCreateProductionOrder();

  // Extract data
  const orders = ordersData?.data || [];
  const boms = bomsData?.data || [];
  const loading = ordersLoading || bomsLoading;

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrderMutation.mutateAsync(form);
      setShowForm(false);
      setForm({ bom_id: '', planned_quantity: '', priority: 'medium', notes: '' });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      planned: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
          <FiClock className="w-3 h-3 mr-1" />
          Planlandı
        </span>
      ),
      in_progress: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
          <FiPlay className="w-3 h-3 mr-1" />
          Devam Ediyor
        </span>
      ),
      completed: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
          <FiCheck className="w-3 h-3 mr-1" />
          Tamamlandı
        </span>
      ),
      cancelled: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          İptal Edildi
        </span>
      )
    };
    return badges[status] || badges.planned;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Düşük</span>,
      medium: <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Orta</span>,
      high: <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Yüksek</span>,
      urgent: <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Acil</span>
    };
    return badges[priority] || badges.medium;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (ordersError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">Üretim verileri yüklenirken hata oluştu: {ordersError.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Üretim Yönetimi</h1>
              <p className="text-gray-600">Üretim emirlerini takip edin ve yönetin</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Yeni Üretim Emri</span>
            </button>
          </div>
        </div>

        {/* Production Orders Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Üretim Emirleri</h2>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emir No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BOM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Miktar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öncelik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.bom_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatQuantity(order.planned_quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(order.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => navigate(`/production/${order.id}`)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center space-x-1"
                          >
                            <FiEye className="w-3 h-3" />
                            <span>Detay</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiClock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Üretim emri yok</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz üretim emri oluşturulmamış.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  İlk Üretim Emrini Oluştur
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Production Order Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Yeni Üretim Emri</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BOM Seçin
                  </label>
                  <select
                    name="bom_id"
                    value={form.bom_id}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">BOM Seçin</option>
                    {boms.map((bom) => (
                      <option key={bom.id} value={bom.id}>
                        {bom.name} (v{bom.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planlanan Miktar
                  </label>
                  <input
                    type="number"
                    name="planned_quantity"
                    value={form.planned_quantity}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notlar
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Üretim emri ile ilgili notlar..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionPage;
