import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../config/api';

const ProductionPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bom_id: '', planned_quantity: '', priority: 'medium', notes: '' });
  const [boms, setBoms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiCall('/api/production')
      .then(({ data }) => { setOrders(data.data || []); setLoading(false); })
      .catch(err => { setError('Veriler alınamadı'); setLoading(false); });
    apiCall('/api/bom')
      .then(({ data }) => setBoms(data.data || []));
  }, []);

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    apiCall('/api/production', {
      method: 'POST',
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setShowForm(false);
          setOrders(prev => [{ ...form, id: data.data.id, order_number: data.data.order_number, status: 'planned' }, ...prev]);
        } else {
          setError(data.message || 'Kayıt başarısız');
        }
      })
      .catch(() => setError('Kayıt başarısız'));
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Üretim Yönetimi</h1>
          <p className="text-secondary-600">Üretim emirlerini takip edin ve yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(f => !f)}>
          {showForm ? 'İptal' : 'Yeni Üretim Emri'}
        </button>
      </div>
      {showForm && (
        <form className="card p-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1">BOM</label>
            <select name="bom_id" value={form.bom_id} onChange={handleFormChange} className="input w-full" required>
              <option value="">Seçiniz</option>
              {boms.map(bom => <option key={bom.id} value={bom.id}>{bom.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">Planlanan Miktar</label>
            <input type="number" name="planned_quantity" value={form.planned_quantity} onChange={handleFormChange} className="input w-full" required min="1" />
          </div>
          <div>
            <label className="block mb-1">Öncelik</label>
            <select name="priority" value={form.priority} onChange={handleFormChange} className="input w-full">
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Notlar</label>
            <textarea name="notes" value={form.notes} onChange={handleFormChange} className="input w-full" />
          </div>
          <button type="submit" className="btn btn-success">Kaydet</button>
        </form>
      )}
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Üretim Emirleri</h2>
        <table className="table-auto w-full text-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>BOM</th>
              <th>Miktar</th>
              <th>Durum</th>
              <th>Öncelik</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td>{order.order_number}</td>
                <td>{order.bom_name}</td>
                <td>{order.planned_quantity}</td>
                <td>{order.status}</td>
                <td>{order.priority}</td>
                <td>{order.actual_start_date ? new Date(order.actual_start_date).toLocaleString() : '-'}</td>
                <td>{order.actual_end_date ? new Date(order.actual_end_date).toLocaleString() : '-'}</td>
                <td>
                  <button className="btn btn-xs btn-outline" onClick={() => navigate(`/production/${order.id}`)}>
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionPage;
