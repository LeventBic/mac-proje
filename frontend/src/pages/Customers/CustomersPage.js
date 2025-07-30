import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiEye, FiEdit2, FiUsers, FiMail, FiPhone } from 'react-icons/fi';

const CustomersPage = () => {
    const [filters, setFilters] = useState({
        search: '',
        is_active: '',
        page: 1,
        limit: 10
    });

    const { data: customersData, isLoading } = useQuery({
        queryKey: ['customers', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            const response = await fetch(`/api/customers?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getToken('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Müşteriler getirilemedi');
            return response.json();
        }
    });

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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <FiUsers className="mr-3 text-blue-600" />
                        Müşteriler
                    </h1>
                    <p className="text-gray-600 mt-1">Müşteri bilgilerini görüntüleyin ve yönetin</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                    <FiPlus className="w-4 h-4 mr-2" />
                    Yeni Müşteri
                </button>
            </div>

            {/* Arama */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Müşteri ara..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                    <select
                        value={filters.is_active}
                        onChange={(e) => setFilters({...filters, is_active: e.target.value, page: 1})}
                        className="border border-gray-300 rounded-md px-3 py-2"
                    >
                        <option value="">Tüm Müşteriler</option>
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Müşteri
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    İletişim
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Sipariş Sayısı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Toplam Harcama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customersData?.data?.customers?.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {customer.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {customer.contact_person}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <FiMail className="w-3 h-3 mr-1" />
                                                {customer.email}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <FiPhone className="w-3 h-3 mr-1" />
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {customer.total_orders || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₺{(customer.total_spent || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            customer.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {customer.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button className="text-indigo-600 hover:text-indigo-900">
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                        </div>
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

export default CustomersPage; 