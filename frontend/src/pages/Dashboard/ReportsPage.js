import React, { useState, useEffect } from 'react';
import { apiCall } from '../../config/api';

const tabs = [
  { key: 'stock', label: 'Stok Raporu' },
  { key: 'production', label: 'Üretim Raporu' },
  { key: 'sales', label: 'Satış Raporu' },
];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await apiCall(`/api/dashboard/${activeTab}`);
        setData(response || []);
        setLoading(false);
      } catch (error) {
        setError('Veri alınamadı');
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Raporlar</h1>
        <p className="text-secondary-600">Stok, üretim ve satış raporlarını görüntüleyin</p>
      </div>
      <div className="flex space-x-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="card p-4">
        {loading && <div>Yükleniyor...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            {activeTab === 'stock' && (
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>SKU</th>
                    <th>Birim</th>
                    <th>Stok</th>
                    <th>Birim Fiyat</th>
                    <th>Stok Değeri</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id} className="border-b">
                      <td>{row.name}</td>
                      <td>{row.sku}</td>
                      <td>{row.unit}</td>
                      <td>{row.available_quantity}</td>
                      <td>{row.unit_price}</td>
                      <td>{row.stock_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'production' && (
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Emir No</th>
                    <th>BOM</th>
                    <th>Miktar</th>
                    <th>Durum</th>
                    <th>Öncelik</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id} className="border-b">
                      <td>{row.order_number}</td>
                      <td>{row.bom_name}</td>
                      <td>{row.planned_quantity}</td>
                      <td>{row.status}</td>
                      <td>{row.priority}</td>
                      <td>{row.actual_start_date ? new Date(row.actual_start_date).toLocaleString() : '-'}</td>
                      <td>{row.actual_end_date ? new Date(row.actual_end_date).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'sales' && (
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th>Sipariş No</th>
                    <th>Müşteri</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Tutar</th>
                    <th>KDV</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id} className="border-b">
                      <td>{row.order_number}</td>
                      <td>{row.customer_name}</td>
                      <td>{row.order_date ? new Date(row.order_date).toLocaleDateString() : '-'}</td>
                      <td>{row.status}</td>
                      <td>{row.total_amount}</td>
                      <td>{row.tax_amount}</td>
                      <td>{row.total_with_tax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;