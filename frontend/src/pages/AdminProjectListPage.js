import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import { FaPlus, FaEdit, FaFilter, FaCalendarAlt, FaUser } from 'react-icons/fa';

// API fonksiyonları
const fetchProjects = async (status = '') => {
  const params = status ? { status } : {};
  const response = await axios.get('/api/projects', { params });
  return response.data;
};

const deleteProject = async (id) => {
  await axios.delete(`/api/projects/${id}`);
};

// Durum renkleri
const getStatusColor = (status) => {
  switch (status) {
    case 'planning':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Durum metinleri
const getStatusText = (status) => {
  switch (status) {
    case 'planning':
      return 'Planlama';
    case 'in_progress':
      return 'Devam Ediyor';
    case 'completed':
      return 'Tamamlandı';
    case 'cancelled':
      return 'İptal Edildi';
    default:
      return status;
  }
};

const AdminProjectListPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState(''); // '', 'all', 'inactive'

  // Projeleri getir - status filtresine göre
  const {
    data: projects = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['projects', statusFilter], // Status değiştiğinde yeniden fetch et
    queryFn: () => fetchProjects(statusFilter)
  });

  // Silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Başarılı silme sonrası cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      console.log('Proje başarıyla silindi!');
    },
    onError: (error) => {
      console.error('Proje silinirken hata oluştu:', error);
      alert('Proje silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // Silme işlemini başlat
  const handleDelete = (projectId) => {
    if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(projectId);
    }
  };

  // Filtre değiştirme
  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  // Durum badge'i (aktif/pasif)
  const getActiveBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Pasif
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
          <p>Projeler yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sayfa başlığı ve kontroller */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin - Proje Yönetimi</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
          <FaPlus className="mr-2" />
          Yeni Proje
        </button>
      </div>

      {/* Filtre butonları */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Durum Filtresi:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => handleFilterChange('inactive')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pasif
            </button>
          </div>
        </div>
      </div>

      {/* Proje tablosu */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proje Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktif/Pasif
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proje Durumu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Başlangıç Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bitiş Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bütçe
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  {statusFilter === 'inactive' 
                    ? 'Pasif proje bulunmuyor.' 
                    : statusFilter === 'all'
                    ? 'Hiç proje bulunmuyor.'
                    : 'Aktif proje bulunmuyor.'
                  }
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaUser className="mr-2 text-gray-400" size={12} />
                      {project.client_name || 'Belirtilmemiş'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActiveBadge(project.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendarAlt className="mr-2 text-gray-400" size={12} />
                      {new Date(project.start_date).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.end_date ? (
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" size={12} />
                        {new Date(project.end_date).toLocaleDateString('tr-TR')}
                      </div>
                    ) : (
                      <span className="text-gray-400">Belirtilmemiş</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.budget ? (
                      `₺${project.budget.toLocaleString('tr-TR')}`
                    ) : (
                      <span className="text-gray-400">Belirtilmemiş</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* Düzenle butonu */}
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                        <FaEdit className="mr-1" size={12} />
                        Düzenle
                      </button>
                      
                      {/* DeleteButton bileşeni */}
                      <DeleteButton
                        onClick={() => handleDelete(project.id)}
                        isLoading={deleteMutation.isPending}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toplam proje sayısı ve filtre bilgisi */}
      <div className="mt-4 text-sm text-gray-600">
        {statusFilter === 'inactive' && (
          <span>Toplam {projects.length} pasif proje listeleniyor.</span>
        )}
        {statusFilter === 'all' && (
          <span>Toplam {projects.length} proje (aktif + pasif) listeleniyor.</span>
        )}
        {statusFilter === '' && (
          <span>Toplam {projects.length} aktif proje listeleniyor.</span>
        )}
      </div>
    </div>
  );
};

export default AdminProjectListPage;