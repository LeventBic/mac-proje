import React from 'react';
import DataTable from './DataTable';

// Demo component to showcase DataTable functionality
const DataTableDemo = () => {
  // Define columns with various types and custom renderers
  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '80px',
    },
    {
      key: 'name',
      title: 'Ürün Adı',
      width: '200px',
    },
    {
      key: 'sku',
      title: 'SKU',
      width: '150px',
    },
    {
      key: 'category',
      title: 'Kategori',
      width: '150px',
    },
    {
      key: 'brand',
      title: 'Marka',
      width: '150px',
    },
    {
      key: 'price',
      title: 'Fiyat',
      width: '120px',
      render: (value) => (
        <span className="font-semibold text-green-600">
          ₺{value?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'stock',
      title: 'Stok',
      width: '100px',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value > 50 ? 'bg-green-100 text-green-800' :
          value > 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'supplier',
      title: 'Tedarikçi',
      width: '180px',
    },
    {
      key: 'location',
      title: 'Konum',
      width: '150px',
    },
    {
      key: 'lastUpdated',
      title: 'Son Güncelleme',
      width: '180px',
      render: (value) => (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Durum',
      width: '120px',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'Aktif' ? 'bg-green-100 text-green-800' :
          value === 'Pasif' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      title: 'Açıklama',
      width: '250px',
    },
    {
      key: 'barcode',
      title: 'Barkod',
      width: '150px',
    },
    {
      key: 'weight',
      title: 'Ağırlık (kg)',
      width: '120px',
      render: (value) => `${value} kg`,
    },
    {
      key: 'dimensions',
      title: 'Boyutlar',
      width: '150px',
    },
    {
      key: 'actions',
      title: 'İşlemler',
      width: '150px',
      render: (_, _record) => (
        <div className="flex space-x-2">
          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            Düzenle
          </button>
          <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
            Sil
          </button>
        </div>
      ),
    },
  ];

  // Generate sample data with many rows and columns
  const generateSampleData = (count) => {
    const categories = ['Elektronik', 'Giyim', 'Ev & Yaşam', 'Spor', 'Kitap', 'Oyuncak', 'Kozmetik', 'Otomotiv'];
    const brands = ['Samsung', 'Apple', 'Nike', 'Adidas', 'Sony', 'LG', 'Philips', 'Bosch', 'Siemens', 'Arçelik'];
    const suppliers = ['Tedarikçi A Ltd.', 'Tedarikçi B A.Ş.', 'Tedarikçi C Ltd.', 'Tedarikçi D A.Ş.', 'Tedarikçi E Ltd.'];
    const locations = ['Depo 1', 'Depo 2', 'Depo 3', 'Mağaza A', 'Mağaza B', 'Mağaza C'];
    const statuses = ['Aktif', 'Pasif', 'Beklemede'];
    
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `Ürün ${index + 1} - ${categories[index % categories.length]} Ürünü`,
      sku: `SKU-${String(index + 1).padStart(6, '0')}`,
      category: categories[index % categories.length],
      brand: brands[index % brands.length],
      price: Math.floor(Math.random() * 10000) + 100,
      stock: Math.floor(Math.random() * 200),
      supplier: suppliers[index % suppliers.length],
      location: locations[index % locations.length],
      lastUpdated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: statuses[index % statuses.length],
      description: `Bu ürün ${categories[index % categories.length]} kategorisinde yer alan kaliteli bir üründür. Müşteri memnuniyeti garantili.`,
      barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      weight: (Math.random() * 50 + 0.1).toFixed(2),
      dimensions: `${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 50 + 10)} cm`,
    }));
  };

  const sampleData = generateSampleData(150); // Generate 150 rows of sample data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            DataTable Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu demo, yeniden kullanılabilir DataTable bileşenini göstermektedir. 
            Tablo çok sayıda sütuna sahiptir ve yatay kaydırma ile sayfalandırma özelliklerini test edebilirsiniz.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: '#de1717' }}>
            <h2 className="text-xl font-semibold text-white">
              Ürün Listesi ({sampleData.length} ürün)
            </h2>
          </div>
          
          <DataTable
            columns={columns}
            data={sampleData}
            pageSize={20}
            className="h-96"
          />
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Özellikler:
          </h3>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
            <li>Yatay kaydırma ile geniş tabloları görüntüleme</li>
            <li>Alt kısımda sabit (sticky) footer ile sayfalandırma</li>
            <li>Özel yatay kaydırma çubuğu ile kolay navigasyon</li>
            <li>Responsive tasarım ve dark mode desteği</li>
            <li>Özelleştirilebilir sütun genişlikleri ve render fonksiyonları</li>
            <li>TypeScript desteği ile tip güvenliği</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataTableDemo;