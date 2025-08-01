import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiPackage,
  FiX,
  FiEye,
} from 'react-icons/fi';
import { useForm } from 'react-hook-form';
// import toast from 'react-hot-toast';
import {
  useProducts,
  useCategories,
  useProductTypes,
  // useSuppliers,
  useCreateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';

const ProductsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [showCategoryModal, setShowCategoryModal] = useState(false);
  // const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('all');
  const navigate = useNavigate();

  // React Query hooks
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts({
    search: searchTerm,
    category_id: selectedCategory,
    product_type_id: productType !== 'all' ? productType : undefined,
  });

  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();
  const { data: productTypesData, isLoading: productTypesLoading } =
    useProductTypes();
  // const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers();

  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Extract data from API responses
  const products = productsData?.data?.products || productsData?.data || [];
  const categories =
    categoriesData?.data?.categories || categoriesData?.data || [];
  const productTypes =
    productTypesData?.data?.productTypes || productTypesData?.data || [];
  // const suppliers = suppliersData?.data?.suppliers || suppliersData?.data || [];

  const loading = productsLoading || categoriesLoading || productTypesLoading;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // const {
  //   register: registerCategory,
  //   handleSubmit: handleSubmitCategory,
  //   reset: resetCategory,
  //   formState: { errors: errorsCategory },
  // } = useForm();

  // const {
  //   register: registerProductType,
  //   handleSubmit: handleSubmitProductType,
  //   reset: resetProductType,
  //   formState: { errors: errorsProductType },
  // } = useForm();

  const handleCreateProduct = async data => {
    try {
      await createProductMutation.mutateAsync(data);
      setShowCreateModal(false);
      reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const openDeleteModal = product => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // const handleCreateCategory = async (data) => {
  //   try {
  //     // This would need a category creation hook
  //     toast.success('Kategori oluşturma özelliği yakında eklenecek');
  //     setShowCategoryModal(false);
  //     resetCategory();
  //   } catch (error) {
  //     console.error('Error creating category:', error);
  //   }
  // };

  // const handleCreateProductType = async (data) => {
  //   try {
  //     // This would need a product type creation hook
  //     toast.success('Ürün tipi oluşturma özelliği yakında eklenecek');
  //     setShowProductTypeModal(false);
  //     resetProductType();
  //   } catch (error) {
  //     console.error('Error creating product type:', error);
  //   }
  // };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">
          Ürünler yüklenirken hata oluştu: {productsError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> Yeni Ürün
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Arama
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ürün adı veya kodu..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ürün Tipi
            </label>
            <select
              value={productType}
              onChange={e => setProductType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Tipler</option>
              {productTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ürün
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Ürün bulunamadı
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {product.image_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              product.image_url.startsWith('http')
                                ? product.image_url
                                : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${product.image_url}`
                            }
                            alt={product.name}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                            <FiPackage className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {product.category?.name || 'Kategori Yok'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ₺{parseFloat(product.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {product.current_stock || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Görüntüle"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Düzenle"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Yeni Ürün Oluştur
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleCreateProduct)}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Ürün adı gereklidir' })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <input
                  type="text"
                  {...register('sku', { required: 'SKU gereklidir' })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.sku.message}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <select
                  {...register('category_id')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Birim Fiyat
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('unit_price')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createProductMutation.isLoading
                    ? 'Oluşturuluyor...'
                    : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Ürünü Sil</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>{productToDelete.name}</strong> ürününü silmek
                istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleteProductMutation.isLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProductMutation.isLoading ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
