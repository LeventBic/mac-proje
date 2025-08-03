import React, { useState, useMemo } from 'react';
import {
  useBOMProducts,
  useBOMRawMaterials,
  useCreateBOM,
} from '../../hooks/useBOM';
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiChevronDown,
  FiChevronRight,
  FiBarChart,
  FiPackage,
} from 'react-icons/fi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

// BOM Tree Node Component
function BOMTreeNode({ node, level = 0, parentPath = '', bomTree, setBomTree, expandedNodes, setExpandedNodes, setEditingQuantity, editingQuantity, setShowProductSelector, showProductSelector, allProducts, addProductToNode }) {
  const nodeId = `${parentPath}-${node.id || node.tempId}`;
  const isExpanded = expandedNodes.has(nodeId);
  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 24;

  const toggleExpanded = () => {
    const newExpanded = new Set(expandedNodes);
    if (isExpanded) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateQuantity = (newQuantity) => {
    const updateNodeQuantity = (nodes, targetId) => {
      return nodes.map(n => {
        if ((n.id || n.tempId) === (node.id || node.tempId)) {
          return { ...n, quantity: parseFloat(newQuantity) || 0 };
        }
        if (n.children) {
          return { ...n, children: updateNodeQuantity(n.children, targetId) };
        }
        return n;
      });
    };
    setBomTree(updateNodeQuantity(bomTree, node.id || node.tempId));
    setEditingQuantity(null);
  };

  const removeNode = () => {
    const removeNodeFromTree = (nodes, targetId) => {
      return nodes.filter(n => (n.id || n.tempId) !== targetId)
        .map(n => ({
          ...n,
          children: n.children ? removeNodeFromTree(n.children, targetId) : []
        }));
    };
    setBomTree(removeNodeFromTree(bomTree, node.id || node.tempId));
  };

  const addChildNode = () => {
    setShowProductSelector(nodeId);
  };

  const unitCost = node.cost_price || node.unit_cost || 0;
  const totalLineCost = (node.quantity || 0) * unitCost;

  return (
    <div className="border-l-2 border-gray-200">
      <div 
        className="flex items-center py-2 px-4 hover:bg-gray-50 border-b border-gray-100"
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Level indicator */}
        <div className="w-16 text-xs text-gray-500 font-mono">
          {level === 0 ? '0' : `${level}.${node.position || 1}`}
        </div>

        {/* Expand/Collapse button */}
        <div className="w-8">
          {hasChildren && (
            <button
              onClick={toggleExpanded}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Product Code/ID */}
        <div className="w-32 text-sm font-medium text-gray-900">
          {node.sku || node.code || 'N/A'}
        </div>

        {/* Description */}
        <div className="flex-1 text-sm text-gray-700 px-2">
          {node.name || node.description || 'Ürün Adı'}
        </div>

        {/* Quantity (Editable) */}
        <div className="w-24">
          {editingQuantity === nodeId ? (
            <input
              type="number"
              defaultValue={node.quantity || 0}
              className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
              onBlur={(e) => updateQuantity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateQuantity(e.target.value);
                }
              }}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingQuantity(nodeId)}
              className="w-full text-left px-2 py-1 text-sm hover:bg-blue-50 rounded"
            >
              {formatNumber(node.quantity || 0, 2)}
            </button>
          )}
        </div>

        {/* Unit */}
        <div className="w-16 text-sm text-gray-600 text-center">
          {node.unit || 'adet'}
        </div>

        {/* Unit Cost */}
        <div className="w-24 text-sm text-gray-700 text-right">
          {formatCurrency(unitCost)}
        </div>

        {/* Total Line Cost */}
        <div className="w-28 text-sm font-medium text-green-600 text-right">
          {formatCurrency(totalLineCost)}
        </div>

        {/* Actions */}
        <div className="w-20 flex justify-end space-x-1">
          <button
            onClick={addChildNode}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Alt bileşen ekle"
          >
            <FiPlus className="w-4 h-4" />
          </button>
          <button
            onClick={removeNode}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Sil"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, index) => (
            <BOMTreeNode
              key={child.id || child.tempId || index}
              node={child}
              level={level + 1}
              parentPath={nodeId}
              bomTree={bomTree}
              setBomTree={setBomTree}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
              setEditingQuantity={setEditingQuantity}
              editingQuantity={editingQuantity}
              setShowProductSelector={setShowProductSelector}
              showProductSelector={showProductSelector}
              allProducts={allProducts}
              addProductToNode={addProductToNode}
            />
          ))}
        </div>
      )}

      {/* Product Selector for this node */}
      {showProductSelector === nodeId && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 ml-8">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Bileşen Seç</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {allProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addProductToNode(nodeId, product)}
                className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
              >
                <div className="text-xs font-medium text-gray-900">{product.sku}</div>
                <div className="text-xs text-gray-600 truncate">{product.name}</div>
                <div className="text-xs text-green-600">{formatCurrency(product.cost_price || 0)}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setShowProductSelector(null)}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const InteractiveBOMPage = () => {
  const [bomTree, setBomTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [profitMargin, setProfitMargin] = useState(0);
  const [bomName, setBomName] = useState('');
  const [bomDescription, setBomDescription] = useState('');
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [showNewBOMForm, setShowNewBOMForm] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(null);

  // React Query hooks
  const { data: productsData, isLoading: productsLoading } = useBOMProducts();
  const { data: materialsData, isLoading: materialsLoading } = useBOMRawMaterials();
  const createBomMutation = useCreateBOM();

  // Extract data
  const products = productsData?.data?.products || [];
  const materials = materialsData?.data?.products || [];
  const allProducts = [...products, ...materials];
  const loading = productsLoading || materialsLoading;

  // Add product to node function
  const addProductToNode = (nodeId, product) => {
    const addToNode = (nodes, targetNodeId) => {
      return nodes.map(node => {
        const currentNodeId = `${node.parentPath || ''}-${node.id || node.tempId}`;
        if (currentNodeId === targetNodeId) {
          const newChild = {
            tempId: Date.now() + Math.random(),
            ...product,
            quantity: 1,
            children: []
          };
          return {
            ...node,
            children: [...(node.children || []), newChild]
          };
        }
        if (node.children) {
          return {
            ...node,
            children: addToNode(node.children, targetNodeId)
          };
        }
        return node;
      });
    };

    setBomTree(addToNode(bomTree, nodeId));
    setShowProductSelector(null);
  };

  // Calculate total costs
  const calculateTotalCosts = useMemo(() => {
    const calculateNodeCost = (node) => {
      const unitCost = node.cost_price || node.unit_cost || 0;
      const quantity = node.quantity || 0;
      const lineCost = quantity * unitCost;
      
      let childrenCost = 0;
      if (node.children && node.children.length > 0) {
        childrenCost = node.children.reduce((sum, child) => {
          return sum + calculateNodeCost(child);
        }, 0);
      }
      
      return lineCost + childrenCost;
    };

    const totalMaterialCost = bomTree.reduce((sum, node) => {
      return sum + calculateNodeCost(node);
    }, 0);

    const profitAmount = totalMaterialCost * (profitMargin / 100);
    const finalSalesPrice = totalMaterialCost + profitAmount;

    return {
      totalMaterialCost,
      profitAmount,
      finalSalesPrice
    };
  }, [bomTree, profitMargin]);

  // Create new BOM
  const createNewBOM = () => {
    const newRootNode = {
      tempId: Date.now(),
      name: bomName || 'Yeni Ürün',
      sku: 'NEW-' + Date.now(),
      quantity: 1,
      unit: 'adet',
      cost_price: 0,
      children: []
    };
    setBomTree([newRootNode]);
    setExpandedNodes(new Set([`-${newRootNode.tempId}`]));
    setShowNewBOMForm(false);
  };

  // Save BOM
  const saveBOM = async () => {
    if (bomTree.length === 0) {
      alert('Reçete boş olamaz!');
      return;
    }

    try {
      const bomData = {
        finished_product_id: bomTree[0].id || null,
        version: '1.0',
        profit_margin: profitMargin,
        notes: bomDescription,
        items: flattenBOMTree(bomTree)
      };

      await createBomMutation.mutateAsync(bomData);
      alert('Reçete başarıyla kaydedildi!');
    } catch (error) {
      alert('Reçete kaydedilirken hata oluştu!');
    }
  };

  // Flatten BOM tree for API
  const flattenBOMTree = (nodes) => {
    const items = [];
    
    const processNode = (node) => {
      if (node.id && node.id !== bomTree[0]?.id) { // Skip root product
        items.push({
          item_type: 'material',
          raw_material_id: node.id,
          quantity: node.quantity || 1,
          unit: node.unit || 'adet',
          notes: ''
        });
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(processNode);
      }
    });
    
    return items;
  };

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
                İnteraktif Ürün Reçetesi (BOM)
              </h1>
              <p className="text-gray-600">
                Dinamik maliyet hesaplaması ve fiyat belirleme aracı
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewBOMForm(true)}
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <FiPlus className="h-4 w-4" />
                <span>Yeni Reçete</span>
              </button>
              {bomTree.length > 0 && (
                <button
                  onClick={saveBOM}
                  className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <FiSave className="h-4 w-4" />
                  <span>Kaydet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* BOM Tree Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiPackage className="mr-2" />
                  BOM Ağacı
                </h2>
                {bomTree.length > 0 && (
                  <div className="mt-2 flex items-center space-x-4">
                    <input
                      type="text"
                      value={bomName}
                      onChange={(e) => setBomName(e.target.value)}
                      placeholder="Reçete adı"
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={bomDescription}
                      onChange={(e) => setBomDescription(e.target.value)}
                      placeholder="Açıklama"
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>

              {bomTree.length > 0 ? (
                <div>
                  {/* Table Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="w-16">Seviye</div>
                      <div className="w-8"></div>
                      <div className="w-32">Ürün Kodu</div>
                      <div className="flex-1 px-2">Açıklama</div>
                      <div className="w-24 text-center">Miktar</div>
                      <div className="w-16 text-center">Birim</div>
                      <div className="w-24 text-right">Birim Maliyet</div>
                      <div className="w-28 text-right">Toplam Maliyet</div>
                      <div className="w-20"></div>
                    </div>
                  </div>

                  {/* Tree Content */}
                  <div className="max-h-96 overflow-y-auto">
                    {bomTree.map((node, index) => (
                      <BOMTreeNode
                        key={node.id || node.tempId || index}
                        node={node}
                        level={0}
                        parentPath=""
                        bomTree={bomTree}
                        setBomTree={setBomTree}
                        expandedNodes={expandedNodes}
                        setExpandedNodes={setExpandedNodes}
                        setEditingQuantity={setEditingQuantity}
                        editingQuantity={editingQuantity}
                        setShowProductSelector={setShowProductSelector}
                        showProductSelector={showProductSelector}
                        allProducts={allProducts}
                        addProductToNode={addProductToNode}
                      />
                    ))}
                  </div>

                  {/* Add Root Component Button */}
                  {showProductSelector === 'root' && (
                    <div className="bg-blue-50 border-t border-blue-200 p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Ana Bileşen Seç</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {allProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => {
                              const newNode = {
                                tempId: Date.now(),
                                ...product,
                                quantity: 1,
                                children: []
                              };
                              setBomTree([...bomTree, newNode]);
                              setShowProductSelector(null);
                            }}
                            className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                          >
                            <div className="text-xs font-medium text-gray-900">{product.sku}</div>
                            <div className="text-xs text-gray-600 truncate">{product.name}</div>
                            <div className="text-xs text-green-600">{formatCurrency(product.cost_price || 0)}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => setShowProductSelector(null)}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowProductSelector('root')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Ana Bileşen Ekle</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Reçete Boş
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Yeni bir reçete oluşturmak için "Yeni Reçete" butonuna tıklayın.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiBarChart className="mr-2" />
                  Maliyet Özeti
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Total Material Cost */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Toplam Malzeme Maliyeti</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(calculateTotalCosts.totalMaterialCost)}
                  </div>
                </div>

                {/* Profit Margin Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kâr Marjı (%)
                  </label>
                  <input
                    type="number"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.1"
                    placeholder="0"
                  />
                </div>

                {/* Profit Amount */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-700">Toplam Kâr Tutarı</div>
                  <div className="text-xl font-bold text-yellow-800">
                    {formatCurrency(calculateTotalCosts.profitAmount)}
                  </div>
                </div>

                {/* Final Sales Price */}
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="text-sm text-green-700">Nihai Satış Fiyatı</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(calculateTotalCosts.finalSalesPrice)}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Toplam Bileşen:</span>
                    <span className="font-medium">{formatNumber(bomTree.length, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kâr Oranı:</span>
                    <span className="font-medium">%{formatNumber(profitMargin, 1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New BOM Form Modal */}
        {showNewBOMForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Yeni Reçete Oluştur
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reçete Adı
                  </label>
                  <input
                    type="text"
                    value={bomName}
                    onChange={(e) => setBomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Ahşap Masa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={bomDescription}
                    onChange={(e) => setBomDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Reçete açıklaması..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewBOMForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={createNewBOM}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveBOMPage;