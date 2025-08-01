import React, { useState } from 'react';
// import { toast } from 'react-hot-toast';
import {
  FiPlus,
  FiEdit,
  FiSearch,
  FiFilter,
  FiCalendar,
  // FiUser,
  FiDollarSign,
  // FiClock,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/useProjects';
import { useCustomers } from '../../hooks/useCustomers';
import { useUsers } from '../../hooks/useUsers';
import { formatCurrency } from '../../utils/formatters';
import DeleteButton from '../../components/DeleteButton';

const ProjectsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    description: '',
    customer_id: '',
    project_manager_id: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    planned_end_date: '',
    budget: '',
    notes: '',
  });

  // React Query hooks
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects({
    search: searchTerm,
    status: statusFilter,
    customer_id: customerFilter,
    page: currentPage,
  });

  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: usersData, isLoading: usersLoading } = useUsers();

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Extract data from API responses
  const projects = projectsData?.data?.projects || [];
  const customers = customersData?.data || [];
  const users = usersData?.data || [];
  const totalPages = projectsData?.data?.pagination?.totalPages || 1;
  const loading = projectsLoading || customersLoading || usersLoading;

  const statusOptions = [
    {
      value: 'planning',
      label: 'Planlama',
      color: 'bg-gray-100 text-gray-800',
    },
    { value: 'active', label: 'Aktif', color: 'bg-blue-100 text-blue-800' },
    {
      value: 'on_hold',
      label: 'Beklemede',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'completed',
      label: 'Tamamlandı',
      color: 'bg-green-100 text-green-800',
    },
    { value: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Düşük', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Orta', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Kritik', color: 'bg-red-100 text-red-800' },
  ];

  const resetForm = () => {
    setFormData({
      project_code: '',
      name: '',
      description: '',
      customer_id: '',
      project_manager_id: '',
      status: 'planning',
      priority: 'medium',
      start_date: '',
      planned_end_date: '',
      budget: '',
      notes: '',
    });
    setEditingProject(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (editingProject) {
        await updateProjectMutation.mutateAsync({
          id: editingProject.id,
          data: formData,
        });
      } else {
        await createProjectMutation.mutateAsync(formData);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleEdit = project => {
    setEditingProject(project);
    setFormData({
      project_code: project.project_code || '',
      name: project.name || '',
      description: project.description || '',
      customer_id: project.customer_id || '',
      project_manager_id: project.project_manager_id || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      planned_end_date: project.planned_end_date
        ? project.planned_end_date.split('T')[0]
        : '',
      budget: project.budget || '',
      notes: project.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async project => {
    if (
      window.confirm(
        `"${project.name}" projesini silmek istediğinizden emin misiniz?`
      )
    ) {
      try {
        await deleteProjectMutation.mutateAsync(project.id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCustomerFilter('');
    setCurrentPage(1);
  };

  const getStatusOption = status => {
    return (
      statusOptions.find(option => option.value === status) || statusOptions[0]
    );
  };

  const getPriorityOption = priority => {
    return (
      priorityOptions.find(option => option.value === priority) ||
      priorityOptions[1]
    );
  };



  const formatDate = dateString => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (projectsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <span className="text-red-700">
                Veri yüklenirken hata oluştu: {projectsError.message}
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Projeler</h1>
            <p className="text-gray-600">
              Tüm projeleri görüntüleyin ve yönetin
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <FiPlus className="mr-2" />
            Yeni Proje
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Proje Ara
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Proje adı veya kodu..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Durum
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Tüm Durumlar</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Müşteri
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                value={customerFilter}
                onChange={e => setCustomerFilter(e.target.value)}
              >
                <option value="">Tüm Müşteriler</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleSearch}
                className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <FiSearch className="mr-2" />
                Ara
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FiFilter />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Yükleniyor...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Proje bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Proje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Proje Yöneticisi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Öncelik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tarihler
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Bütçe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {projects.map(project => {
                      const statusOption = getStatusOption(project.status);
                      const priorityOption = getPriorityOption(
                        project.priority
                      );
                      const customer = customers.find(
                        c => c.id === project.customer_id
                      );
                      const manager = users.find(
                        u => u.id === project.project_manager_id
                      );

                      return (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {project.project_code}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {customer?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {manager?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusOption.color}`}
                            >
                              {statusOption.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${priorityOption.color}`}
                            >
                              {priorityOption.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiCalendar className="mr-1 text-gray-400" />
                              <span>
                                {formatDate(project.start_date)} -{' '}
                                {formatDate(project.planned_end_date)}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiDollarSign className="mr-1 text-gray-400" />
                              <span>
                                {project.budget
                                  ? formatCurrency(project.budget)
                                  : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(project)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiEdit />
                              </button>
                              <DeleteButton
                                onClick={() => handleDelete(project)}
                                isLoading={deleteProjectMutation.isPending}
                                size="sm"
                                variant="outline"
                                className="p-1"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sonraki
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Sayfa <span className="font-medium">{currentPage}</span>{' '}
                        / <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Project Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
            <div className="relative top-20 mx-auto w-full max-w-2xl rounded-md border bg-white p-5 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingProject ? 'Proje Düzenle' : 'Yeni Proje'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Proje Kodu *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.project_code}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          project_code: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Proje Adı *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Açıklama
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.description}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Müşteri *
                    </label>
                    <select
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.customer_id}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          customer_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Müşteri Seçin</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Proje Yöneticisi
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.project_manager_id}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          project_manager_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Yönetici Seçin</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Durum
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.status}
                      onChange={e =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Öncelik
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.priority}
                      onChange={e =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.start_date}
                      onChange={e =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Planlanan Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.planned_end_date}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          planned_end_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Bütçe (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.budget}
                      onChange={e =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notlar
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      value={formData.notes}
                      onChange={e =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createProjectMutation.isLoading ||
                      updateProjectMutation.isLoading
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createProjectMutation.isLoading ||
                    updateProjectMutation.isLoading
                      ? 'Kaydediliyor...'
                      : editingProject
                        ? 'Güncelle'
                        : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
