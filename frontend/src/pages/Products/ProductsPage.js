import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiX, FiEye } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { apiCall, API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('all');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: errorsCategory },
  } = useForm();

  const {
    register: registerProductType,
    handleSubmit: handleSubmitProductType,
    reset: resetProductType,
    formState: { errors: errorsProductType },
  } = useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (productType !== 'all') params.append('type', productType);

      const [productsResult, categoriesResult, productTypesResult, suppliersResult] = await Promise.all([
        apiCall(`/api/products?${params}`),
        apiCall('/api/categories'),
        apiCall('/api/product-types'),
        apiCall('/api/suppliers')
      ]);
      
      const productsData = productsResult.data;
      const categoriesData = categoriesResult.data;
      const productTypesData = productTypesResult.data;
      const suppliersData = suppliersResult.data;
      
      console.log('Products API Response:', productsData);
      console.log('Products array:', productsData.products);
      
      setProducts(productsData.products || []);
      setCategories(categoriesData.data || []);
      setProductTypes(productTypesData.data || []);
      setSuppliers(suppliersData.data || []);
    } catch (err) {
      toast.error('Veriler yüklenirken hata oluştu');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, productType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProduct = async (data) => {

    try {
      setSubmitting(true);
      const result = await apiCall('/api/products', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result.status === 'success') {
        toast.success('Ürün başarıyla oluşturuldu!');
        setShowCreateModal(false);
        reset();
        fetchData();
      } else {
        toast.error(result.message || 'Ürün oluşturulurken hata oluştu');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else {
        toast.error(error.response?.data?.message || 'Ürün oluşturulurken hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (data) => {
    try {
      setSubmitting(true);
      const result = await apiCall('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result.success) {
        toast.success('Kategori başarıyla oluşturuldu!');
        setShowCategoryModal(false);
        resetCategory();
        fetchData();
      } else {
        toast.error(result.message || 'Kategori oluşturulurken hata oluştu');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kategori oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProductType = async (data) => {
    try {
      setSubmitting(true);
      const result = await apiCall('/api/product-types', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result.success) {
        toast.success('Ürün tipi başarıyla oluşturuldu!');
        setShowProductTypeModal(false);
        resetProductType();
        fetchData();
      } else {
        toast.error(result.message || 'Ürün tipi oluşturulurken hata oluştu');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ürün tipi oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Ürün başarıyla silindi');
        setShowDeleteModal(false);
        setProductToDelete(null);
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Ürün silinirken hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const getStockStatusBadge = (product) => {
    const status = product.stock_status;
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800',
      'overstock': 'bg-blue-100 text-blue-800'
    };
    const labels = {
      'in_stock': 'Stokta',
      'low_stock': 'Düşük Stok',
      'out_of_stock': 'Stok Yok',
      'overstock': 'Fazla Stok'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || 'Bilinmiyor'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Ürünler</h1>
          <p className="text-secondary-600">Tüm ürünleri yönetin</p>
        </div>
        <div className="card">
          <div className="animate-pulse py-12">
            <div className="text-center">
              <div className="h-4 bg-secondary-200 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Ürünler</h1>
          <p className="text-secondary-600">Tüm ürünleri yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Ürün
        </button>
      </div>

      {/* Arama ve Filtreler */}
      <div className="card p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 text-sm">Arama</label>
            <input
              type="text"
              placeholder="Ürün adı, SKU veya barkod..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Kategori</label>
            <div className="flex gap-2">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input flex-1">
                <option value="">Tüm Kategoriler</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-secondary px-3"
                title="Yeni Kategori Ekle"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">Ürün Tipi</label>
            <div className="flex gap-2">
              <select value={productType} onChange={(e) => setProductType(e.target.value)} className="input flex-1">
                <option value="all">Tümü</option>
                {productTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowProductTypeModal(true)}
                className="btn-secondary px-3"
                title="Yeni Ürün Tipi Ekle"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setProductType('all'); }} className="btn btn-outline w-full">
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Yeni Ürün Oluştur</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateProduct)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* SKU */}
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    {...register('sku', {
                      required: 'SKU gereklidir',
                      minLength: { value: 2, message: 'En az 2 karakter olmalıdır' },
                      pattern: {
                        value: /^[A-Z0-9-_]+$/,
                        message: 'SKU sadece büyük harf, rakam, tire (-) ve alt çizgi (_) içerebilir'
                      }
                    })}
                    type="text"
                    className={`form-input ${errors.sku ? 'border-error-300' : ''}`}
                    placeholder="PRD001"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {errors.sku && (
                    <p className="form-error">{errors.sku.message}</p>
                  )}
                  <p className="text-xs text-secondary-500 mt-1">
                    Sadece büyük harf, rakam, tire (-) ve alt çizgi (_) kullanın
                  </p>
                </div>

                {/* Product Name */}
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input
                    {...register('name', {
                      required: 'Ürün adı gereklidir',
                      minLength: { value: 2, message: 'En az 2 karakter olmalıdır' },
                    })}
                    type="text"
                    className={`form-input ${errors.name ? 'border-error-300' : ''}`}
                    placeholder="Ürün adı"
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                {/* Barcode */}
                <div className="form-group">
                  <label className="form-label">Barkod</label>
                  <input
                    {...register('barcode')}
                    type="text"
                    className="form-input"
                    placeholder="1234567890123"
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    {...register('categoryId')}
                    className="form-input"
                  >
                    <option value="">Kategori seçiniz</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product Type */}
                <div className="form-group">
                  <label className="form-label">Ürün Tipi</label>
                  <select
                    {...register('productTypeId')}
                    className="form-input"
                  >
                    <option value="">Ürün tipi seçiniz</option>
                    {productTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div className="form-group">
                  <label className="form-label">Tedarikçi</label>
                  <select
                    {...register('supplierId')}
                    className="form-input"
                  >
                    <option value="">Tedarikçi seçiniz</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div className="form-group">
                  <label className="form-label">Birim</label>
                  <select
                    {...register('unit')}
                    className="form-input"
                    defaultValue="pcs"
                  >
                    <option value="pcs">Adet</option>
                    <option value="kg">Kilogram</option>
                    <option value="lt">Litre</option>
                    <option value="m">Metre</option>
                    <option value="m2">Metrekare</option>
                    <option value="m3">Metreküp</option>
                  </select>
                </div>

                {/* Unit Price */}
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı</label>
                  <input
                    {...register('unitPrice', {
                      min: { value: 0, message: 'Fiyat 0\'dan küçük olamaz' },
                    })}
                    type="number"
                    className={`form-input ${errors.unitPrice ? 'border-error-300' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.unitPrice && (
                    <p className="form-error">{errors.unitPrice.message}</p>
                  )}
                </div>

                {/* Cost Price */}
                <div className="form-group">
                  <label className="form-label">Maliyet Fiyatı</label>
                  <input
                    {...register('costPrice', {
                      min: { value: 0, message: 'Fiyat 0\'dan küçük olamaz' },
                    })}
                    type="number"
                    className={`form-input ${errors.costPrice ? 'border-error-300' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.costPrice && (
                    <p className="form-error">{errors.costPrice.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="form-group">
                  <label className="form-label">Lokasyon</label>
                  <input
                    {...register('location')}
                    type="text"
                    className="form-input"
                    placeholder="A-01-01"
                  />
                </div>

                {/* Min Stock Level */}
                <div className="form-group">
                  <label className="form-label">Min. Stok Seviyesi</label>
                  <input
                    {...register('minStockLevel', {
                      min: { value: 0, message: 'Minimum stok 0\'dan küçük olamaz' },
                    })}
                    type="number"
                    className={`form-input ${errors.minStockLevel ? 'border-error-300' : ''}`}
                    placeholder="0"
                    min="0"
                    defaultValue="0"
                  />
                  {errors.minStockLevel && (
                    <p className="form-error">{errors.minStockLevel.message}</p>
                  )}
                </div>

                {/* Max Stock Level */}
                <div className="form-group">
                  <label className="form-label">Max. Stok Seviyesi</label>
                  <input
                    {...register('maxStockLevel', {
                      min: { value: 0, message: 'Maksimum stok 0\'dan küçük olamaz' },
                    })}
                    type="number"
                    className={`form-input ${errors.maxStockLevel ? 'border-error-300' : ''}`}
                    placeholder="100"
                    min="0"
                  />
                  {errors.maxStockLevel && (
                    <p className="form-error">{errors.maxStockLevel.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  {...register('description')}
                  className="form-input"
                  rows="3"
                  placeholder="Ürün açıklaması..."
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    {...register('isRawMaterial')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">Ham Madde</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...register('isFinishedProduct')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">Bitmiş Ürün</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Yeni Kategori Ekle</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategory();
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory(handleCreateCategory)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Kategori Adı *</label>
                <input
                  {...registerCategory('name', {
                    required: 'Kategori adı gereklidir',
                    minLength: { value: 2, message: 'En az 2 karakter olmalıdır' },
                  })}
                  type="text"
                  className={`form-input ${errorsCategory.name ? 'border-error-300' : ''}`}
                  placeholder="Kategori adı"
                />
                {errorsCategory.name && (
                  <p className="form-error">{errorsCategory.name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  {...registerCategory('description')}
                  className="form-input"
                  rows="3"
                  placeholder="Kategori açıklaması..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Üst Kategori</label>
                <select
                  {...registerCategory('parent_id')}
                  className="form-input"
                >
                  <option value="">Ana Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategory();
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Type Modal */}
      {showProductTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Yeni Ürün Tipi Ekle</h3>
              <button
                onClick={() => {
                  setShowProductTypeModal(false);
                  resetProductType();
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitProductType(handleCreateProductType)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Ürün Tipi Adı *</label>
                <input
                  {...registerProductType('name', {
                    required: 'Ürün tipi adı gereklidir',
                    minLength: { value: 2, message: 'En az 2 karakter olmalıdır' },
                  })}
                  type="text"
                  className={`form-input ${errorsProductType.name ? 'border-error-300' : ''}`}
                  placeholder="Ürün tipi adı"
                />
                {errorsProductType.name && (
                  <p className="form-error">{errorsProductType.name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  {...registerProductType('description')}
                  className="form-input"
                  rows="3"
                  placeholder="Ürün tipi açıklaması..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductTypeModal(false);
                    resetProductType();
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Ürün Listesi ({products.length} ürün)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Ürün Tipi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Fiyat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FiPackage className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-secondary-500 font-mono">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{product.category_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{product.product_type_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {product.available_quantity || 0} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockStatusBadge(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        <div>Satış: ₺{product.unit_price || 0}</div>
                        <div className="text-secondary-500">Maliyet: ₺{product.cost_price || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Detayları Görüntüle"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Düzenle"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="text-error-600 hover:text-error-900"
                          title="Sil"
                        >
                          <FiTrash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Ürünü Sil</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="text-secondary-400 hover:text-secondary-600"
                disabled={deleting}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="w-6 h-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-secondary-900">
                    Ürünü silmek istediğinizden emin misiniz?
                  </h4>
                  <p className="text-sm text-secondary-600 mt-1">
                    Bu işlem geri alınamaz.
                  </p>
                </div>
              </div>

              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiPackage className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-secondary-900">
                      {productToDelete.name}
                    </div>
                    <div className="text-sm text-secondary-500">
                      SKU: {productToDelete.sku}
                    </div>
                    <div className="text-xs text-secondary-400">
                      {productToDelete.category_name || 'Kategori yok'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="btn-secondary"
                disabled={deleting}
              >
                İptal
              </button>
              <button
                onClick={handleDeleteProduct}
                className="btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

