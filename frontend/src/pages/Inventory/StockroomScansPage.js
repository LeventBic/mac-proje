import React, { useState /*, useEffect, useRef */ } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiCamera,
  FiSearch,
  // FiPlus,
  // FiEdit2,
  // FiTrash2,
  // FiPackage,
  // FiBarChart,
  // FiEye,
  FiUpload,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '../../config/axiosClient';

const StockroomScansPage = () => {
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  // const [showStatsModal, setShowStatsModal] = useState(false);
  // const [selectedScan, setSelectedScan] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    scan_type: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 10,
  });
  const queryClient = useQueryClient();

  // Depo taramalarını getir
  const { data: scansData, isLoading } = useQuery({
    queryKey: ['stockroomScans', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axiosClient.get(`/stockroom-scans?${params}`);
      return response.data;
    },
  });

  // Yeni tarama kaydet
  const addScanMutation = useMutation({
    mutationFn: async data => {
      const response = await axiosClient.post('/stockroom-scans', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stockroomScans']);
      setShowScanModal(false);
      toast.success('Tarama başarıyla kaydedildi');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Toplu tarama kaydet
  const bulkScanMutation = useMutation({
    mutationFn: async data => {
      const response = await axiosClient.post('/stockroom-scans/bulk', data);
      return response.data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['stockroomScans']);
      setShowBulkModal(false);
      toast.success(`${data.data.length} tarama başarıyla kaydedildi`);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Barkod arama
  const lookupMutation = useMutation({
    mutationFn: async ({ barcode, location }) => {
      const params = new URLSearchParams({ location });
      const response = await axiosClient.get(
        `/stockroom-scans/lookup/${barcode}?${params}`
      );
      return response.data;
    },
  });

  const formatDate = dateString => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScanTypeText = type => {
    const types = {
      cycle_count: 'Döngüsel Sayım',
      spot_check: 'Spot Kontrol',
      receiving: 'Mal Kabul',
      shipping: 'Sevkiyat',
      transfer: 'Transfer',
      adjustment: 'Düzeltme',
    };
    return types[type] || type;
  };

  const getVarianceColor = variance => {
    if (variance === 0) return 'text-green-600';
    if (variance > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const ScanModal = () => {
    const [formData, setFormData] = useState({
      scan_type: 'spot_check',
      location: 'MAIN',
      barcode: '',
      quantity_found: '',
      expected_quantity: 0,
      notes: '',
    });
    const [productInfo, setProductInfo] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const handleBarcodeSearch = async () => {
      if (!formData.barcode) return;

      try {
        const result = await lookupMutation.mutateAsync({
          barcode: formData.barcode,
          location: formData.location,
        });

        setProductInfo(result.data);
        setFormData(prev => ({
          ...prev,
          expected_quantity: result.data.expected_quantity || 0,
        }));
      } catch (error) {
        setProductInfo(null);
        toast.error(error.message);
      }
    };

    const handleSubmit = e => {
      e.preventDefault();
      const submitData = {
        ...formData,
        product_id: productInfo?.product?.id || null,
        quantity_found: parseFloat(formData.quantity_found) || 0,
      };
      addScanMutation.mutate(submitData);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Yeni Tarama</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tarama Türü
                </label>
                <select
                  value={formData.scan_type}
                  onChange={e =>
                    setFormData({ ...formData, scan_type: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="spot_check">Spot Kontrol</option>
                  <option value="cycle_count">Döngüsel Sayım</option>
                  <option value="receiving">Mal Kabul</option>
                  <option value="shipping">Sevkiyat</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Düzeltme</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Lokasyon
                </label>
                <select
                  value={formData.location}
                  onChange={e =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="MAIN">Ana Depo</option>
                  <option value="WAREHOUSE_A">Depo A</option>
                  <option value="WAREHOUSE_B">Depo B</option>
                  <option value="PRODUCTION">Üretim</option>
                  <option value="SHIPPING">Sevkiyat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Barkod
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Barkod girin veya tarayın"
                  required
                />
                <button
                  type="button"
                  onClick={handleBarcodeSearch}
                  disabled={!formData.barcode || lookupMutation.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSearch className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsScanning(!isScanning)}
                  className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <FiCamera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {productInfo && (
              <div className="rounded-md bg-blue-50 p-4">
                <h4 className="font-medium text-blue-900">Ürün Bilgisi</h4>
                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Ürün:</span>{' '}
                    {productInfo.product.name}
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span>{' '}
                    {productInfo.product.sku}
                  </div>
                  <div>
                    <span className="font-medium">Birim:</span>{' '}
                    {productInfo.product.unit}
                  </div>
                  <div>
                    <span className="font-medium">Beklenen Stok:</span>{' '}
                    {productInfo.expected_quantity}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bulunan Miktar
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.quantity_found}
                  onChange={e =>
                    setFormData({ ...formData, quantity_found: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Beklenen Miktar
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.expected_quantity}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      expected_quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  readOnly={!!productInfo}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
                placeholder="İsteğe bağlı notlar..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowScanModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={addScanMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addScanMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const BulkScanModal = () => {
    const [bulkData, setBulkData] = useState({
      scan_type: 'spot_check',
      location: 'MAIN',
      scans: [],
    });
    const [csvInput, setCsvInput] = useState('');

    const parseCsvInput = () => {
      const lines = csvInput.trim().split('\n');
      const scans = lines
        .map(line => {
          const [barcode, quantity_found, expected_quantity = 0, notes = ''] =
            line.split(',');
          return {
            barcode: barcode?.trim(),
            quantity_found: parseFloat(quantity_found?.trim()) || 0,
            expected_quantity: parseFloat(expected_quantity?.trim()) || 0,
            notes: notes?.trim(),
          };
        })
        .filter(scan => scan.barcode);

      setBulkData(prev => ({ ...prev, scans }));
    };

    const handleSubmit = e => {
      e.preventDefault();
      if (bulkData.scans.length === 0) {
        toast.error('En az bir tarama verisi gerekli');
        return;
      }
      bulkScanMutation.mutate(bulkData);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Toplu Tarama</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tarama Türü
                </label>
                <select
                  value={bulkData.scan_type}
                  onChange={e =>
                    setBulkData({ ...bulkData, scan_type: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="spot_check">Spot Kontrol</option>
                  <option value="cycle_count">Döngüsel Sayım</option>
                  <option value="receiving">Mal Kabul</option>
                  <option value="shipping">Sevkiyat</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Lokasyon
                </label>
                <select
                  value={bulkData.location}
                  onChange={e =>
                    setBulkData({ ...bulkData, location: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="MAIN">Ana Depo</option>
                  <option value="WAREHOUSE_A">Depo A</option>
                  <option value="WAREHOUSE_B">Depo B</option>
                  <option value="PRODUCTION">Üretim</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                CSV Verisi
              </label>
              <textarea
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                rows="10"
                placeholder="barkod,bulunan_miktar,beklenen_miktar,notlar
1234567890,10,8,Normal
9876543210,5,5,OK"
              />
              <button
                type="button"
                onClick={parseCsvInput}
                className="mt-2 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Verileri Ayrıştır ({bulkData.scans.length} kayıt)
              </button>
            </div>

            {bulkData.scans.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Barkod
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Bulunan
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Beklenen
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Fark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bulkData.scans.map((scan, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{scan.barcode}</td>
                        <td className="px-4 py-2 text-sm">
                          {scan.quantity_found}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {scan.expected_quantity}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm font-medium ${getVarianceColor(scan.quantity_found - scan.expected_quantity)}`}
                        >
                          {scan.quantity_found - scan.expected_quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={
                  bulkScanMutation.isPending || bulkData.scans.length === 0
                }
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {bulkScanMutation.isPending
                  ? 'Kaydediliyor...'
                  : `${bulkData.scans.length} Kayıt Gönder`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Depo Taramaları</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FiCamera className="mr-2 h-4 w-4" />
            Yeni Tarama
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <FiUpload className="mr-2 h-4 w-4" />
            Toplu Tarama
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lokasyon
            </label>
            <select
              value={filters.location}
              onChange={e =>
                setFilters({ ...filters, location: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tüm Lokasyonlar</option>
              <option value="MAIN">Ana Depo</option>
              <option value="WAREHOUSE_A">Depo A</option>
              <option value="WAREHOUSE_B">Depo B</option>
              <option value="PRODUCTION">Üretim</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tarama Türü
            </label>
            <select
              value={filters.scan_type}
              onChange={e =>
                setFilters({ ...filters, scan_type: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tüm Türler</option>
              <option value="spot_check">Spot Kontrol</option>
              <option value="cycle_count">Döngüsel Sayım</option>
              <option value="receiving">Mal Kabul</option>
              <option value="shipping">Sevkiyat</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={e =>
                setFilters({ ...filters, date_from: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={e =>
                setFilters({ ...filters, date_to: e.target.value, page: 1 })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  location: '',
                  scan_type: '',
                  date_from: '',
                  date_to: '',
                  page: 1,
                  limit: 10,
                })
              }
              className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Tarama Listesi */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tür / Lokasyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Barkod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bulunan / Beklenen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fark
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tarayan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {scansData?.data?.scans?.map(scan => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatDate(scan.scan_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {getScanTypeText(scan.scan_type)}
                    </div>
                    <div className="text-sm text-gray-500">{scan.location}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {scan.product_name || 'Bilinmeyen Ürün'}
                    </div>
                    <div className="text-sm text-gray-500">{scan.sku}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
                    {scan.barcode}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {scan.quantity_found} / {scan.expected_quantity} {scan.unit}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`text-sm font-medium ${getVarianceColor(scan.variance_quantity)}`}
                    >
                      {scan.variance_quantity > 0 ? '+' : ''}
                      {scan.variance_quantity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {scan.first_name} {scan.last_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {scansData?.data?.pagination &&
          scansData.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      page: Math.max(1, filters.page - 1),
                    })
                  }
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      page: Math.min(
                        scansData.data.pagination.totalPages,
                        filters.page + 1
                      ),
                    })
                  }
                  disabled={
                    filters.page === scansData.data.pagination.totalPages
                  }
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Toplam{' '}
                    <span className="font-medium">
                      {scansData.data.pagination.totalItems}
                    </span>{' '}
                    kayıttan{' '}
                    <span className="font-medium">
                      {(filters.page - 1) * filters.limit + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-medium">
                      {Math.min(
                        filters.page * filters.limit,
                        scansData.data.pagination.totalItems
                      )}
                    </span>{' '}
                    arası gösteriliyor
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                    {Array.from(
                      { length: scansData.data.pagination.totalPages },
                      (_, i) => i + 1
                    ).map(page => (
                      <button
                        key={page}
                        onClick={() => setFilters({ ...filters, page })}
                        className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                          page === filters.page
                            ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Modal'lar */}
      {showScanModal && <ScanModal />}
      {showBulkModal && <BulkScanModal />}
    </div>
  );
};

export default StockroomScansPage;
