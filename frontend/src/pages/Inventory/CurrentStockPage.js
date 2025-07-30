import React, { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiFilter,
  FiDownload,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// API Service
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class CurrentStockService {
  static async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/current-stock?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Stok verisi alınamadı');
    return response.json();
  }

  static async getOne(id) {
    const response = await fetch(`${API_BASE}/current-stock/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Ürün verisi alınamadı');
    return response.json();
  }

  static async create(data) {
    const response = await fetch(`${API_BASE}/current-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ürün eklenemedi');
    return response.json();
  }

  static async update(id, data) {
    const response = await fetch(`${API_BASE}/current-stock/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ürün güncellenemedi');
    return response.json();
  }

  static async delete(id) {
    const response = await fetch(`${API_BASE}/current-stock/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Ürün silinemedi');
    return response.json();
  }

  static async getSuppliers() {
    const response = await fetch(`${API_BASE}/suppliers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Tedarikçi listesi alınamadı');
    return response.json();
  }

  static async getCategories() {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Kategori listesi alınamadı');
    return response.json();
  }
}

// Modal Component
const StockModal = ({ isOpen, onClose, item, suppliers, categories, onSave }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    cost_price: '',
    unit: 'pcs',
    location: '',
    min_stock_level: '',
    max_stock_level: '',
    reorder_point: '',
    reorder_quantity: '',
    available_quantity: '',
    expiry_date: '',
    batch_number: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        barcode: item.barcode || '',
        category_id: item.category_id || '',
        supplier_id: item.supplier_id || '',
        unit_price: item.unit_price || '',
        cost_price: item.cost_price || '',
        unit: item.unit || 'pcs',
        location: item.location || '',
        min_stock_level: item.min_stock_level || '',
        max_stock_level: item.max_stock_level || '',
        reorder_point: item.reorder_point || '',
        reorder_quantity: item.reorder_quantity || '',
        available_quantity: item.available_quantity || '',
        expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
        batch_number: item.batch_number || ''
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        description: '',
        barcode: '',
        category_id: '',
        supplier_id: '',
        unit_price: '',
        cost_price: '',
        unit: 'pcs',
        location: '',
        min_stock_level: '',
        max_stock_level: '',
        reorder_point: '',
        reorder_quantity: '',
        available_quantity: '',
        expiry_date: '',
        batch_number: ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await CurrentStockService.update(item.id, formData);
        toast.success('Ürün başarıyla güncellendi');
      } else {
        await CurrentStockService.create(formData);
        toast.success('Ürün başarıyla eklendi');
      }
      onSave();
      onClose();
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {item ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
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
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Temel Bilgiler</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barkod
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tedarikçi
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Tedarikçi Seçin</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fiyat ve Stok Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Fiyat ve Stok</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birim Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maliyet (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birim
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="pcs">Adet</option>
                      <option value="kg">Kilogram</option>
                      <option value="lt">Litre</option>
                      <option value="m">Metre</option>
                      <option value="m2">Metrekare</option>
                      <option value="m3">Metreküp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lokasyon
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min. Stok
                    </label>
                    <input
                      type="number"
                      name="min_stock_level"
                      value={formData.min_stock_level}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max. Stok
                    </label>
                    <input
                      type="number"
                      name="max_stock_level"
                      value={formData.max_stock_level}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeniden Sipariş Noktası
                    </label>
                    <input
                      type="number"
                      name="reorder_point"
                      value={formData.reorder_point}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sipariş Miktarı
                    </label>
                    <input
                      type="number"
                      name="reorder_quantity"
                      value={formData.reorder_quantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mevcut Stok Miktarı
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="available_quantity"
                    value={formData.available_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Son Kullanma Tarihi
                    </label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot/Seri No
                    </label>
                    <input
                      type="text"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
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
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (item ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CurrentStockPage = () => {
  const [stockItems, setStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        supplier_id: selectedSupplier,
        category_id: selectedCategory,
        stock_status: stockStatusFilter
      };

      const [stockResponse, suppliersResponse, categoriesResponse] = await Promise.all([
        CurrentStockService.getAll(params),
        CurrentStockService.getSuppliers(),
        CurrentStockService.getCategories()
      ]);

      setStockItems(stockResponse.data.items);
      setTotalPages(stockResponse.data.pagination.totalPages);
      setSuppliers(suppliersResponse.data.suppliers);
      setCategories(categoriesResponse.data);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedSupplier, selectedCategory, stockStatusFilter]);

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await CurrentStockService.delete(item.id);
      toast.success('Ürün başarıyla silindi');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock':
        return 'text-red-600 bg-red-100';
      case 'low_stock':
        return 'text-yellow-600 bg-yellow-100';
      case 'overstock':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case 'out_of_stock':
        return 'Tükendi';
      case 'low_stock':
        return 'Düşük Stok';
      case 'overstock':
        return 'Fazla Stok';
      default:
        return 'Stokta';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'out_of_stock':
        return <FiAlertTriangle className="w-4 h-4" />;
      case 'low_stock':
        return <FiTrendingDown className="w-4 h-4" />;
      case 'overstock':
        return <FiTrendingUp className="w-4 h-4" />;
      default:
        return <FiCheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiPackage className="mr-3 text-red-600" />
            Mevcut Stok
          </h1>
          <p className="text-gray-600 mt-1">Mevcut ürün stoklarını görüntüleyin ve yönetin</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedItem(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Yeni Ürün
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
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Tedarikçiler</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Tüm Stok Durumları</option>
            <option value="in_stock">Stokta</option>
            <option value="low_stock">Düşük Stok</option>
            <option value="out_of_stock">Tükendi</option>
            <option value="overstock">Fazla Stok</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedSupplier('');
              setStockStatusFilter('');
              setCurrentPage(1);
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <FiFilter className="mr-2" />
            Temizle
          </button>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        ) : stockItems.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belirtilen kriterlere uygun ürün bulunmuyor.
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
                      SKU / Barkod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori / Tedarikçi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Durumu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat / Değer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.sku}</div>
                        <div className="text-sm text-gray-500">{item.barcode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.category_name}</div>
                        <div className="text-sm text-gray-500">{item.supplier_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.stock_status)}`}>
                          {getStockStatusIcon(item.stock_status)}
                          <span className="ml-1">{getStockStatusText(item.stock_status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.available_quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₺{item.unit_price}</div>
                        <div className="text-sm text-gray-500">
                          Toplam: ₺{(item.stock_value || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Düzenle"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            title="Sil"
                          >
                            <FiTrash2 />
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

      {/* Modal */}
      <StockModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        suppliers={suppliers}
        categories={categories}
        onSave={fetchData}
      />
    </div>
  );
};

export default CurrentStockPage; 