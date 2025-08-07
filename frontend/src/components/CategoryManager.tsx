import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '../hooks/useCategories';
import { toast } from 'react-hot-toast';

const CategoryManager: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // React Query hooks
  const { data: categories, isLoading, error, refetch } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Yeni kategori ekleme
  const handleAddCategory = async (e: React.FormEvent) => {
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
      setIsAddingCategory(false);
      
      toast.success('Kategori başarıyla eklendi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kategori eklenirken hata oluştu');
    }
  };

  // Kategori düzenleme
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsAddingCategory(false);
  };

  // Kategori güncelleme
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('Kategori adı gereklidir');
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        name: editingCategory.name.trim(),
        description: editingCategory.description?.trim() || undefined,
        is_active: editingCategory.is_active
      });
      
      setEditingCategory(null);
      toast.success('Kategori başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kategori güncellenirken hata oluştu');
    }
  };

  // Düzenlemeyi iptal et
  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  // Kategori silme
  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      toast.success('Kategori başarıyla silindi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kategori silinirken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Kategoriler yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Hata</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Kategoriler yüklenirken hata oluştu.</p>
              <button 
                onClick={() => refetch()}
                className="mt-2 text-red-800 underline hover:text-red-900"
              >
                Tekrar dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Kategori Yönetimi</h2>
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              {isAddingCategory ? 'İptal' : 'Yeni Kategori'}
            </button>
          </div>
        </div>

        {/* Kategori ekleme/düzenleme formu */}
        {(isAddingCategory || editingCategory) && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                      type="text"
                      id="categoryName"
                      value={editingCategory ? editingCategory.name : newCategoryName}
                      onChange={(e) => {
                        if (editingCategory) {
                          setEditingCategory({ ...editingCategory, name: e.target.value });
                        } else {
                          setNewCategoryName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Kategori adını giriniz"
                      /* required */
                    />
                </div>
                <div>
                  <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    id="categoryDescription"
                    value={editingCategory ? (editingCategory.description || '') : newCategoryDescription}
                    onChange={(e) => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, description: e.target.value });
                      } else {
                        setNewCategoryDescription(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kategori açıklaması (opsiyonel)"
                  />
                </div>
              </div>
              {editingCategory && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCategory.is_active}
                      onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingCategory) {
                      handleCancelEdit();
                    } else {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                    }
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={editingCategory ? updateCategoryMutation.isPending : createCategoryMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCategory 
                    ? (updateCategoryMutation.isPending ? 'Güncelleniyor...' : 'Güncelle')
                    : (createCategoryMutation.isPending ? 'Ekleniyor...' : 'Ekle')
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kategori listesi */}
        <div className="px-6 py-4">
          {!categories || categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Kategori bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">İlk kategoriyi ekleyerek başlayın.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturulma Tarihi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            disabled={deleteCategoryMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteCategoryMutation.isPending ? 'Siliniyor...' : 'Sil'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;