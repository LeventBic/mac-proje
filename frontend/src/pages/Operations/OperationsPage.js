import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OperationsPage = () => {
  const [operations, setOperations] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('operations');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    operation_type: 'assembly',
    estimated_duration: '',
    required_skills: '',
    equipment_needed: '',
    safety_requirements: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    try {
      // Simüle edilmiş operasyon verileri
      const mockOperations = [
        {
          id: 1,
          name: 'Montaj Operasyonu A',
          description: 'Ana ürün montaj işlemi',
          operation_type: 'assembly',
          estimated_duration: 120,
          status: 'active',
          required_skills: 'Montaj, Kalite Kontrol',
          equipment_needed: 'Montaj Tezgahı, Tornavida Seti',
          safety_requirements: 'Güvenlik Gözlüğü, İş Eldiveni',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Kalite Kontrol',
          description: 'Ürün kalite kontrolü ve test işlemleri',
          operation_type: 'quality_control',
          estimated_duration: 60,
          status: 'active',
          required_skills: 'Kalite Kontrol, Ölçüm',
          equipment_needed: 'Test Cihazları, Kumpas',
          safety_requirements: 'Güvenlik Gözlüğü',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Paketleme',
          description: 'Ürün paketleme ve etiketleme',
          operation_type: 'packaging',
          estimated_duration: 30,
          status: 'active',
          required_skills: 'Paketleme',
          equipment_needed: 'Paketleme Makinesi, Etiket Yazıcı',
          safety_requirements: 'İş Eldiveni',
          created_at: new Date().toISOString()
        }
      ];

      const mockWorkOrders = [
        {
          id: 1,
          work_order_number: 'WO-2024-001',
          operation_id: 1,
          operation_name: 'Montaj Operasyonu A',
          production_order_id: 1,
          assigned_to: 'Ahmet Yılmaz',
          status: 'in_progress',
          priority: 'high',
          planned_start: new Date().toISOString(),
          planned_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          actual_start: new Date().toISOString(),
          actual_end: null,
          progress: 65,
          notes: 'Montaj işlemi devam ediyor'
        },
        {
          id: 2,
          work_order_number: 'WO-2024-002',
          operation_id: 2,
          operation_name: 'Kalite Kontrol',
          production_order_id: 1,
          assigned_to: 'Fatma Demir',
          status: 'pending',
          priority: 'medium',
          planned_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          planned_end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          actual_start: null,
          actual_end: null,
          progress: 0,
          notes: 'Montaj tamamlandıktan sonra başlayacak'
        },
        {
          id: 3,
          work_order_number: 'WO-2024-003',
          operation_id: 3,
          operation_name: 'Paketleme',
          production_order_id: 2,
          assigned_to: 'Mehmet Kaya',
          status: 'completed',
          priority: 'low',
          planned_start: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          planned_end: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          actual_start: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actual_end: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          progress: 100,
          notes: 'Başarıyla tamamlandı'
        }
      ];

      setOperations(mockOperations);
      setWorkOrders(mockWorkOrders);
      setLoading(false);
    } catch (err) {
      setError('Veri alınamadı');
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Yeni operasyon ekleme simülasyonu
      const newOperation = {
        id: operations.length + 1,
        ...form,
        status: 'active',
        created_at: new Date().toISOString()
      };
      setOperations([...operations, newOperation]);
      setShowForm(false);
      setForm({
        name: '',
        description: '',
        operation_type: 'assembly',
        estimated_duration: '',
        required_skills: '',
        equipment_needed: '',
        safety_requirements: ''
      });
    } catch (err) {
      setError('Operasyon eklenemedi');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    const labels = {
      'pending': 'Bekliyor',
      'in_progress': 'Devam Ediyor',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
      'active': 'Aktif',
      'inactive': 'Pasif'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    const labels = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getOperationTypeBadge = (type) => {
    const colors = {
      'assembly': 'bg-blue-100 text-blue-800',
      'machining': 'bg-purple-100 text-purple-800',
      'quality_control': 'bg-green-100 text-green-800',
      'packaging': 'bg-orange-100 text-orange-800',
      'inspection': 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      'assembly': 'Montaj',
      'machining': 'İşleme',
      'quality_control': 'Kalite Kontrol',
      'packaging': 'Paketleme',
      'inspection': 'Muayene'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Operasyonlar</h1>
          <p className="text-secondary-600">Üretim operasyonları ve iş emirlerini yönetin</p>
        </div>
        {activeTab === 'operations' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Yeni Operasyon
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'operations', label: 'Operasyonlar' },
            { key: 'work-orders', label: 'İş Emirleri' },
            { key: 'schedule', label: 'Planlama' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h3 className="font-semibold mb-4">Yeni Operasyon Ekle</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Operasyon Adı *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Operasyon Tipi</label>
              <select
                name="operation_type"
                value={form.operation_type}
                onChange={handleFormChange}
                className="input w-full"
              >
                <option value="assembly">Montaj</option>
                <option value="machining">İşleme</option>
                <option value="quality_control">Kalite Kontrol</option>
                <option value="packaging">Paketleme</option>
                <option value="inspection">Muayene</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Açıklama</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              className="input w-full"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">Tahmini Süre (dakika)</label>
              <input
                type="number"
                name="estimated_duration"
                value={form.estimated_duration}
                onChange={handleFormChange}
                className="input w-full"
                min="1"
              />
            </div>
            <div>
              <label className="block mb-1">Gerekli Yetenekler</label>
              <input
                type="text"
                name="required_skills"
                value={form.required_skills}
                onChange={handleFormChange}
                className="input w-full"
                placeholder="Virgülle ayırın"
              />
            </div>
            <div>
              <label className="block mb-1">Gerekli Ekipman</label>
              <input
                type="text"
                name="equipment_needed"
                value={form.equipment_needed}
                onChange={handleFormChange}
                className="input w-full"
                placeholder="Virgülle ayırın"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Güvenlik Gereksinimleri</label>
            <input
              type="text"
              name="safety_requirements"
              value={form.safety_requirements}
              onChange={handleFormChange}
              className="input w-full"
              placeholder="Virgülle ayırın"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-success">Kaydet</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">İptal</button>
          </div>
        </form>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'operations' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Operasyon Listesi</h3>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Operasyon Adı</th>
                    <th>Tip</th>
                    <th>Tahmini Süre</th>
                    <th>Durum</th>
                    <th>Gerekli Yetenekler</th>
                    <th>Ekipman</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map(operation => (
                    <tr key={operation.id} className="border-b hover:bg-gray-50">
                      <td className="font-medium">{operation.name}</td>
                      <td>{getOperationTypeBadge(operation.operation_type)}</td>
                      <td>{operation.estimated_duration} dk</td>
                      <td>{getStatusBadge(operation.status)}</td>
                      <td className="max-w-xs truncate">{operation.required_skills}</td>
                      <td className="max-w-xs truncate">{operation.equipment_needed}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-xs btn-outline">Düzenle</button>
                          <button className="btn btn-xs btn-outline">Detay</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'work-orders' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">İş Emirleri</h3>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>İş Emri No</th>
                    <th>Operasyon</th>
                    <th>Atanan Kişi</th>
                    <th>Durum</th>
                    <th>Öncelik</th>
                    <th>İlerleme</th>
                    <th>Planlanan Başlangıç</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map(order => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="font-mono">{order.work_order_number}</td>
                      <td>{order.operation_name}</td>
                      <td>{order.assigned_to}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{getPriorityBadge(order.priority)}</td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${order.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{order.progress}%</span>
                        </div>
                      </td>
                      <td>{new Date(order.planned_start).toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-xs btn-outline">Başlat</button>
                          <button className="btn btn-xs btn-outline">Detay</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Operasyon Planlaması</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">Bugün</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {workOrders.filter(w => w.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-blue-600">Aktif İş Emri</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Bekleyen</h4>
                  <div className="text-2xl font-bold text-yellow-600">
                    {workOrders.filter(w => w.status === 'pending').length}
                  </div>
                  <div className="text-sm text-yellow-600">İş Emri</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800">Tamamlanan</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {workOrders.filter(w => w.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-600">İş Emri</div>
                </div>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <p>Detaylı planlama takvimi yakında eklenecek...</p>
                <p className="text-sm mt-2">Gantt chart ve kaynak planlaması özellikleri geliştirilmektedir.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsPage; 