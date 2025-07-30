import React, { useState, useEffect } from 'react';
import { 
  FiSettings,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiBarChart2,
  FiPackage,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// API Service
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class StockAdjustmentsService {
  static async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/stock-adjustments?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Düzeltme verisi alınamadı');
    return response.json();
  }

  static async create(data) {
    const response = await fetch(`${API_BASE}/stock-adjustments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Düzeltme oluşturulamadı');
    return response.json();
  }

  static async getReasons() {
    const response = await fetch(`${API_BASE}/stock-adjustments/reasons/list`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Sebep listesi alınamadı');
    return response.json();
  }

  static async getStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE}/stock-adjustments/stats/summary?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('İstatistik verisi alınamadı');
    return response.json();
  }

  static async getProducts() {
    const response = await fetch(`${API_BASE}/current-stock`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Ürün listesi alınamadı');
    return response.json();
  }
}

// Create Adjustment Modal
const CreateAdjustmentModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    adjustment_type: '',
    quantity: '',
    reason: '',
    unit_cost: '',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.product_id) {
      const product = products.find(p => p.id == formData.product_id);
      setAvailableStock(product ? product.available_quantity : 0);
    } else {
      setAvailableStock(0);
    }
  }, [formData.product_id, products]);

  const fetchInitialData = async () => {
    try {
      const [productsResponse, reasonsResponse] = await Promise.all([
        StockAdjustmentsService.getProducts(),
        StockAdjustmentsService.getReasons()
      ]);

      setProducts(productsResponse.data.items || []);
      setReasons(reasonsResponse.data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await StockAdjustmentsService.create({
        product_id: parseInt(formData.product_id),
        adjustment_type: formData.adjustment_type,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        notes: formData.notes
      });
      
      toast.success('Stok düzeltmesi başarıyla oluşturuldu');
      onSave();
      onClose();
      setFormData({
        product_id: '',
        adjustment_type: '',
        quantity: '',
        reason: '',
        unit_cost: '',
        notes: ''
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Sebep seçildiğinde düzeltme tipini otomatik belirle
    if (name === 'reason') {
      const selectedReason = reasons.find(r => r.code === value);
      if (selectedReason && selectedReason.type !== 'both') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          adjustment_type: selectedReason.type
        }));
      }
    }
  };

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id == formData.product_id);
  const selectedReason = reasons.find(r => r.code === formData.reason);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Stok Düzeltmesi
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün *
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Ürün Seçin</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Mevcut: {product.available_quantity} {product.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Düzeltme Sebebi *
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Sebep Seçin</option>
                  {reasons.map(reason => (
                    <option key={reason.code} value={reason.code}>
                      {reason.name}
                    </option>
                  ))}
                </select>
                {selectedReason && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedReason.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Düzeltme Tipi *
                </label>
                <select
                  name="adjustment_type"
                  value={formData.adjustment_type}
                  onChange={handleChange}
                  required
                  disabled={selectedReason && selectedReason.type !== 'both'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                >
                  <option value="">Tip Seçin</option>
                  <option value="increase">Artış (+)</option>
                  <option value="decrease">Azalış (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Düzeltme Miktarı * {selectedProduct && `(${selectedProduct.unit})`}
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  max={formData.adjustment_type === 'decrease' ? availableStock : undefined}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.adjustment_type === 'decrease' && availableStock > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Mevcut stok: {availableStock} {selectedProduct?.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birim Maliyet (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={selectedProduct ? selectedProduct.cost_price : ''}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ek Notlar
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Düzeltme ile ilgili ek açıklamalar..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={loading || (formData.adjustment_type === 'decrease' && availableStock < parseFloat(formData.quantity || 0))}
              >
                {loading ? 'Oluşturuluyor...' : 'Düzeltme Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
const StockAdjustmentsPage = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        adjustment_type: adjustmentTypeFilter
      };

      const [adjustmentsResponse, statsResponse] = await Promise.all([
        StockAdjustmentsService.getAll(params),
        StockAdjustmentsService.getStats()
      ]);

      setAdjustments(adjustmentsResponse.data.adjustments);
      setTotalPages(adjustmentsResponse.data.pagination.totalPages);
      setStats(statsResponse.data);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, adjustmentTypeFilter]);

  const getAdjustmentTypeColor = (type) => {
    switch (type) {
      case 'increase':
        return 'text-green-600 bg-green-100';
      case 'decrease':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAdjustmentTypeText = (type) => {
    switch (type) {
      case 'increase':
        return 'Artış';
      case 'decrease':
        return 'Azalış';
      default:
        return 'Bilinmeyen';
    }
  };

  const getAdjustmentTypeIcon = (type) => {
    switch (type) {
      case 'increase':
        return <FiTrendingUp className="w-4 h-4" />;
      case 'decrease':
        return <FiTrendingDown className="w-4 h-4" />;
      default:
        return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiSettings className="mr-3 text-red-600" />
            Stok Düzeltmeleri
          </h1>
          <p className="text-gray-600 mt-1">Manuel stok düzeltmelerini görüntüleyin ve yönetin</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Yeni Düzeltme
          </button>
          
          <button className="btn-secondary flex items-center">
            <FiDownload className="mr-2" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Düzeltme</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.summary?.total_adjustments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Artış</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.summary?.increase_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiTrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Azalış</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.summary?.decrease_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Değişim</p>
              <p className="text-2xl font-semibold text-purple-600">
                {((stats.summary?.total_increased || 0) - (stats.summary?.total_decreased || 0)).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={adjustmentTypeFilter}
            onChange={(e) => setAdjustmentTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Düzeltme Tipleri</option>
            <option value="increase">Artış</option>
            <option value="decrease">Azalış</option>
          </select>

          <div></div>
          <div></div>

          <button
            onClick={() => {
              setAdjustmentTypeFilter('');
              setCurrentPage(1);
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <FiFilter className="mr-2" />
            Temizle
          </button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        ) : adjustments.length === 0 ? (
          <div className="text-center py-12">
            <FiSettings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Düzeltme bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belirtilen kriterlere uygun düzeltme bulunmuyor.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Düzeltme Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sebep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiPackage className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {adjustment.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {adjustment.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAdjustmentTypeColor(adjustment.adjustment_type)}`}>
                          {getAdjustmentTypeIcon(adjustment.adjustment_type)}
                          <span className="ml-1">{getAdjustmentTypeText(adjustment.adjustment_type)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adjustment.adjusted_quantity} {adjustment.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {adjustment.notes?.split(' - ')[1]?.split(':')[0] || 'Belirtilmemiş'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiUser className="w-3 h-3 mr-1" />
                          {adjustment.first_name} {adjustment.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          {new Date(adjustment.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Detayları Görüntüle"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Sayfa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Önceki
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sonraki
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Adjustment Modal */}
      <CreateAdjustmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchData}
      />
    </div>
  );
};

export default StockAdjustmentsPage; 