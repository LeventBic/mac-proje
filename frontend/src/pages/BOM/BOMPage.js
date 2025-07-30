import React, { useEffect, useState } from 'react';
import { apiCall } from '../../config/api';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiGitBranch } from 'react-icons/fi';

const BOMPage = () => {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableSubBoms, setAvailableSubBoms] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [selectedBomTree, setSelectedBomTree] = useState(null);
  const [profitMarginForm, setProfitMarginForm] = useState({ bomId: null, profitMargin: 0 });
  const [form, setForm] = useState({
    finished_product_id: '',
    parent_bom_id: '',
    version: '1.0',
    profit_margin: 0,
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bomResult, productsResult, rawMaterialsResult] = await Promise.all([
        apiCall('/api/bom'),
        apiCall('/api/products'),
        apiCall('/api/products?type=raw_material')
      ]);
      
      console.log('BOM Result:', bomResult); // Debug için
      setBoms(Array.isArray(bomResult.data) ? bomResult.data : []);
      setProducts(productsResult.data?.products || []);
      setMaterials(rawMaterialsResult.data?.products || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err); // Debug için
      setError('Veriler alınamadı');
      setBoms([]); // Hata durumunda boş array set et
      setLoading(false);
    }
  };

  const fetchAvailableSubBoms = async (excludeId = null) => {
    try {
      const url = excludeId ? `/api/bom/available-sub-boms/${excludeId}` : '/api/bom/available-sub-boms';
      const result = await apiCall(url);
      console.log('Available Sub BOMs Result:', result); // Debug için
      setAvailableSubBoms(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Alt reçeteler alınamadı:', err);
      setAvailableSubBoms([]); // Hata durumunda boş array set et
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Item type değiştiğinde diğer alanları temizle
    if (field === 'item_type') {
      newItems[index] = {
        ...newItems[index],
        raw_material_id: '',
        sub_bom_id: '',
        [field]: value
      };
    }
    
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, {
        item_type: 'material',
        raw_material_id: '',
        sub_bom_id: '',
        quantity: 1,
        unit: 'pcs',
        notes: ''
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingBom ? 'PUT' : 'POST';
      const url = editingBom ? `/api/bom/${editingBom.id}` : '/api/bom';
      
      const result = await apiCall(url, {
        method,
        body: JSON.stringify(form)
      });
      
      if (result.status === 'success') {
        setShowForm(false);
        setEditingBom(null);
        resetForm();
        fetchData();
      } else {
        setError(result.message || 'İşlem başarısız');
      }
    } catch (err) {
      setError('İşlem başarısız');
    }
  };

  const resetForm = () => {
    setForm({
      finished_product_id: '',
      parent_bom_id: '',
      version: '1.0',
      profit_margin: 0,
      notes: '',
      items: []
    });
  };

  const handleEdit = async (bom) => {
    try {
      const result = await apiCall(`/api/bom/${bom.id}`);
      if (result.status === 'success') {
        setEditingBom(bom);
        setForm({
          finished_product_id: result.data.bom.finished_product_id,
          parent_bom_id: result.data.bom.parent_bom_id || '',
          version: result.data.bom.version,
          profit_margin: result.data.bom.profit_margin || 0,
          notes: result.data.bom.notes || '',
          items: result.data.items.map(item => ({
            item_type: item.item_type,
            raw_material_id: item.raw_material_id || '',
            sub_bom_id: item.sub_bom_id || '',
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes || ''
          }))
        });
        await fetchAvailableSubBoms(bom.id);
        setShowForm(true);
      }
    } catch (err) {
      setError('BOM detayı alınamadı');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu reçeteyi silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiCall(`/api/bom/${id}`, { method: 'DELETE' });
        if (result.status === 'success') {
          fetchData();
        } else {
          setError(result.message || 'Silme başarısız');
        }
      } catch (err) {
        setError('Silme başarısız');
      }
    }
  };

  const handleShowTree = async (bomId) => {
    try {
      const result = await apiCall(`/api/bom/${bomId}/tree`);
      if (result.status === 'success') {
        setSelectedBomTree(result.data);
        setShowTreeModal(true);
      }
    } catch (err) {
      setError('Reçete ağacı alınamadı');
    }
  };

  const handleShowProfitModal = (bom) => {
    setProfitMarginForm({
      bomId: bom.id,
      profitMargin: bom.profit_margin || 0
    });
    setShowProfitModal(true);
  };

  const handleUpdateProfitMargin = async (e) => {
    e.preventDefault();
    try {
      const result = await apiCall(`/api/bom/${profitMarginForm.bomId}/profit-margin`, {
        method: 'PUT',
        body: JSON.stringify({ profit_margin: profitMarginForm.profitMargin })
      });
      
      if (result.status === 'success') {
        setShowProfitModal(false);
        fetchData();
      } else {
        setError(result.message || 'Kar marjı güncellenemedi');
      }
    } catch (err) {
      setError('Kar marjı güncellenemedi');
    }
  };

  const renderBomTree = (bomNode, level = 0) => {
    const indent = level * 20;
    return (
      <div key={bomNode.id} style={{ marginLeft: `${indent}px` }} className="mb-2">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <span className="font-medium">{bomNode.product_name}</span>
          <span className="text-sm text-gray-600">({bomNode.product_sku})</span>
          <span className="text-sm text-green-600">₺{bomNode.final_cost?.toFixed(2)}</span>
          <span className="text-xs text-gray-500">Seviye {level}</span>
        </div>
        {bomNode.items?.map(item => {
          if (item.item_type === 'sub_bom' && item.sub_bom_tree) {
            return renderBomTree(item.sub_bom_tree, level + 1);
          } else {
            return (
              <div key={item.id} style={{ marginLeft: `${indent + 20}px` }} className="flex items-center gap-2 p-1 text-sm">
                <span>{item.item_name}</span>
                <span className="text-gray-600">x{item.quantity} {item.unit}</span>
                <span className="text-green-600">₺{item.total_cost?.toFixed(2)}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Reçete Yönetimi (Product Tree)</h1>
          <p className="text-secondary-600">Hiyerarşik reçete yapısı ile malzeme ve alt reçetelerinizi yönetin</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2" 
          onClick={() => {
            setShowForm(true);
            setEditingBom(null);
            resetForm();
            fetchAvailableSubBoms();
          }}
        >
          <FiPlus /> Yeni Reçete
        </button>
      </div>

      {showForm && (
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-semibold">
            {editingBom ? 'Reçete Düzenle' : 'Yeni Reçete Oluştur'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ürün *</label>
                <select 
                  name="finished_product_id" 
                  value={form.finished_product_id} 
                  onChange={handleFormChange} 
                  className="input w-full" 
                  required
                >
                  <option value="">Ürün Seçiniz</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Üst Reçete</label>
                <select 
                  name="parent_bom_id" 
                  value={form.parent_bom_id} 
                  onChange={handleFormChange} 
                  className="input w-full"
                >
                  <option value="">Ana Reçete (Üst yok)</option>
                  {availableSubBoms.map(bom => (
                    <option key={bom.id} value={bom.id}>
                      {bom.product_name} (v{bom.version})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Versiyon</label>
                <input 
                  type="text" 
                  name="version" 
                  value={form.version} 
                  onChange={handleFormChange} 
                  className="input w-full" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Kar Marjı (%)</label>
                <input 
                  type="number" 
                  name="profit_margin" 
                  value={form.profit_margin} 
                  onChange={handleFormChange} 
                  className="input w-full" 
                  min="0" 
                  step="0.01"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notlar</label>
                <input 
                  type="text" 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleFormChange} 
                  className="input w-full" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Malzemeler ve Alt Reçeteler</h4>
                <button type="button" onClick={addItem} className="btn btn-sm btn-outline flex items-center gap-1">
                  <FiPlus /> Öğe Ekle
                </button>
              </div>
              
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg bg-gray-50">
                    <div>
                      <select 
                        value={item.item_type} 
                        onChange={(e) => handleItemChange(index, 'item_type', e.target.value)} 
                        className="input w-full text-sm"
                      >
                        <option value="material">Malzeme</option>
                        <option value="sub_bom">Alt Reçete</option>
                      </select>
                    </div>
                    
                    <div>
                      {item.item_type === 'material' ? (
                        <select 
                          value={item.raw_material_id} 
                          onChange={(e) => handleItemChange(index, 'raw_material_id', e.target.value)} 
                          className="input w-full text-sm" 
                          required
                        >
                          <option value="">Malzeme Seç</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        <select 
                          value={item.sub_bom_id} 
                          onChange={(e) => handleItemChange(index, 'sub_bom_id', e.target.value)} 
                          className="input w-full text-sm" 
                          required
                        >
                          <option value="">Alt Reçete Seç</option>
                          {availableSubBoms.map(bom => (
                            <option key={bom.id} value={bom.id}>
                              {bom.product_name} (v{bom.version})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div>
                      <input 
                        type="number" 
                        placeholder="Miktar" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                        className="input w-full text-sm" 
                        required 
                        min="0.001" 
                        step="0.001" 
                      />
                    </div>
                    
                    <div>
                      <input 
                        type="text" 
                        placeholder="Birim" 
                        value={item.unit} 
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)} 
                        className="input w-full text-sm" 
                      />
                    </div>
                    
                    <div>
                      <input 
                        type="text" 
                        placeholder="Not" 
                        value={item.notes} 
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)} 
                        className="input w-full text-sm" 
                      />
                    </div>
                    
                    <div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)} 
                        className="btn btn-sm btn-danger w-full flex items-center justify-center"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn btn-success">Kaydet</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Reçete Listesi</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Ürün</th>
                <th className="text-left p-2">Üst Reçete</th>
                <th className="text-left p-2">Versiyon</th>
                <th className="text-left p-2">Temel Maliyet</th>
                <th className="text-left p-2">Kar Marjı</th>
                <th className="text-left p-2">Nihai Maliyet</th>
                <th className="text-left p-2">Oluşturan</th>
                <th className="text-left p-2">Tarih</th>
                <th className="text-left p-2">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {boms.map(bom => (
                <tr key={bom.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{bom.product_name}</div>
                      <div className="text-xs text-gray-500">{bom.product_sku}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    {bom.parent_product_name ? (
                      <span className="text-sm text-blue-600">{bom.parent_product_name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Ana Reçete</span>
                    )}
                  </td>
                  <td className="p-2">{bom.version}</td>
                  <td className="p-2 text-green-600">₺{bom.base_cost?.toFixed(2) || '0.00'}</td>
                  <td className="p-2">{bom.profit_margin || 0}%</td>
                  <td className="p-2 font-medium text-green-700">₺{bom.final_cost?.toFixed(2) || '0.00'}</td>
                  <td className="p-2">{bom.created_by_username}</td>
                  <td className="p-2">{new Date(bom.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(bom)} 
                        className="btn btn-xs btn-outline flex items-center gap-1"
                        title="Düzenle"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleShowTree(bom.id)} 
                        className="btn btn-xs btn-info flex items-center gap-1"
                        title="Reçete Ağacı"
                      >
                        <FiGitBranch />
                      </button>
                      <button 
                        onClick={() => handleShowProfitModal(bom)} 
                        className="btn btn-xs btn-warning flex items-center gap-1"
                        title="Kar Marjı"
                      >
                        <FiDollarSign />
                      </button>
                      <button 
                        onClick={() => handleDelete(bom.id)} 
                        className="btn btn-xs btn-danger flex items-center gap-1"
                        title="Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reçete Ağacı Modal */}
      {showTreeModal && selectedBomTree && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reçete Ağacı - {selectedBomTree.product_name}</h3>
              <button 
                onClick={() => setShowTreeModal(false)} 
                className="btn btn-sm btn-outline"
              >
                Kapat
              </button>
            </div>
            <div className="space-y-2">
              {renderBomTree(selectedBomTree)}
            </div>
          </div>
        </div>
      )}

      {/* Kar Marjı Modal */}
      {showProfitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Kar Marjı Güncelle</h3>
            <form onSubmit={handleUpdateProfitMargin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Kar Marjı (%)</label>
                <input 
                  type="number" 
                  value={profitMarginForm.profitMargin} 
                  onChange={(e) => setProfitMarginForm({...profitMarginForm, profitMargin: e.target.value})} 
                  className="input w-full" 
                  min="0" 
                  step="0.01" 
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-success">Güncelle</button>
                <button 
                  type="button" 
                  onClick={() => setShowProfitModal(false)} 
                  className="btn btn-outline"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMPage;
