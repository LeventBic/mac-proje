import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductionDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moveForm, setMoveForm] = useState({ product_id: '', movement_type: 'material_consumed', quantity: '', unit_cost: '', location: '', notes: '' });
  const [products, setProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/production/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        setOrder(data.data.order);
        setMovements(data.data.movements);
        setLoading(false);
      })
      .catch(() => { setError('Veri alınamadı'); setLoading(false); });
    fetch('/api/products', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setProducts(data.data.products || []));
  }, [id]);

  const handleStart = () => {
    setActionLoading(true);
    fetch(`/api/production/${id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(() => window.location.reload())
      .catch(() => setActionLoading(false));
  };

  const handleComplete = () => {
    setActionLoading(true);
    fetch(`/api/production/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ produced_quantity: order.planned_quantity })
    })
      .then(res => res.json())
      .then(() => window.location.reload())
      .catch(() => setActionLoading(false));
  };

  const handleMoveChange = e => setMoveForm({ ...moveForm, [e.target.name]: e.target.value });

  const handleMoveSubmit = e => {
    e.preventDefault();
    setActionLoading(true);
    fetch(`/api/production/${id}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(moveForm)
    })
      .then(res => res.json())
      .then(() => window.location.reload())
      .catch(() => setActionLoading(false));
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!order) return <div>Üretim emri bulunamadı</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Üretim Emri Detayı</h1>
          <p className="text-secondary-600">{order.order_number} - {order.bom_name}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>Geri</button>
      </div>
      <div className="card p-4 space-y-2">
        <div><b>Durum:</b> {order.status}</div>
        <div><b>Planlanan Miktar:</b> {order.planned_quantity}</div>
        <div><b>Üretilen Miktar:</b> {order.produced_quantity}</div>
        <div><b>Öncelik:</b> {order.priority}</div>
        <div><b>Başlangıç:</b> {order.actual_start_date ? new Date(order.actual_start_date).toLocaleString() : '-'}</div>
        <div><b>Bitiş:</b> {order.actual_end_date ? new Date(order.actual_end_date).toLocaleString() : '-'}</div>
        <div><b>Notlar:</b> {order.notes}</div>
        {order.status === 'planned' && <button className="btn btn-success mt-2" onClick={handleStart} disabled={actionLoading}>Üretimi Başlat</button>}
        {order.status === 'in_progress' && <button className="btn btn-primary mt-2" onClick={handleComplete} disabled={actionLoading}>Üretimi Tamamla</button>}
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Üretim Hareketleri</h2>
        <table className="table-auto w-full text-sm">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Ürün</th>
              <th>Tip</th>
              <th>Miktar</th>
              <th>Birim Maliyet</th>
              <th>Lokasyon</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(mv => (
              <tr key={mv.id} className="border-b">
                <td>{new Date(mv.created_at).toLocaleString()}</td>
                <td>{mv.product_name}</td>
                <td>{mv.movement_type}</td>
                <td>{mv.quantity}</td>
                <td>{mv.unit_cost}</td>
                <td>{mv.location}</td>
                <td>{mv.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {order.status === 'in_progress' && (
        <form className="card p-4 space-y-4" onSubmit={handleMoveSubmit}>
          <h3 className="font-semibold mb-2">Üretim Hareketi Ekle</h3>
          <div>
            <label className="block mb-1">Ürün</label>
            <select name="product_id" value={moveForm.product_id} onChange={handleMoveChange} className="input w-full" required>
              <option value="">Seçiniz</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">Hareket Tipi</label>
            <select name="movement_type" value={moveForm.movement_type} onChange={handleMoveChange} className="input w-full">
              <option value="material_consumed">Malzeme Tüketimi</option>
              <option value="product_produced">Ürün Üretildi</option>
              <option value="waste_recorded">Fire Kaydı</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Miktar</label>
            <input type="number" name="quantity" value={moveForm.quantity} onChange={handleMoveChange} className="input w-full" required min="0.001" step="0.001" />
          </div>
          <div>
            <label className="block mb-1">Birim Maliyet</label>
            <input type="number" name="unit_cost" value={moveForm.unit_cost} onChange={handleMoveChange} className="input w-full" step="0.01" />
          </div>
          <div>
            <label className="block mb-1">Lokasyon</label>
            <input type="text" name="location" value={moveForm.location} onChange={handleMoveChange} className="input w-full" />
          </div>
          <div>
            <label className="block mb-1">Not</label>
            <input type="text" name="notes" value={moveForm.notes} onChange={handleMoveChange} className="input w-full" />
          </div>
          <button type="submit" className="btn btn-success" disabled={actionLoading}>Kaydet</button>
        </form>
      )}
    </div>
  );
};

export default ProductionDetailPage;
