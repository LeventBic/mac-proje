import React, { useState, useEffect } from 'react';
import { 
  FiTruck,
  FiPlus,
  FiEdit2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMapPin,
  FiPackage,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// API Service
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class StockTransfersService {
  static async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/stock-transfers?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Transfer verisi alınamadı');
    return response.json();
  }

  static async create(data) {
    const response = await fetch(`${API_BASE}/stock-transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Transfer oluşturulamadı');
    return response.json();
  }

  static async updateStatus(id, status, notes = '') {
    const response = await fetch(`${API_BASE}/stock-transfers/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status, notes })
    });
    if (!response.ok) throw new Error('Transfer durumu güncellenemedi');
    return response.json();
  }

  static async getLocations() {
    const response = await fetch(`${API_BASE}/stock-transfers/locations/list`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Lokasyon listesi alınamadı');
    return response.json();
  }

  static async getStockByLocation(productId = '') {
    const queryString = productId ? `?product_id=${productId}` : '';
    const response = await fetch(`${API_BASE}/stock-transfers/products/stock-by-location${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Lokasyon bazlı stok alınamadı');
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

// Create Transfer Modal
const CreateTransferModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    location_from: '',
    location_to: '',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stockByLocation, setStockByLocation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.product_id && formData.location_from) {
      const stock = stockByLocation.find(s => 
        s.product_id == formData.product_id && s.location === formData.location_from
      );
      setAvailableStock(stock ? stock.available_quantity : 0);
    } else {
      setAvailableStock(0);
    }
  }, [formData.product_id, formData.location_from, stockByLocation]);

  const fetchInitialData = async () => {
    try {
      const [productsResponse, locationsResponse, stockResponse] = await Promise.all([
        StockTransfersService.getProducts(),
        StockTransfersService.getLocations(),
        StockTransfersService.getStockByLocation()
      ]);

      setProducts(productsResponse.data.items || []);
      setLocations(locationsResponse.data);
      setStockByLocation(stockResponse.data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await StockTransfersService.create({
        product_id: parseInt(formData.product_id),
        quantity: parseFloat(formData.quantity),
        location_from: formData.location_from,
        location_to: formData.location_to,
        notes: formData.notes
      });
      
      toast.success('Transfer başarıyla oluşturuldu');
      onSave();
      onClose();
      setFormData({
        product_id: '',
        quantity: '',
        location_from: '',
        location_to: '',
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
  };

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id == formData.product_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Stok Transferi
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
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kaynak Lokasyon *
                </label>
                <select
                  name="location_from"
                  value={formData.location_from}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Kaynak Seçin</option>
                  {locations.map(location => (
                    <option key={location.name} value={location.name}>
                      {location.name} ({location.product_count} ürün)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Lokasyon *
                </label>
                <select
                  name="location_to"
                  value={formData.location_to}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Hedef Seçin</option>
                  {locations.map(location => (
                    <option 
                      key={location.name} 
                      value={location.name}
                      disabled={location.name === formData.location_from}
                    >
                      {location.name} ({location.product_count} ürün)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Miktarı * {selectedProduct && `(${selectedProduct.unit})`}
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  max={availableStock}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {availableStock > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Mevcut stok: {availableStock} {selectedProduct?.unit}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Transfer ile ilgili notlar..."
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
                disabled={loading || availableStock < parseFloat(formData.quantity || 0)}
              >
                {loading ? 'Oluşturuluyor...' : 'Transfer Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
const StockTransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFromFilter, setLocationFromFilter] = useState('');
  const [locationToFilter, setLocationToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [locations, setLocations] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        location_from: locationFromFilter,
        location_to: locationToFilter
      };

      const [transfersResponse, locationsResponse] = await Promise.all([
        StockTransfersService.getAll(params),
        StockTransfersService.getLocations()
      ]);

      setTransfers(transfersResponse.data.transfers);
      setTotalPages(transfersResponse.data.pagination.totalPages);
      setLocations(locationsResponse.data);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, statusFilter, locationFromFilter, locationToFilter]);

  const handleStatusUpdate = async (transferId, status, notes = '') => {
    try {
      await StockTransfersService.updateStatus(transferId, status, notes);
      toast.success(status === 'completed' ? 'Transfer tamamlandı' : 'Transfer iptal edildi');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <FiXCircle className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiTruck className="mr-3 text-red-600" />
            Stok Transferleri
          </h1>
          <p className="text-gray-600 mt-1">Lokasyonlar arası stok transferlerini yönetin</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Yeni Transfer
          </button>
          
          <button className="btn-secondary flex items-center">
            <FiDownload className="mr-2" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="completed">Tamamlandı</option>
          </select>

          <select
            value={locationFromFilter}
            onChange={(e) => setLocationFromFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Kaynak Lokasyonlar</option>
            {locations.map(location => (
              <option key={location.name} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>

          <select
            value={locationToFilter}
            onChange={(e) => setLocationToFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Hedef Lokasyonlar</option>
            {locations.map(location => (
              <option key={location.name} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="btn-secondary flex items-center justify-center"
          >
            <FiRefreshCw className="mr-2" />
            Yenile
          </button>

          <button
            onClick={() => {
              setStatusFilter('');
              setLocationFromFilter('');
              setLocationToFilter('');
              setCurrentPage(1);
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <FiFilter className="mr-2" />
            Temizle
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12">
            <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Transfer bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belirtilen kriterlere uygun transfer bulunmuyor.
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
                      Transfer Yönü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
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
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiPackage className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transfer.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transfer.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMapPin className="w-3 h-3 mr-1" />
                            {transfer.location_from}
                          </div>
                          <FiArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMapPin className="w-3 h-3 mr-1" />
                            {transfer.location_to}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transfer.quantity} {transfer.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {getStatusIcon(transfer.status)}
                          <span className="ml-1">{getStatusText(transfer.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transfer.first_name} {transfer.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transfer.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {transfer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(transfer.id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                                title="Tamamla"
                              >
                                <FiCheckCircle />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('İptal nedeni:');
                                  if (reason !== null) {
                                    handleStatusUpdate(transfer.id, 'cancelled', reason);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="İptal Et"
                              >
                                <FiXCircle />
                              </button>
                            </>
                          )}
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Detayları Görüntüle"
                          >
                            <FiEye />
                          </button>
                        </div>
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

      {/* Create Transfer Modal */}
      <CreateTransferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchData}
      />
    </div>
  );
};

export default StockTransfersPage; 