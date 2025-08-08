import React from 'react';
import { useTotalProducts } from '../hooks/useStats';
import { FiPackage, FiLoader } from 'react-icons/fi';

const TotalProductsWidget = ({ className = '' }) => {
  const { data, isLoading, isError, error } = useTotalProducts();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-24">
          <FiLoader className="w-8 h-8 text-red-600 animate-spin" />
          <span className="ml-2 text-gray-600">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-24">
          <div className="text-center">
            <div className="text-red-600 text-sm font-medium">Hata Oluştu</div>
            <div className="text-red-500 text-xs mt-1">
              {error?.message || 'Veri yüklenirken bir hata oluştu'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const total = data?.total || 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiPackage className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="text-sm font-medium text-gray-600">Toplam Ürün</div>
          <div className="text-2xl font-bold text-gray-900">
            {total.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>
      
      {/* İsteğe bağlı: Ek bilgi */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Aktif ürün sayısı
        </div>
      </div>
    </div>
  );
};

export default TotalProductsWidget;