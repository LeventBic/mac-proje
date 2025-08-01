import React, { useState } from 'react';
import {
  useBOMs,
  useBOMProducts,
  useBOMRawMaterials,
  useAvailableSubBOMs,
  useCreateBOM,
  useUpdateBOM,
  useDeleteBOM,
  useUpdateProfitMargin,
  useBOMTree,
} from '../../hooks/useBOM';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDollarSign,
  FiGitBranch,
  FiAlertTriangle,
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

const BOMPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [selectedBomTree, setSelectedBomTree] = useState(null);
  const [profitMarginForm, setProfitMarginForm] = useState({
    bomId: null,
    profitMargin: 0,
  });
  const [form, setForm] = useState({
    finished_product_id: '',
    parent_bom_id: '',
    version: '1.0',
    profit_margin: 0,
    notes: '',
    items: [],
  });

  // React Query hooks
  const {
    data: bomsData,
    isLoading: bomsLoading,
    error: bomsError,
  } = useBOMs();
  const { data: productsData, isLoading: productsLoading } = useBOMProducts();
  const { data: materialsData, isLoading: materialsLoading } =
    useBOMRawMaterials();
  const { data: availableSubBomsData } = useAvailableSubBOMs(editingBom?.id);
  const { data: bomTreeData } = useBOMTree(selectedBomTree, {
    enabled: !!selectedBomTree,
  });

  // Mutations
  const createBomMutation = useCreateBOM();
  const updateBomMutation = useUpdateBOM();
  const deleteBomMutation = useDeleteBOM();
  const updateProfitMarginMutation = useUpdateProfitMargin();

  // Extract data
  const boms = bomsData?.data || [];
  const products = productsData?.data?.products || [];
  const materials = materialsData?.data?.products || [];
  const availableSubBoms = availableSubBomsData?.data || [];
  const bomTree = bomTreeData?.data;
  const loading = bomsLoading || productsLoading || materialsLoading;

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Reset opposite field when item_type changes
    if (field === 'item_type') {
      if (value === 'material') {
        newItems[index].sub_bom_id = '';
      } else if (value === 'sub_bom') {
        newItems[index].raw_material_id = '';
      }
    }

    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          item_type: 'material',
          raw_material_id: '',
          sub_bom_id: '',
          quantity: 1,
          unit: 'pcs',
          notes: '',
        },
      ],
    });
  };

  const removeItem = index => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingBom) {
        await updateBomMutation.mutateAsync({ id: editingBom.id, ...form });
      } else {
        await createBomMutation.mutateAsync(form);
      }
      setShowForm(false);
      setEditingBom(null);
      resetForm();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const resetForm = () => {
    setForm({
      finished_product_id: '',
      parent_bom_id: '',
      version: '1.0',
      profit_margin: 0,
      notes: '',
      items: [],
    });
  };

  const handleEdit = bom => {
    setEditingBom(bom);
    setForm({
      finished_product_id: bom.finished_product_id || '',
      parent_bom_id: bom.parent_bom_id || '',
      version: bom.version || '1.0',
      profit_margin: bom.profit_margin || 0,
      notes: bom.notes || '',
      items: [], // Items will be loaded separately if needed
    });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (window.confirm('Bu reçeteyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteBomMutation.mutateAsync(id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleShowTree = bomId => {
    setSelectedBomTree(bomId);
    setShowTreeModal(true);
  };

  const handleShowProfitModal = bom => {
    setProfitMarginForm({
      bomId: bom.id,
      profitMargin: bom.profit_margin || 0,
    });
    setShowProfitModal(true);
  };

  const handleUpdateProfitMargin = async e => {
    e.preventDefault();
    try {
      await updateProfitMarginMutation.mutateAsync({
        id: profitMarginForm.bomId,
        profitMargin: profitMarginForm.profitMargin,
      });
      setShowProfitModal(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };



  const renderBomTree = (bomNode, level = 0) => {
    if (!bomNode) return null;

    const indent = level * 20;
    return (
      <div
        key={bomNode.id}
        style={{ marginLeft: `${indent}px` }}
        className="mb-2"
      >
        <div className="flex items-center gap-2 rounded bg-gray-50 p-2">
          <span className="font-medium">{bomNode.product_name}</span>
          <span className="text-sm text-gray-600">({bomNode.product_sku})</span>
          <span className="text-sm text-green-600">
            {formatCurrency(bomNode.final_cost)}
          </span>
          <span className="text-xs text-gray-500">Seviye {level}</span>
        </div>
        {bomNode.items?.map(item => {
          if (item.item_type === 'sub_bom' && item.sub_bom_tree) {
            return renderBomTree(item.sub_bom_tree, level + 1);
          } else {
            return (
              <div
                key={item.id}
                style={{ marginLeft: `${indent + 20}px` }}
                className="flex items-center gap-2 p-1 text-sm"
              >
                <span>{item.item_name}</span>
                <span className="text-gray-600">
                  x{item.quantity} {item.unit}
                </span>
                <span className="text-green-600">
                  {formatCurrency(item.total_cost)}
                </span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (bomsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="mr-2 text-red-500" />
              <span className="text-red-700">
                Reçete verileri yüklenirken hata oluştu: {bomsError.message}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-4 h-8 rounded bg-gray-200"></div>
            <div className="mb-6 h-12 rounded bg-gray-200"></div>
            <div className="space-y-4">
              <div className="h-16 rounded bg-gray-200"></div>
              <div className="h-16 rounded bg-gray-200"></div>
              <div className="h-16 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reçete Yönetimi (Product Tree)
              </h1>
              <p className="text-gray-600">
                Hiyerarşik reçete yapısı ile malzeme ve alt reçetelerinizi
                yönetin
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingBom(null);
                resetForm();
              }}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <FiPlus className="h-4 w-4" />
              <span>Yeni Reçete</span>
            </button>
          </div>
        </div>

        {/* BOMs Table */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Reçeteler
            </h2>
            {boms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Ürün
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Versiyon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Temel Maliyet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Kar Marjı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Final Maliyet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Üst Reçete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {boms.map(bom => (
                      <tr key={bom.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bom.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bom.product_sku}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {bom.version}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(bom.base_cost)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          %{bom.profit_margin || 0}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                          {formatCurrency(bom.final_cost)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {bom.parent_product_name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleShowTree(bom.id)}
                              className="flex items-center space-x-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                            >
                              <FiGitBranch className="h-3 w-3" />
                              <span>Ağaç</span>
                            </button>
                            <button
                              onClick={() => handleShowProfitModal(bom)}
                              className="flex items-center space-x-1 rounded bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-700"
                            >
                              <FiDollarSign className="h-3 w-3" />
                              <span>Kar</span>
                            </button>
                            <button
                              onClick={() => handleEdit(bom)}
                              className="flex items-center space-x-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                            >
                              <FiEdit className="h-3 w-3" />
                              <span>Düzenle</span>
                            </button>
                            <button
                              onClick={() => handleDelete(bom.id)}
                              className="flex items-center space-x-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            >
                              <FiTrash2 className="h-3 w-3" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <FiGitBranch className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Reçete yok
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Henüz reçete oluşturulmamış.
                </p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingBom(null);
                    resetForm();
                  }}
                  className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  İlk Reçeteyi Oluştur
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit BOM Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900">
                  {editingBom ? 'Reçete Düzenle' : 'Yeni Reçete Oluştur'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Ürün *
                      </label>
                      <select
                        name="finished_product_id"
                        value={form.finished_product_id}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Ürün Seçiniz</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Üst Reçete
                      </label>
                      <select
                        name="parent_bom_id"
                        value={form.parent_bom_id}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Üst Reçete Yok</option>
                        {availableSubBoms.map(bom => (
                          <option key={bom.id} value={bom.id}>
                            {bom.product_name} (v{bom.version})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Versiyon *
                      </label>
                      <input
                        type="text"
                        name="version"
                        value={form.version}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Kar Marjı (%)
                      </label>
                      <input
                        type="number"
                        name="profit_margin"
                        value={form.profit_margin}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Notlar
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleFormChange}
                        rows={2}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Reçete ile ilgili notlar..."
                      />
                    </div>
                  </div>

                  {/* BOM Items */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-md font-medium text-gray-900">
                        Reçete Kalemleri
                      </h3>
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center space-x-1 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                      >
                        <FiPlus className="h-3 w-3" />
                        <span>Kalem Ekle</span>
                      </button>
                    </div>

                    {form.items.map((item, index) => (
                      <div
                        key={index}
                        className="mb-4 rounded-lg border border-gray-200 p-4"
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Tip
                            </label>
                            <select
                              value={item.item_type}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'item_type',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="material">Malzeme</option>
                              <option value="sub_bom">Alt Reçete</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              {item.item_type === 'material'
                                ? 'Malzeme'
                                : 'Alt Reçete'}
                            </label>
                            {item.item_type === 'material' ? (
                              <select
                                value={item.raw_material_id}
                                onChange={e =>
                                  handleItemChange(
                                    index,
                                    'raw_material_id',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="">Malzeme Seçin</option>
                                {materials.map(material => (
                                  <option key={material.id} value={material.id}>
                                    {material.name} ({material.sku})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={item.sub_bom_id}
                                onChange={e =>
                                  handleItemChange(
                                    index,
                                    'sub_bom_id',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="">Alt Reçete Seçin</option>
                                {availableSubBoms.map(bom => (
                                  <option key={bom.id} value={bom.id}>
                                    {bom.product_name} (v{bom.version})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Miktar
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Birim
                            </label>
                            <select
                              value={item.unit}
                              onChange={e =>
                                handleItemChange(index, 'unit', e.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pcs">Adet</option>
                              <option value="kg">Kg</option>
                              <option value="m">Metre</option>
                              <option value="m2">m²</option>
                              <option value="m3">m³</option>
                              <option value="lt">Litre</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="flex items-center space-x-1 rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                            >
                              <FiTrash2 className="h-3 w-3" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Notlar
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={e =>
                              handleItemChange(index, 'notes', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Kalem ile ilgili notlar..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 border-t pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createBomMutation.isPending ||
                        updateBomMutation.isPending
                      }
                      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createBomMutation.isPending ||
                      updateBomMutation.isPending
                        ? editingBom
                          ? 'Güncelleniyor...'
                          : 'Oluşturuluyor...'
                        : editingBom
                          ? 'Güncelle'
                          : 'Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* BOM Tree Modal */}
        {showTreeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Reçete Ağacı
                  </h2>
                  <button
                    onClick={() => setShowTreeModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {bomTree ? (
                  <div className="space-y-2">{renderBomTree(bomTree)}</div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">
                      Reçete ağacı yükleniyor...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profit Margin Modal */}
        {showProfitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Kar Marjı Güncelle
              </h2>
              <form onSubmit={handleUpdateProfitMargin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kar Marjı (%)
                  </label>
                  <input
                    type="number"
                    value={profitMarginForm.profitMargin}
                    onChange={e =>
                      setProfitMarginForm({
                        ...profitMarginForm,
                        profitMargin: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfitModal(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfitMarginMutation.isPending}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateProfitMarginMutation.isPending
                      ? 'Güncelleniyor...'
                      : 'Güncelle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMPage;
