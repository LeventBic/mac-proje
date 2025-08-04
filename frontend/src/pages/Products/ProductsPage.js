import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiPackage,
  FiX,
  FiEye,
} from 'react-icons/fi';
import {
  useProducts,
  useCategories,
  useProductTypes,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import DeleteButton from '../../components/DeleteButton';
import EditButton from '../../components/EditButton.tsx';
import ProductForm from '../../components/ProductForm';
import { formatCurrency, formatQuantity, formatPriceTR, parseFormattedNumber } from '../../utils/formatters';

const ProductsPage = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('all');
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Extract data from API responses
  const products = productsData?.data?.products || productsData?.data || [];
  const categories =
    categoriesData?.data?.categories || categoriesData?.data || [];
  const productTypes =
    productTypesData?.data?.productTypes || productTypesData?.data || [];
  // const suppliers = suppliersData?.data?.suppliers || suppliersData?.data || [];

  const loading = productsLoading || categoriesLoading || productTypesLoading;

  const handleProductSubmit = async (productData) => {
    try {
      if (selectedProduct) {
        await updateProductMutation.mutateAsync({
          id: selectedProduct.id,
          ...productData,
        });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      setShowProductForm(false);
      setSelectedProduct(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(false);
  };

  const handleUpdateProduct = async (productData) => {
    if (!editingProduct) return;
    
    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        ...productData
      });
      setEditingProduct(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setModalPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Ekran sınırları içinde tutma
    const maxX = window.innerWidth - 600; // modal genişliği
    const maxY = window.innerHeight - 400; // modal yüksekliği
    
    setModalPosition({
      x: Math.max(-200, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, modalPosition]);

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
          onClick={handleCreateProduct}
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
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ürün
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Marka
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Satış Fiyatı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Alış Fiyatı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stok
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tedarikçi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Barkod
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Durum
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                  Ürün bulunamadı
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0">
                        {product.image_url ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={
                              product.image_url.startsWith('http')
                                ? product.image_url
                                : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${product.image_url}`
                            }
                            alt={product.name}
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                            <FiPackage className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {product.brand || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {product.category?.name || 'Kategori Yok'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {formatCurrency(product.unit_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {formatCurrency(product.cost_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{formatQuantity(product.current_stock)}</span>
                      {product.reserved_stock > 0 && (
                        <div className="text-xs text-orange-600">
                          Rezerve: {formatQuantity(product.reserved_stock)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {product.supplier?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    <div>
                      {product.barcode && (
                        <div className="text-xs font-mono">{product.barcode}</div>
                      )}
                      {product.qr_code && (
                        <div className="text-xs text-gray-500">QR: {product.qr_code}</div>
                      )}
                      {!product.barcode && !product.qr_code && '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
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
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="İncele"
                        style={{ '--tooltip-delay': '0ms' }}
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <EditButton
                        onClick={() => handleEditProduct(product)}
                        size="sm"
                        variant="outline"
                        className="p-1"
                      />
                      <DeleteButton
                        onClick={() => openDeleteModal(product)}
                        isLoading={deleteProductMutation.isLoading}
                        size="sm"
                        variant="outline"
                        className="p-1"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
        isLoading={selectedProduct ? updateProductMutation.isPending : createProductMutation.isPending}
      />

      {/* Product Edit Form Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl bg-white rounded-lg shadow-xl"
            style={{
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
          >
            <div className="p-6">
              <div 
                className="flex items-center justify-between mb-6 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
              >
                <h2 className="text-xl font-semibold text-gray-900 pointer-events-none">
                  Ürün Düzenle: {editingProduct.name}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 pointer-events-auto"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const categoryId = formData.get('category_id');
                const productData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  sku: formData.get('sku'),
                  unit_price: parseFormattedNumber(formData.get('unit_price')) || 0,
                  cost_price: parseFormattedNumber(formData.get('cost_price')) || 0,
                  quantity_in_stock: parseFormattedNumber(formData.get('quantity_in_stock')) || 0,
                  category_id: categoryId && categoryId !== '' ? parseInt(categoryId, 10) : undefined,
                  is_active: formData.get('is_active') === 'on'
                };
                handleUpdateProduct(productData);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingProduct.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      defaultValue={editingProduct.sku}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marka
                    </label>
                    <input
                      type="text"
                      name="brand"
                      defaultValue={editingProduct.brand || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      name="category_id"
                      defaultValue={editingProduct.category_id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategori Seçin</option>
                      {categoriesData?.data?.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Satış Fiyatı (₺)
                    </label>
                    <input
                      type="text"
                      name="unit_price"
                      defaultValue={formatPriceTR(editingProduct.unit_price)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alış Fiyatı (₺)
                    </label>
                    <input
                      type="text"
                      name="cost_price"
                      defaultValue={formatPriceTR(editingProduct.cost_price)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stok Miktarı
                    </label>
                    <input
                      type="text"
                      name="current_stock"
                      defaultValue={formatPriceTR(editingProduct.current_stock, 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tedarikçi
                    </label>
                    <input
                      type="text"
                      name="supplier_name"
                      defaultValue={editingProduct.supplier?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barkod
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      defaultValue={editingProduct.barcode || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Kod
                    </label>
                    <input
                      type="text"
                      name="qr_code"
                      defaultValue={editingProduct.qr_code || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={editingProduct.is_active}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {updateProductMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                </div>
              </form>
            </div>
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
