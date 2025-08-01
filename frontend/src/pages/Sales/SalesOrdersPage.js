import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiEye } from 'react-icons/fi';
import axiosClient from '../../config/axiosClient';

const SalesOrdersPage = () => {
  const [filters] = useState({
    status: '',
    customer_id: '',
    page: 1,
    limit: 10,
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['salesOrders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axiosClient.get(`/sales-orders?${params}`);
      return response.data;
    },
  });

  const getStatusBadge = status => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Onaylandı' },
      processing: { color: 'bg-purple-100 text-purple-800', text: 'İşleniyor' },
      shipped: { color: 'bg-orange-100 text-orange-800', text: 'Gönderildi' },
      delivered: {
        color: 'bg-green-100 text-green-800',
        text: 'Teslim Edildi',
      },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'İptal Edildi' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
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
        <h1 className="text-2xl font-bold text-gray-900">Satış Siparişleri</h1>
        <button className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <FiPlus className="mr-2 h-4 w-4" />
          Yeni Sipariş
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Sipariş No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Toplam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ordersData?.data?.orders?.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {order.customer_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {new Date(order.order_date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ₺{order.total_with_tax?.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <FiEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrdersPage;
