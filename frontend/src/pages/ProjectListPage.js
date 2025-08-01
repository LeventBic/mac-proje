import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import { FaPlus, FaEdit, FaCalendarAlt, FaUser } from 'react-icons/fa';

// API fonksiyonları
const fetchProjects = async () => {
  const response = await axios.get('/api/projects');
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

const ProjectListPage = () => {
  const queryClient = useQueryClient();

  // Projeleri getir
  const {
    data: projects = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });

  // Silme mutation'ı - ProductListPage ile aynı yapı, sadece endpoint farklı
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Başarılı silme sonrası cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Başarı mesajı gösterilebilir
      console.log('Proje başarıyla silindi!');
    },
    onError: (error) => {
      // Hata durumunda kullanıcıya bilgi ver
      console.error('Proje silinirken hata oluştu:', error);
      alert('Proje silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // Silme işlemini başlat - ProductListPage ile tamamen aynı mantık
  const handleDelete = (projectId) => {
    if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(projectId);
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
      {/* Sayfa başlığı ve yeni proje butonu */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projeler</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
          <FaPlus className="mr-2" />
          Yeni Proje
        </button>
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
                Durum
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
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Henüz proje bulunmuyor.
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
                      
                      {/* Aynı DeleteButton bileşeni - hiçbir değişiklik gerekmedi! */}
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

      {/* Toplam proje sayısı */}
      <div className="mt-4 text-sm text-gray-600">
        Toplam {projects.length} proje listeleniyor.
      </div>
    </div>
  );
};

export default ProjectListPage;