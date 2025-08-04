import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSettings, 
  FiPackage, 
  FiTruck, 
  FiDollarSign,
  FiPlus,
  FiBarChart2,
  FiClipboard,
  FiRefreshCw,
  FiArchive,
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiPieChart,
  FiAlertTriangle
} from 'react-icons/fi';
import { useRecentActivities, useAlerts } from '../../hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';
import DashboardService from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatters';

const DashboardPage = () => {
  // React Query hooks for real database data
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => DashboardService.getStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();

  // Extract data from API responses
  const stats = statsData?.data || {};
  const recentActivities = activitiesData?.data || [];
  const alerts = alertsData?.data || [];
  const loading = statsLoading || activitiesLoading || alertsLoading;

  const mainCategories = [
    {
      title: "Envanter",
      color: "bg-blue-600", 
      colorHover: "hover:bg-blue-700",
      colorLight: "bg-blue-50",
      colorDark: "text-blue-600",
      items: [
        { name: "Ürünler", icon: <FiPackage className="w-4 h-4" />, link: "/products" },
        { name: "Mevcut stok", icon: <FiArchive className="w-4 h-4" />, link: "/current-stock" },
        { name: "Stok transferleri", icon: <FiTruck className="w-4 h-4" />, link: "/stock-transfers" },
        { name: "Stok düzeltmeleri", icon: <FiRefreshCw className="w-4 h-4" />, link: "/stock-adjustments" },
        { name: "Depo taramaları", icon: <FiBarChart2 className="w-4 h-4" />, link: "/stockroom-scans" }
      ]
    },
    {
      title: "Satın Alma", 
      color: "bg-yellow-700",
      colorHover: "hover:bg-yellow-800",
      colorLight: "bg-yellow-50",
      colorDark: "text-yellow-700",
      items: [
        { name: "Satın alma siparişleri", icon: <FiFileText className="w-4 h-4" />, link: "/purchase-orders" },
        { name: "Satın alma teklifleri", icon: <FiFileText className="w-4 h-4" />, link: "/purchase-quotes" },
        { name: "Tedarikçiler", icon: <FiUsers className="w-4 h-4" />, link: "/suppliers" },
        { name: "Stok yeniden siparişi", icon: <FiPlus className="w-4 h-4" />, link: "/stock-reorder" }
      ]
    },
    {
      title: "Üretim",
      color: "bg-purple-600",
      colorHover: "hover:bg-purple-700",
      colorLight: "bg-purple-50",
      colorDark: "text-purple-600",
      items: [
        { name: "Üretim siparişleri", icon: <FiSettings className="w-4 h-4" />, link: "/production" },
        { name: "Operasyonlar", icon: <FiClipboard className="w-4 h-4" />, link: "/operations" },
        { name: "BOM", icon: <FiFileText className="w-4 h-4" />, link: "/interactive-bom" }
      ]
    },
    {
      title: "Projeler",
      color: "bg-green-600",
      colorHover: "hover:bg-green-700", 
      colorLight: "bg-green-50",
      colorDark: "text-green-600",
      items: [
        { name: "Projeler", icon: <FiClipboard className="w-4 h-4" />, link: "/projects" }
      ]
    },
    {
      title: "Raporlar",
      color: "bg-indigo-600",
      colorHover: "hover:bg-indigo-700",
      colorLight: "bg-indigo-50", 
      colorDark: "text-indigo-600",
      items: [
        { name: "Satış raporları", icon: <FiTrendingUp className="w-4 h-4" />, link: "/sales-reports" },
        { name: "Envanter raporları", icon: <FiPieChart className="w-4 h-4" />, link: "/inventory-reports" }
      ]
    }
  ];



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

  if (statsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">Dashboard verileri yüklenirken hata oluştu: {statsError.message}</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Sistem genel durumu ve hızlı erişim</p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiPackage className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Kategori</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categoryCount || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiClipboard className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stokta Olmayan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.outOfStockCount || 0}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FiAlertTriangle className="text-yellow-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Stok Değeri</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalStockValue || 0)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiDollarSign className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Ana Modüller */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ana Modüller</h2>
            
            {/* Ana Modüller - Yan Yana */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {mainCategories.filter(cat => cat.title !== 'Raporlar').map((category, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className={`${category.color} px-4 py-3`}>
                    <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                  </div>
                  <div className="p-3">
                    <div className="space-y-1">
                      {category.items.map((item, itemIndex) => (
                        <Link
                          key={itemIndex}
                          to={item.link}
                          className={`flex items-center p-2 rounded-lg ${category.colorLight} ${category.colorHover} transition-colors group`}
                        >
                          <div className={`${category.colorDark} mr-2 group-hover:text-white`}>
                            {item.icon}
                          </div>
                          <span className={`text-sm font-medium ${category.colorDark} group-hover:text-white`}>
                            {item.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Raporlar - Altında */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Raporlar</h3>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                  <h4 className="text-xl font-semibold text-white">Raporlar</h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {mainCategories.find(cat => cat.title === 'Raporlar')?.items.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        to={item.link}
                        className="flex items-center p-3 rounded-lg bg-indigo-50 hover:bg-indigo-700 transition-colors group"
                      >
                        <div className="text-indigo-600 mr-3 group-hover:text-white">
                          {item.icon}
                        </div>
                        <span className="text-base font-medium text-indigo-600 group-hover:text-white">
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Son Aktiviteler ve Uyarılar - Alt kısımda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 5).map((activity, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Henüz aktivite bulunmuyor</p>
                )}
              </div>

              {/* Alerts */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uyarılar</h3>
                {alertsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="flex items-start">
                          <FiAlertTriangle className={`mt-0.5 mr-2 ${
                            alert.type === 'error' ? 'text-red-500' :
                            alert.type === 'warning' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} size={16} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                            <p className="text-xs text-gray-600">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Uyarı bulunmuyor</p>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default DashboardPage;