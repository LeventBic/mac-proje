import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FiX, FiUpload, FiTrash2, FiInfo, FiImage } from 'react-icons/fi'
import { useCategories, useProductTypes, useSuppliers } from '../hooks/useProducts'

const ProductForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product = null, 
  isLoading = false 
}) => {
  const [images, setImages] = useState([])
  const [activeTab, setActiveTab] = useState('basic')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      brand: '',
      category_id: '',
      product_type_id: '',
      unit_price: '',
      purchase_price: '',
      currency_id: '',
      unit_id: '',
      current_stock: '',
      reserved_stock: '',
      ordered_stock: '',
      supplier_id: '',
      last_supplier_id: '',
      supplier_product_code: '',
      lead_time_days: '',
      location_id: '',
      barcode: '',
      qr_code: '',
      is_popular: false,
      is_raw_material: false,
      is_finished_product: false,
      price_increase_percentage: '',
      last_price_update: ''
    }
  })

  // Lookup data queries - using mock data for now
  const currencies = {
    data: [
      { id: 1, code: 'TRY', name: 'Türk Lirası' },
      { id: 2, code: 'USD', name: 'US Dollar' },
      { id: 3, code: 'EUR', name: 'Euro' }
    ]
  }
  
  const units = {
    data: [
      { id: 1, code: 'adet', name: 'Adet' },
      { id: 2, code: 'kg', name: 'Kilogram' },
      { id: 3, code: 'lt', name: 'Litre' },
      { id: 4, code: 'm', name: 'Metre' }
    ]
  }
  
  const locations = {
    data: [
      { id: 1, code: 'DEPO1', name: 'Ana Depo' },
      { id: 2, code: 'DEPO2', name: 'Yedek Depo' },
      { id: 3, code: 'MAGAZA', name: 'Mağaza' }
    ]
  }
  
  const { data: suppliersData } = useSuppliers()
  const { data: categoriesData } = useCategories()
  const { data: productTypesData } = useProductTypes()
  
  // Extract data from API responses
  const suppliers = suppliersData?.data?.suppliers || suppliersData?.data || []
  const categories = categoriesData?.data || []
  const productTypes = productTypesData?.data || []

  // Form reset when product changes
  useEffect(() => {
    if (product) {
      Object.keys(product).forEach(key => {
        setValue(key, product[key] || '')
      })
      setImages(product.image_urls?.map(url => ({ url, name: 'existing', size: 0 })) || [])
    } else {
      reset()
      setImages([])
    }
  }, [product, setValue, reset])

  const handleFormSubmit = (data) => {
    const formData = {
      ...data,
      image_urls: images.map(img => img.url)
    }
    onSubmit(formData)
  }

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files)
    // Dosya boyutu ve tip kontrolü
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })
    
    // Burada gerçek dosya yükleme işlemi yapılacak
    // Şimdilik mock URL'ler ekliyoruz
    const newImages = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Tooltip bileşeni
  const Tooltip = ({ children, text }) => (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {text}
        <div className="absolute top-0 left-4 w-2 h-2 bg-gray-900 transform rotate-45 -translate-y-1"></div>
      </div>
    </div>
  )

  // Form alanı wrapper bileşeni
  const FormField = ({ label, required, tooltip, children, error }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <div className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
          {tooltip && (
            <Tooltip text={tooltip}>
              <FiInfo className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          )}
        </div>
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  )

  if (!isOpen) return null

  const tabs = [
    { id: 'basic', label: 'Temel Bilgiler' },
    { id: 'pricing', label: 'Fiyat & Stok' },
    { id: 'supplier', label: 'Tedarikçi' },
    { id: 'location', label: 'Lokasyon & Kodlar' },
    { id: 'media', label: 'Görseller' },
    { id: 'advanced', label: 'Gelişmiş' }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl max-h-[95vh] rounded-lg bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sm:p-6 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {product ? 'Mevcut ürün bilgilerini güncelleyin' : 'Yeni ürün bilgilerini girin'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
            title="Kapat"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex-shrink-0">
          <nav className="flex overflow-x-auto px-4 sm:px-6 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Temel Bilgiler Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FormField 
                      label="Ürün Adı" 
                      required 
                      tooltip="Ürünün pazarlama adı. Müşterilerin göreceği isim."
                      error={errors.name}
                    >
                      <input
                        type="text"
                        {...register('name', { required: 'Ürün adı gereklidir' })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Örn: iPhone 15 Pro Max"
                      />
                    </FormField>

                    <FormField 
                      label="SKU" 
                      required 
                      tooltip="Stok Takip Kodu. Benzersiz ürün tanımlayıcısı."
                      error={errors.sku}
                    >
                      <input
                        type="text"
                        {...register('sku', { required: 'SKU gereklidir' })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Örn: APPLE-IP15PM-256"
                      />
                    </FormField>
                  </div>

                  <FormField 
                    label="Açıklama" 
                    tooltip="Ürünün detaylı açıklaması. Özellikler, kullanım alanları vb."
                  >
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                      placeholder="Ürünün detaylı açıklamasını buraya yazın..."
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <FormField 
                      label="Marka" 
                      tooltip="Ürünün marka adı."
                    >
                      <input
                        type="text"
                        {...register('brand')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Örn: Apple, Samsung"
                      />
                    </FormField>

                    <FormField 
                      label="Kategori" 
                      tooltip="Ürünün ait olduğu ana kategori."
                    >
                      <select
                        {...register('category_id')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="">Kategori Seçin</option>
                        {categories?.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField 
                      label="Ürün Tipi" 
                      tooltip="Ürünün tipi (fiziksel, dijital, hizmet vb.)."
                    >
                      <select
                        {...register('product_type_id')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="">Tip Seçin</option>
                        {productTypes?.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              )}

              {/* Fiyat & Stok Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">💰 Fiyatlandırma Bilgileri</h3>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <FormField 
                        label="Satış Fiyatı" 
                        tooltip="Müşterilere satış yapılacak birim fiyat."
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('unit_price')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="0.00"
                        />
                      </FormField>

                      <FormField 
                        label="Alış Fiyatı" 
                        tooltip="Tedarikçiden alış yapılan birim fiyat. Kar marjı hesaplaması için kullanılır."
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('purchase_price')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="0.00"
                        />
                      </FormField>

                      <FormField 
                        label="Para Birimi" 
                        tooltip="Fiyatların hangi para biriminde olduğunu belirtir."
                      >
                        <select
                          {...register('currency_id')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="">Para Birimi Seçin</option>
                          {currencies?.data?.map(currency => (
                            <option key={currency.id} value={currency.id}>
                              {currency.code} - {currency.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FormField 
                      label="Birim" 
                      tooltip="Ürünün satış birimi (adet, kg, litre vb.)."
                    >
                      <select
                        {...register('unit_id')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="">Birim Seçin</option>
                        {units?.data?.map(unit => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name} ({unit.code})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField 
                      label="Fiyat Artış Yüzdesi (%)" 
                      tooltip="Son fiyat güncellemesindeki artış yüzdesi. Raporlama için kullanılır."
                    >
                      <input
                        type="number"
                        step="0.01"
                        {...register('price_increase_percentage')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="0.00"
                      />
                    </FormField>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-2">📦 Stok Bilgileri</h3>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <FormField 
                        label="Mevcut Stok" 
                        tooltip="Şu anda depoda bulunan toplam miktar."
                      >
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          {...register('current_stock')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="0.000"
                        />
                      </FormField>

                      <FormField 
                        label="Rezerve Edilmiş Stok" 
                        tooltip="Siparişler için ayrılmış ancak henüz sevk edilmemiş miktar."
                      >
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          {...register('reserved_stock')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="0.000"
                        />
                      </FormField>

                      <FormField 
                        label="Sipariş Edilen Stok" 
                        tooltip="Tedarikçiden sipariş edilmiş ancak henüz teslim alınmamış miktar."
                      >
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          {...register('ordered_stock')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="0.000"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              )}

              {/* Tedarikçi Tab */}
              {activeTab === 'supplier' && (
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-800 mb-2">🏢 Tedarikçi Bilgileri</h3>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <FormField 
                        label="Ana Tedarikçi" 
                        tooltip="Bu ürün için birincil tedarikçi firma."
                      >
                        <select
                          {...register('supplier_id')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="">Tedarikçi Seçin</option>
                          {suppliers?.data?.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField 
                        label="Son Tedarikçi" 
                        tooltip="En son alım yapılan tedarikçi. Geçmiş alım takibi için kullanılır."
                      >
                        <select
                          {...register('last_supplier_id')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="">Son Tedarikçi Seçin</option>
                          {suppliers?.data?.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FormField 
                      label="Tedarikçi Ürün Kodu" 
                      tooltip="Tedarikçinin kendi sisteminde bu ürün için kullandığı kod/referans numarası."
                    >
                      <input
                        type="text"
                        {...register('supplier_product_code')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Örn: SUP-12345"
                      />
                    </FormField>

                    <FormField 
                      label="Teslim Süresi (Gün)" 
                      tooltip="Sipariş verildikten sonra ürünün teslim alınması için gereken ortalama gün sayısı."
                    >
                      <input
                        type="number"
                        min="0"
                        {...register('lead_time_days')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Örn: 7"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Lokasyon & Kodlar Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <FormField 
                    label="Depo Konumu" 
                    tooltip="Ürünün fiziksel olarak saklandığı depo veya raf konumu."
                  >
                    <select
                      {...register('location_id')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">Konum Seçin</option>
                      {locations?.data?.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">🏷️ Tanımlama Kodları</h3>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <FormField 
                        label="Barkod" 
                        tooltip="Ürünün standart barkod numarası (EAN, UPC vb.). Kasa sistemlerinde okutulur."
                      >
                        <input
                          type="text"
                          {...register('barcode')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                          placeholder="Örn: 8690123456789"
                        />
                      </FormField>

                      <FormField 
                        label="QR Kod" 
                        tooltip="Ürüne özel QR kod. Mobil uygulamalar ve hızlı erişim için kullanılır."
                      >
                        <input
                          type="text"
                          {...register('qr_code')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                          placeholder="Örn: QR-PROD-001"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              )}

              {/* Görseller Tab */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <FormField 
                    label="Ürün Görselleri" 
                    tooltip="Ürün görsellerini yükleyin. Maksimum dosya boyutu: 5MB. Desteklenen formatlar: JPG, PNG, GIF, WebP."
                  >
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-3 mb-4 ${
                          dragActive ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <FiUpload className={`h-8 w-8 ${
                            dragActive ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="mb-2">
                          <label className="cursor-pointer">
                            <span className="text-red-600 hover:text-red-500 font-medium">
                              Dosya seçin
                            </span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-gray-500 mx-2">veya</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          {dragActive ? 'Dosyaları buraya bırakın' : 'Görselleri sürükleyip bırakın'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Maksimum 5MB • JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    </div>
                  </FormField>

                  {images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FiImage className="h-4 w-4" />
                        Yüklenen Görseller ({images.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={image.url}
                                alt={`Ürün görseli ${index + 1}`}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              title="Görseli kaldır"
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </button>
                            {image.name !== 'existing' && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                                {image.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gelişmiş Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-orange-800 mb-4">⚙️ Ürün Özellikleri</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('is_popular')}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Popüler Ürün
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Bu ürün ana sayfada ve öne çıkan ürünler bölümünde gösterilir
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('is_raw_material')}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Hammadde
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Bu ürün üretimde kullanılan bir hammaddedir
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('is_finished_product')}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Bitmiş Ürün
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Bu ürün satışa hazır bitmiş bir üründür
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField 
                    label="Son Fiyat Güncelleme Tarihi" 
                    tooltip="Bu ürünün fiyatının en son ne zaman güncellendiğini belirtir."
                  >
                    <input
                      type="datetime-local"
                      {...register('last_price_update')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </FormField>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t bg-gray-50 p-4 sm:px-6 sm:py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                product ? 'Güncelle' : 'Oluştur'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm