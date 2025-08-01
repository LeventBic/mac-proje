import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useProductionOrder, 
  useStartProductionOrder, 
  useCompleteProductionOrder, 
  useAddProductionMovement 
} from '../../hooks/useProduction';
import { useProducts } from '../../hooks/useProducts';
import toast from 'react-hot-toast';

const ProductionDetailPage = () => {
  const { id } = useParams();
  const [moveForm, setMoveForm] = useState({ product_id: '', movement_type: 'material_consumed', quantity: '', unit_cost: '', location: '', notes: '' });
  const navigate = useNavigate();

  // React Query hooks
  const { data: orderData, isLoading: orderLoading, error: orderError } = useProductionOrder(id);
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const startMutation = useStartProductionOrder();
  const completeMutation = useCompleteProductionOrder();
  const addMovementMutation = useAddProductionMovement();

  const order = orderData?.order;
  const movements = orderData?.movements || [];
  const products = productsData?.products || [];
  const loading = orderLoading || productsLoading;
  const error = orderError;

  const handleStart = () => {
    startMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Üretim başlatıldı');
        window.location.reload();
      },
      onError: () => {
        toast.error('Üretim başlatılamadı');
      }
    });
  };

  const handleComplete = () => {
    completeMutation.mutate({ id, produced_quantity: order.planned_quantity }, {
      onSuccess: () => {
        toast.success('Üretim tamamlandı');
        window.location.reload();
      },
      onError: () => {
        toast.error('Üretim tamamlanamadı');
      }
    });
  };

  const handleMoveChange = e => setMoveForm({ ...moveForm, [e.target.name]: e.target.value });

  const handleMoveSubmit = e => {
    e.preventDefault();
    addMovementMutation.mutate({ id, ...moveForm }, {
      onSuccess: () => {
        toast.success('Hareket eklendi');
        setMoveForm({ product_id: '', movement_type: 'material_consumed', quantity: '', unit_cost: '', location: '', notes: '' });
        window.location.reload();
      },
      onError: () => {
        toast.error('Hareket eklenemedi');
      }
    });
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
        {order.status === 'planned' && <button className="btn btn-success mt-2" onClick={handleStart} disabled={startMutation.isLoading}>Üretimi Başlat</button>}
        {order.status === 'in_progress' && <button className="btn btn-primary mt-2" onClick={handleComplete} disabled={completeMutation.isLoading}>Üretimi Tamamla</button>}
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
          <button type="submit" className="btn btn-success" disabled={addMovementMutation.isLoading}>Kaydet</button>
        </form>
      )}
    </div>
  );
};

export default ProductionDetailPage;
