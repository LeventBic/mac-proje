import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../config/api';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stockMovements, setStockMovements] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const [productResult, movementsResult, bomsResult] = await Promise.all([
        apiCall(`/api/products/${id}`),
        apiCall(`/api/stock-movements?product_id=${id}`),
        apiCall(`/api/bom?product_id=${id}`)
      ]);

      const productData = productResult.data;
      const movementsData = movementsResult.data;
      const bomsData = bomsResult.data;

      if (productData.status === 'success') {
        setProduct(productData.data.product);
        setStockMovements(movementsData.data || []);
        setBoms(bomsData.data || []);
      } else {
        setError('Ürün bulunamadı');
      }
      setLoading(false);
    } catch (err) {
      setError('Veri alınamadı');
      setLoading(false);
    }
  };

  const getStockStatusBadge = (status) => {
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800',
      'overstock': 'bg-blue-100 text-blue-800'
    };
    const labels = {
      'in_stock': 'Stokta',
      'low_stock': 'Düşük Stok',
      'out_of_stock': 'Stok Yok',
      'overstock': 'Fazla Stok'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || 'Bilinmiyor'}
      </span>
    );
  };

  const getMovementTypeBadge = (type) => {
    const colors = {
      'in': 'bg-green-100 text-green-800',
      'out': 'bg-red-100 text-red-800',
      'adjustment': 'bg-blue-100 text-blue-800',
      'transfer': 'bg-purple-100 text-purple-800'
    };
    const labels = {
      'in': 'Giriş',
      'out': 'Çıkış',
      'adjustment': 'Düzeltme',
      'transfer': 'Transfer'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!product) return <div className="text-center py-8">Ürün bulunamadı</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{product.name}</h1>
          <p className="text-secondary-600">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/products/${id}/edit`)} className="btn btn-outline">
            Düzenle
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            Geri
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'info', label: 'Genel Bilgiler' },
            { key: 'stock', label: 'Stok Durumu' },
            { key: 'movements', label: 'Stok Hareketleri' },
            { key: 'bom', label: 'Malzeme Listesi' }
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

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ürün Bilgileri</h3>
              <div className="space-y-3">
                <div><span className="font-medium">SKU:</span> {product.sku}</div>
                <div><span className="font-medium">Ürün Adı:</span> {product.name}</div>
                <div><span className="font-medium">Açıklama:</span> {product.description || '-'}</div>
                <div><span className="font-medium">Barkod:</span> {product.barcode || '-'}</div>
                <div><span className="font-medium">Kategori:</span> {product.category_name || '-'}</div>
                <div><span className="font-medium">Birim:</span> {product.unit}</div>
                <div><span className="font-medium">Lokasyon:</span> {product.location || '-'}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Fiyat Bilgileri</h3>
              <div className="space-y-3">
                <div><span className="font-medium">Satış Fiyatı:</span> ₺{product.unit_price || 0}</div>
                <div><span className="font-medium">Maliyet Fiyatı:</span> ₺{product.cost_price || 0}</div>
                <div><span className="font-medium">Kar Marjı:</span> {product.unit_price && product.cost_price ? 
                  `₺${(product.unit_price - product.cost_price).toFixed(2)} (%${(((product.unit_price - product.cost_price) / product.unit_price) * 100).toFixed(1)})` : '-'}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Stok Seviyeleri</h3>
              <div className="space-y-3">
                <div><span className="font-medium">Min. Stok Seviyesi:</span> {product.min_stock_level}</div>
                <div><span className="font-medium">Max. Stok Seviyesi:</span> {product.max_stock_level || '-'}</div>
                <div><span className="font-medium">Yeniden Sipariş Noktası:</span> {product.reorder_point || '-'}</div>
                <div><span className="font-medium">Yeniden Sipariş Miktarı:</span> {product.reorder_quantity || '-'}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ürün Tipleri</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Ham Madde:</span>
                  <span className={`px-2 py-1 rounded text-xs ${product.is_raw_material ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_raw_material ? 'Evet' : 'Hayır'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Bitmiş Ürün:</span>
                  <span className={`px-2 py-1 rounded text-xs ${product.is_finished_product ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_finished_product ? 'Evet' : 'Hayır'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <h3 className="font-semibold mb-2">Mevcut Stok</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {product.available_quantity || 0}
              </div>
              <div className="text-sm text-gray-600">{product.unit}</div>
            </div>

            <div className="card p-6 text-center">
              <h3 className="font-semibold mb-2">Rezerve Stok</h3>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {product.reserved_quantity || 0}
              </div>
              <div className="text-sm text-gray-600">{product.unit}</div>
            </div>

            <div className="card p-6 text-center">
              <h3 className="font-semibold mb-2">Stok Durumu</h3>
              <div className="mb-2">
                {getStockStatusBadge(product.stock_status)}
              </div>
              <div className="text-sm text-gray-600">
                Stok Değeri: ₺{product.stock_value || 0}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Son Stok Hareketleri</h3>
            {stockMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Tip</th>
                      <th>Miktar</th>
                      <th>Referans</th>
                      <th>Lokasyon</th>
                      <th>Notlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.map(movement => (
                      <tr key={movement.id} className="border-b hover:bg-gray-50">
                        <td>{new Date(movement.created_at).toLocaleString()}</td>
                        <td>{getMovementTypeBadge(movement.movement_type)}</td>
                        <td className={movement.movement_type === 'out' ? 'text-red-600' : 'text-green-600'}>
                          {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity} {product.unit}
                        </td>
                        <td>{movement.reference_type}</td>
                        <td>{movement.location_to || movement.location_from || '-'}</td>
                        <td>{movement.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz stok hareketi bulunmuyor
              </div>
            )}
          </div>
        )}

        {activeTab === 'bom' && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Malzeme Listeleri (BOM)</h3>
            {boms.length > 0 ? (
              <div className="space-y-4">
                {boms.map(bom => (
                  <div key={bom.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{bom.name} (v{bom.version})</h4>
                      <button 
                        onClick={() => navigate(`/bom/${bom.id}`)}
                        className="btn btn-xs btn-outline"
                      >
                        Detay
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{bom.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bu ürün için henüz BOM tanımlanmamış
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
