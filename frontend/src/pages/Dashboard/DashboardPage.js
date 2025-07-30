import React, { useEffect, useState } from 'react';
import { apiCall } from '../../config/api';
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
  FiPieChart
} from 'react-icons/fi';

const DashboardPage = () => {
  const mainCategories = [
    {
      title: "Üretim",
      color: "bg-purple-600",
      colorHover: "hover:bg-purple-700",
      colorLight: "bg-purple-50",
      colorDark: "text-purple-600",
      items: [
        { name: "Üretim siparişleri", icon: <FiSettings className="w-4 h-4" />, link: "/production" },
        { name: "Operasyonlar", icon: <FiClipboard className="w-4 h-4" />, link: "/operations" }
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
        { name: "Tedarikçiler", icon: <FiUsers className="w-4 h-4" />, link: "/suppliers" }
      ]
    },
    {
      title: "Envanter",
      color: "bg-blue-600", 
      colorHover: "hover:bg-blue-700",
      colorLight: "bg-blue-50",
      colorDark: "text-blue-600",
      items: [
        { name: "Ürünler", icon: <FiPackage className="w-4 h-4" />, link: "/products" },
        { name: "Stok yeniden sipariş", icon: <FiRefreshCw className="w-4 h-4" />, link: "/reorder-stock" },
        { name: "Mevcut stok", icon: <FiArchive className="w-4 h-4" />, link: "/current-stock" },
        { name: "Stok transferleri", icon: <FiTruck className="w-4 h-4" />, link: "/stock-transfers" },
        { name: "Stok düzeltmeleri", icon: <FiSettings className="w-4 h-4" />, link: "/stock-adjustments" },
        { name: "Stok sayımları", icon: <FiBarChart2 className="w-4 h-4" />, link: "/stock-counts" },
        { name: "Depo taramaları", icon: <FiClipboard className="w-4 h-4" />, link: "/stockroom-scans" }
      ]
    },
    {
      title: "Satış",
      color: "bg-green-600",
      colorHover: "hover:bg-green-700", 
      colorLight: "bg-green-50",
      colorDark: "text-green-600",
      items: [
        { name: "Satış siparişleri", icon: <FiDollarSign className="w-4 h-4" />, link: "/sales-orders" },
        { name: "Satış teklifleri", icon: <FiFileText className="w-4 h-4" />, link: "/sales-quotes" },
        { name: "Müşteriler", icon: <FiUsers className="w-4 h-4" />, link: "/customers" }
      ]
    }
  ];

  const reportsCategories = [
    {
      title: "Üretim",
      icon: <FiSettings className="w-4 h-4" />,
      link: "/reports/manufacturing"
    },
    {
      title: "Satın Alma", 
      icon: <FiTruck className="w-4 h-4" />,
      link: "/reports/purchasing"
    },
    {
      title: "Satış",
      icon: <FiDollarSign className="w-4 h-4" />,
      link: "/reports/sales"
    },
    {
      title: "Yeniden sipariş ve tahmin",
      icon: <FiTrendingUp className="w-4 h-4" />,
      link: "/reports/reordering"
    },
    {
      title: "Denetim kaydı",
      icon: <FiFileText className="w-4 h-4" />,
      link: "/reports/audit"
    },
    {
      title: "Ödeme ve muhasebe", 
      icon: <FiPieChart className="w-4 h-4" />,
      link: "/reports/accounting"
    },
    {
      title: "Stok seviyeleri",
      icon: <FiBarChart2 className="w-4 h-4" />,
      link: "/reports/stock-levels"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainCategories.map((category, index) => (
            <div key={category.title} className="relative">
              {/* Category Header */}
              <div className={`${category.color} ${category.colorHover} text-white p-4 rounded-t-lg relative transition-colors duration-200 cursor-pointer group`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                  <FiPlus className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Category Content */}
              <div className="bg-white border border-gray-200 rounded-b-lg p-4 h-96 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        to={item.link}
                        className={`flex items-center space-x-3 p-2 rounded-lg ${category.colorLight} ${category.colorDark} hover:shadow-sm transition-all duration-200 group`}
                      >
                        <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>
                        <span className="text-sm font-medium group-hover:font-semibold">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Reports Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Reports Header */}
          <div className="bg-purple-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <FiBarChart2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">Raporlar</h2>
            </div>
          </div>
          
          {/* Reports Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {reportsCategories.map((report, index) => (
                <div key={index} className="group h-20">
                  <Link
                    to={report.link}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg transition-colors duration-200 text-sm h-full"
                  >
                    <span className="opacity-70 group-hover:opacity-100 mb-2 text-purple-600">{report.icon}</span>
                    <span className="font-medium group-hover:font-semibold text-center text-gray-700 group-hover:text-purple-700 text-xs leading-tight">{report.title}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;