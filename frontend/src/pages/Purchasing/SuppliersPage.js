import React, { useState } from 'react';
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiPhone,
  FiMail,
  FiMapPin,
  FiStar,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '../../hooks/useSuppliers';

const SupplierModal = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    tax_number: '',
    website: '',
    notes: '',
    status: 'active',
    rating: 5,
  });

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  React.useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        postal_code: supplier.postal_code || '',
        tax_number: supplier.tax_number || '',
        website: supplier.website || '',
        notes: supplier.notes || '',
        status: supplier.status || 'active',
        rating: supplier.rating || 5,
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        postal_code: '',
        tax_number: '',
        website: '',
        notes: '',
        status: 'active',
        rating: 5,
      });
    }
  }, [supplier]);

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (supplier) {
        await updateSupplierMutation.mutateAsync({
          id: supplier.id,
          data: formData,
        });
      } else {
        await createSupplierMutation.mutateAsync(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  const isLoading =
    createSupplierMutation.isLoading || updateSupplierMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {supplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tedarikçi Adı *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                İletişim Kişisi
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Adres
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Şehir
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ülke
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Posta Kodu
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Vergi Numarası
              </label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Durum
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Değerlendirme
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>
                    {rating} Yıldız
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notlar
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Kaydediliyor...' : supplier ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // React Query hooks
  const suppliersParams = {
    page: currentPage,
    limit: 10,
    search: searchTerm,
    status: statusFilter,
  };

  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
  } = useSuppliers(suppliersParams);

  const deleteSupplierMutation = useDeleteSupplier();

  // Extract data
  const suppliers = suppliersData?.data?.suppliers || [];
  const totalPages = suppliersData?.data?.pagination?.totalPages || 1;
  const stats = suppliersData?.data?.stats || {};

  const handleEdit = supplier => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (window.confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteSupplierMutation.mutateAsync(id);
        refetch();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
  };

  const handleSaveSupplier = () => {
    refetch();
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      default:
        return 'Bilinmiyor';
    }
  };

  const renderStars = rating => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <FiStar
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-current text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <FiX className="mr-2 text-red-500" />
              <span className="text-red-700">
                Tedarikçi verileri yüklenirken hata oluştu: {error.message}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                Tedarikçiler
              </h1>
              <p className="text-gray-600">Tedarikçi bilgilerini yönetin</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <FiPlus className="h-4 w-4" />
              <span>Yeni Tedarikçi</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Toplam Tedarikçi
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total || 0}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FiUsers className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Aktif Tedarikçi
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active || 0}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <FiCheck className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pasif Tedarikçi
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive || 0}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <FiX className="text-xl text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ortalama Puan
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.averageRating || 0}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <FiStar className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Tedarikçi ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                <FiFilter className="h-4 w-4" />
                <span>Temizle</span>
              </button>
            </div>
          </div>

          {/* Suppliers List */}
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
            ) : suppliers.length > 0 ? (
              <div className="space-y-4">
                {suppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center space-x-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {supplier.name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(supplier.status)}`}
                          >
                            {getStatusText(supplier.status)}
                          </span>
                          {renderStars(supplier.rating)}
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-3">
                          <div className="flex items-center space-x-2">
                            <FiUsers className="h-4 w-4" />
                            <span>
                              {supplier.contact_person ||
                                'İletişim kişisi belirtilmemiş'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiMail className="h-4 w-4" />
                            <span>
                              {supplier.email || 'E-posta belirtilmemiş'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiPhone className="h-4 w-4" />
                            <span>
                              {supplier.phone || 'Telefon belirtilmemiş'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiMapPin className="h-4 w-4" />
                            <span>
                              {supplier.city
                                ? `${supplier.city}, ${supplier.country || ''}`
                                : 'Adres belirtilmemiş'}
                            </span>
                          </div>
                          {supplier.website && (
                            <div className="flex items-center space-x-2">
                              <span>🌐</span>
                              <a
                                href={supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                          title="Düzenle"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          disabled={deleteSupplierMutation.isLoading}
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Sil"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tedarikçi bulunamadı
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Yeni bir tedarikçi ekleyerek başlayın.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Önceki
                </button>

                <span className="text-sm text-gray-700">
                  Sayfa {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Supplier Modal */}
        <SupplierModal
          isOpen={showModal}
          onClose={handleCloseModal}
          supplier={selectedSupplier}
          onSave={handleSaveSupplier}
        />
      </div>
    </div>
  );
};

export default SuppliersPage;
