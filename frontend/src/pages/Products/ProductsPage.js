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
  useCreateProductType,
} from '../../hooks/useProducts';
import { useCreateCategory } from '../../hooks/useCategories.ts';
import DeleteButton from '../../components/DeleteButton';
import EditButton from '../../components/EditButton.tsx';
import ProductForm from '../../components/ProductForm';
import { formatCurrency, formatQuantity } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const ProductsPage = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Kategori modal drag state'leri
  const [categoryModalPosition, setCategoryModalPosition] = useState({ x: 0, y: 0 });
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [categoryDragStart, setCategoryDragStart] = useState({ x: 0, y: 0 });
  // Ürün tipi modal drag state'leri
  const [productTypeModalPosition, setProductTypeModalPosition] = useState({ x: 0, y: 0 });
  const [isProductTypeDragging, setIsProductTypeDragging] = useState(false);
  const [productTypeDragStart, setProductTypeDragStart] = useState({ x: 0, y: 0 });
  // Kategori ekleme state'leri
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  // Ürün tipi ekleme state'leri
  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [newProductTypeName, setNewProductTypeName] = useState('');
  const [newProductTypeDescription, setNewProductTypeDescription] = useState('');
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
    page: currentPage,
    limit: itemsPerPage,
    status: 'all', // Tüm ürünleri getir (aktif + pasif)
  });

  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();
  const { data: productTypesData, isLoading: productTypesLoading } =
    useProductTypes();
  // const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers();

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createCategoryMutation = useCreateCategory();
  const createProductTypeMutation = useCreateProductType();

  // Extract data from API responses
  const products = productsData?.data?.products || productsData?.data || [];
  const pagination = productsData?.pagination || {};
  const categories =
    categoriesData?.data?.categories || categoriesData?.data || [];
  const productTypes =
    productTypesData?.data?.productTypes || productTypesData?.data || [];
  // const suppliers = suppliersData?.data?.suppliers || suppliersData?.data || [];

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, productType]);

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
    setSelectedProduct(product);
    setShowProductForm(true);
  };



  // Kategori modal drag fonksiyonları
  const handleCategoryMouseDown = (e) => {
    setIsCategoryDragging(true);
    setCategoryDragStart({
      x: e.clientX - categoryModalPosition.x,
      y: e.clientY - categoryModalPosition.y
    });
  };

  const handleCategoryMouseMove = (e) => {
    if (!isCategoryDragging) return;
    
    const newX = e.clientX - categoryDragStart.x;
    const newY = e.clientY - categoryDragStart.y;
    
    const maxX = window.innerWidth - 500;
    const maxY = window.innerHeight - 400;
    
    setCategoryModalPosition({
      x: Math.max(-200, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleCategoryMouseUp = () => {
    setIsCategoryDragging(false);
  };

  // Ürün tipi modal drag fonksiyonları
  const handleProductTypeMouseDown = (e) => {
    setIsProductTypeDragging(true);
    setProductTypeDragStart({
      x: e.clientX - productTypeModalPosition.x,
      y: e.clientY - productTypeModalPosition.y
    });
  };

  const handleProductTypeMouseMove = (e) => {
    if (!isProductTypeDragging) return;
    
    const newX = e.clientX - productTypeDragStart.x;
    const newY = e.clientY - productTypeDragStart.y;
    
    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - 400;
    
    setProductTypeModalPosition({
      x: Math.max(-200, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleProductTypeMouseUp = () => {
    setIsProductTypeDragging(false);
  };



  // Kategori modal mouse event listeners
  React.useEffect(() => {
    if (isCategoryDragging) {
      document.addEventListener('mousemove', handleCategoryMouseMove);
      document.addEventListener('mouseup', handleCategoryMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleCategoryMouseMove);
        document.removeEventListener('mouseup', handleCategoryMouseUp);
      };
    }
  }, [isCategoryDragging, categoryDragStart, categoryModalPosition]);

  // Ürün tipi modal mouse event listeners
  React.useEffect(() => {
    if (isProductTypeDragging) {
      document.addEventListener('mousemove', handleProductTypeMouseMove);
      document.addEventListener('mouseup', handleProductTypeMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProductTypeMouseMove);
        document.removeEventListener('mouseup', handleProductTypeMouseUp);
      };
    }
  }, [isProductTypeDragging, productTypeDragStart, productTypeModalPosition]);

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

  // Kategori ekleme fonksiyonu
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error('Kategori adı gereklidir');
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      });
      
      // Form temizle
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCategoryForm(false);
      
      toast.success('Kategori başarıyla eklendi');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kategori eklenirken hata oluştu');
    }
  };

  const handleCreateProductType = async () => {
    try {
      if (!newProductTypeName.trim()) {
        toast.error('Ürün tipi adı gereklidir');
        return;
      }
      
      await createProductTypeMutation.mutateAsync({
        name: newProductTypeName.trim(),
        description: newProductTypeDescription.trim() || undefined
      });
      
      // Form'u temizle ve modalı kapat
      setNewProductTypeName('');
      setNewProductTypeDescription('');
      setShowProductTypeModal(false);
      setProductTypeModalPosition({ x: 0, y: 0 });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

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
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          <FiPlus /> Yeni Ürün
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Kategori Ekle"
              >
                <FiPlus />
              </button>
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ürün Tipi
            </label>
            <div className="flex gap-2">
              <select
                value={productType}
                onChange={e => setProductType(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Tipler</option>
                {productTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowProductTypeModal(true)}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Ürün Tipi Ekle"
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full table-fixed divide-y divide-gray-200" style={{minWidth: '1200px'}}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '22%'}}>
                Ürün
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '8%'}}>
                Marka
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '10%'}}>
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '8%'}}>
                Stok
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '16%'}}>
                Tedarikçi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '12%'}}>
                Barkod
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '8%'}}>
                Alış Fiyatı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '8%'}}>
                Satış Fiyatı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '6%'}}>
                Durum
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" style={{width: '8%'}}>
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
                  <td className="px-4 py-4 overflow-hidden" style={{width: '22%'}}>
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
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 truncate" style={{width: '8%'}}>
                    {product.brand || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 truncate" style={{width: '10%'}}>
                    {product.category?.name || 'Kategori Yok'}
                  </td>
                  <td className="px-4 py-4" style={{width: '8%'}}>
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{formatQuantity(product.current_stock)}</span>
                      {product.reserved_stock > 0 && (
                        <div className="text-xs text-orange-600">
                          Rezerve: {formatQuantity(product.reserved_stock)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 truncate" style={{width: '16%'}}>
                    {product.supplier_name || product.supplier?.name || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900" style={{width: '12%'}}>
                    <div className="truncate">
                      {product.barcode && (
                        <div className="text-xs font-mono truncate">{product.barcode}</div>
                      )}
                      {product.qr_code && (
                        <div className="text-xs text-gray-500 truncate">QR: {product.qr_code}</div>
                      )}
                      {!product.barcode && !product.qr_code && '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900" style={{width: '8%'}}>
                    {formatCurrency(product.cost_price)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900" style={{width: '8%'}}>
                    {formatCurrency(product.unit_price)}
                  </td>
                  <td className="px-4 py-4" style={{width: '6%'}}>
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
                  <td className="px-4 py-4 text-center text-sm font-medium" style={{width: '8%'}}>
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-red-600 hover:text-red-900 p-1"
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

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages || 1, currentPage + 1))}
              disabled={currentPage >= (pagination.pages || 1)}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Toplam <span className="font-medium">{pagination.total || 0}</span> ürün
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">İlk Sayfa</span>
                  {'<<'}
                </button>
                {/* Önceki sayfa butonu */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {'<'}
                </button>
                
                {/* Önceki sayfa numarası (varsa) */}
                {currentPage > 1 && (
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    {currentPage - 1}
                  </button>
                )}
                
                {/* Mevcut sayfa */}
                <button
                  className="relative z-10 inline-flex items-center bg-red-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  {currentPage}
                </button>
                
                {/* Sonraki sayfa numarası (varsa) */}
                {currentPage < (pagination.pages || 1) && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    {currentPage + 1}
                  </button>
                )}
                
                {/* Sonraki sayfa butonu */}
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages || 1, currentPage + 1))}
                  disabled={currentPage >= (pagination.pages || 1)}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {'>'}
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.pages || 1)}
                  disabled={currentPage >= (pagination.pages || 1)}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Son Sayfa</span>
                  {'>>'}
                </button>
              </nav>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> -{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, pagination.total || 0)}
                </span>{' '}
                arası gösteriliyor
              </p>
            </div>
          </div>
        </div>
      )}

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



      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md bg-white rounded-lg shadow-xl"
            style={{
              transform: `translate(${categoryModalPosition.x}px, ${categoryModalPosition.y}px)`,
              cursor: isCategoryDragging ? 'grabbing' : 'default'
            }}
          >
            <div className="p-6">
              <div 
                className="flex items-center justify-between mb-6 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleCategoryMouseDown}
              >
                <h2 className="text-xl font-semibold text-gray-900 pointer-events-none">
                  Yeni Kategori Ekle
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setCategoryModalPosition({ x: 0, y: 0 });
                  }}
                  className="text-gray-400 hover:text-gray-600 pointer-events-auto"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Kategori adı"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={e => setNewCategoryDescription(e.target.value)}
                    placeholder="Açıklama (isteğe bağlı)"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {createCategoryMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Tipi Ekleme Modalı */}
      {showProductTypeModal && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div 
            className="w-96 rounded-md border bg-white p-5 shadow-lg"
            style={{
              transform: `translate(${productTypeModalPosition.x}px, ${productTypeModalPosition.y}px)`,
              cursor: isProductTypeDragging ? 'grabbing' : 'default'
            }}
          >
            <div 
              className="mb-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleProductTypeMouseDown}
            >
              <h3 className="text-lg font-medium text-gray-900 pointer-events-none">Yeni Ürün Tipi</h3>
              <button
                onClick={() => {
                  setShowProductTypeModal(false);
                  setNewProductTypeName('');
                  setNewProductTypeDescription('');
                  setProductTypeModalPosition({ x: 0, y: 0 });
                }}
                className="text-gray-400 hover:text-gray-600 pointer-events-auto"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateProductType();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Tipi Adı
                  </label>
                  <input
                    type="text"
                    value={newProductTypeName}
                    onChange={e => setNewProductTypeName(e.target.value)}
                    placeholder="Ürün tipi adını girin"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newProductTypeDescription}
                    onChange={e => setNewProductTypeDescription(e.target.value)}
                    placeholder="Açıklama (isteğe bağlı)"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductTypeModal(false);
                      setNewProductTypeName('');
                      setNewProductTypeDescription('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={createProductTypeMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {createProductTypeMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && productToDelete && (        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
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
