import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useEmployees,
  useDeleteEmployee,
  useExportEmployees,
  useEmployeeDepartments,
  useEmployeePositions
} from '../../hooks/useEmployees';
import { useForm } from 'react-hook-form';
import { FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2, FiFilter, FiX, FiChevronDown, FiUser } from 'react-icons/fi';
import EmployeeDetailModal from './components/EmployeeDetailModal';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form for filters
  const { register, watch, reset } = useForm({
    defaultValues: {
      search: '',
      department: '',
      position: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    }
  });
  
  const filters = watch();
  
  // Prepare query params
  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: 10,
      sortBy,
      sortOrder,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value && value.trim() !== '')
      )
    };
    return params;
  }, [currentPage, sortBy, sortOrder, filters]);
  
  // Queries
  const { data: employeesData, isLoading, error, refetch } = useEmployees(queryParams);
  const { data: departments } = useEmployeeDepartments();
  const { data: positions } = useEmployeePositions();
  
  // Mutations
  const deleteEmployeeMutation = useDeleteEmployee();
  const exportMutation = useExportEmployees();
  
  const employees = employeesData?.data || [];
  const totalPages = employeesData?.totalPages || 1;
  const totalCount = employeesData?.total || 0;
  
  // Handlers
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteEmployeeMutation.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };
  

  
  const handleExport = async (format = 'csv') => {
    try {
      await exportMutation.mutateAsync({ format, filters });
    } catch (error) {
      console.error('Export error:', error);
    }
  };
  
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };
  
  const clearFilters = () => {
    reset();
    setCurrentPage(1);
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Aktif', class: 'bg-success-100 text-success-800' },
      inactive: { label: 'Pasif', class: 'bg-secondary-100 text-secondary-800' },
      suspended: { label: 'Askıda', class: 'bg-warning-100 text-warning-800' },
      terminated: { label: 'İşten Çıkarıldı', class: 'bg-error-100 text-error-800' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'bg-secondary-100 text-secondary-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiX className="w-8 h-8 text-error-600" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Hata Oluştu</h3>
            <p className="text-secondary-600 mb-6">{error.message}</p>
            <button 
              onClick={() => refetch()} 
              className="btn-primary w-full"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-secondary-900">Çalışanlar</h1>
              <p className="text-secondary-600 mt-1">
                Toplam {totalCount} çalışan
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isLoading}
                className="btn-secondary inline-flex items-center justify-center"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                {exportMutation.isLoading ? 'Dışa Aktarılıyor...' : 'CSV Dışa Aktar'}
              </button>
              <button
                onClick={() => navigate('/employees/new')}
                className="btn-primary inline-flex items-center justify-center"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Yeni Çalışan
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  {...register('search')}
                  type="text"
                  placeholder="Ad, soyad veya email ile ara..."
                  className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary inline-flex items-center justify-center ${
                  showFilters ? 'bg-primary-50 text-primary-700 border-primary-300' : ''
                }`}
              >
                <FiFilter className="w-4 h-4 mr-2" />
                Filtreler
                <FiChevronDown className={`w-4 h-4 ml-2 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`} />
              </button>
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-secondary-200">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Departman
                  </label>
                  <select 
                    {...register('department')} 
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tüm Departmanlar</option>
                    {departments?.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Pozisyon
                  </label>
                  <select 
                    {...register('position')} 
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tüm Pozisyonlar</option>
                    {positions?.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Durum
                  </label>
                  <select 
                    {...register('status')} 
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="suspended">Askıda</option>
                    <option value="terminated">İşten Çıkarıldı</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-ghost w-full inline-flex items-center justify-center"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Temizle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-secondary-600">Çalışanlar yükleniyor...</p>
              </div>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <FiUser className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">Çalışan bulunamadı</h3>
              <p className="text-secondary-600 mb-6">Henüz hiç çalışan eklenmemiş veya arama kriterlerinize uygun çalışan bulunamadı.</p>
              <button
                onClick={() => navigate('/employees/new')}
                className="btn-primary inline-flex items-center"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                İlk Çalışanı Ekle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('firstName')}
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Çalışan</span>
                        {sortBy === 'firstName' && (
                          <span className={`text-primary-600 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                            ↑
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {sortBy === 'email' && (
                          <span className={`text-primary-600 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                            ↑
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Departman
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Pozisyon
                    </th>
                    <th 
                      onClick={() => handleSort('salary')}
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Maaş</span>
                        {sortBy === 'salary' && (
                          <span className={`text-primary-600 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                            ↑
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {employees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-secondary-50 cursor-pointer transition-colors"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {employee.profileImage ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={employee.profileImage} 
                                alt={`${employee.firstName} ${employee.lastName}`} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-secondary-500">
                              ID: {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {employee.position?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {employee.salary ? 
                          new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          }).format(employee.salary) : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/employees/${employee.id}/edit`)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded transition-colors"
                            title="Düzenle"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => setShowDeleteConfirm(employee.id)}
                            className="text-error-600 hover:text-error-900 p-1 rounded transition-colors"
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
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 mt-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-700">
                Sayfa {currentPage} / {totalPages} (Toplam {totalCount} kayıt)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  İlk
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Önceki
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Son
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center mr-3">
                <FiTrash2 className="w-5 h-5 text-error-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">Çalışanı Sil</h3>
            </div>
            <p className="text-secondary-600 mb-6">
              Bu çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteEmployeeMutation.isLoading}
                className="flex-1 bg-error-600 text-white px-4 py-2 rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
              >
                {deleteEmployeeMutation.isLoading ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEmployee(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            navigate(`/employees/${selectedEmployee.id}/edit`);
          }}
        />
      )}
    </div>
  );
};

export default EmployeesPage;