import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const SettingsPage = () => {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Kullanıcı profil ayarları
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Sistem ayarları
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'Devarp Stok Yönetimi',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    currency: 'TRY',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    lowStockThreshold: 10,
    autoReorder: false,
    emailNotifications: true,
    smsNotifications: false
  });

  // Güvenlik ayarları
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    twoFactorAuth: false
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    // Gerçek uygulamada API'den ayarlar yüklenecek
    // Şimdilik localStorage'dan yüklüyoruz
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Şifre değişikliği kontrolü
      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        setMessage('Yeni şifreler eşleşmiyor');
        setLoading(false);
        return;
      }

      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Profil bilgileri güncellendi');
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage('Güncelleme başarısız');
    }
    
    setLoading(false);
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ayarları localStorage'a kaydet (gerçek uygulamada API'ye gönderilecek)
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Sistem ayarları güncellendi');
    } catch (error) {
      setMessage('Güncelleme başarısız');
    }
    
    setLoading(false);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Güvenlik ayarları güncellendi');
    } catch (error) {
      setMessage('Güncelleme başarısız');
    }
    
    setLoading(false);
  };

  const exportData = () => {
    setMessage('Veri dışa aktarma işlemi başlatıldı');
  };

  const importData = () => {
    setMessage('Veri içe aktarma özelliği yakında eklenecek');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Ayarlar</h1>
        <p className="text-secondary-600">Sistem ayarlarını yapılandırın</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('başarısız') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Layout with Sidebar */}
      <div className="flex gap-6">
        {/* Vertical Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { key: 'profile', label: 'Profil' },
              { key: 'system', label: 'Sistem' },
              { key: 'security', label: 'Güvenlik' },
              { key: 'data', label: 'Veri Yönetimi' }
            ].reverse().map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 space-y-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="card p-6 space-y-4">
            <h3 className="font-semibold mb-4">Profil Bilgileri</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Ad</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">E-posta</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="input w-full"
                required
              />
            </div>

            <hr className="my-6" />

            <h4 className="font-medium">Şifre Değiştir</h4>
            
            <div>
              <label className="block mb-1">Mevcut Şifre</label>
              <input
                type="password"
                name="currentPassword"
                value={profileForm.currentPassword}
                onChange={handleProfileChange}
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileForm.newPassword}
                  onChange={handleProfileChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  className="input w-full"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
            </button>
          </form>
        )}

        {activeTab === 'system' && (
          <form onSubmit={handleSystemSubmit} className="card p-6 space-y-4">
            <h3 className="font-semibold mb-4">Sistem Ayarları</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Şirket Adı</label>
                <input
                  type="text"
                  name="companyName"
                  value={systemSettings.companyName}
                  onChange={handleSystemChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Para Birimi</label>
                <select
                  name="currency"
                  value={systemSettings.currency}
                  onChange={handleSystemChange}
                  className="input w-full"
                >
                  <option value="TRY">Türk Lirası (₺)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Zaman Dilimi</label>
                <select
                  name="timezone"
                  value={systemSettings.timezone}
                  onChange={handleSystemChange}
                  className="input w-full"
                >
                  <option value="Europe/Istanbul">İstanbul</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Londra</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Tarih Formatı</label>
                <select
                  name="dateFormat"
                  value={systemSettings.dateFormat}
                  onChange={handleSystemChange}
                  className="input w-full"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1">Şirket Adresi</label>
              <textarea
                name="companyAddress"
                value={systemSettings.companyAddress}
                onChange={handleSystemChange}
                className="input w-full"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Şirket Telefonu</label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={systemSettings.companyPhone}
                  onChange={handleSystemChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Şirket E-postası</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={systemSettings.companyEmail}
                  onChange={handleSystemChange}
                  className="input w-full"
                />
              </div>
            </div>

            <hr className="my-6" />

            <h4 className="font-medium">Stok Ayarları</h4>
            
            <div>
              <label className="block mb-1">Düşük Stok Eşiği</label>
              <input
                type="number"
                name="lowStockThreshold"
                value={systemSettings.lowStockThreshold}
                onChange={handleSystemChange}
                className="input w-full"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoReorder"
                  checked={systemSettings.autoReorder}
                  onChange={handleSystemChange}
                  className="mr-2"
                />
                Otomatik yeniden sipariş
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={systemSettings.emailNotifications}
                  onChange={handleSystemChange}
                  className="mr-2"
                />
                E-posta bildirimleri
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={systemSettings.smsNotifications}
                  onChange={handleSystemChange}
                  className="mr-2"
                />
                SMS bildirimleri
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Güncelleniyor...' : 'Sistem Ayarlarını Güncelle'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleSecuritySubmit} className="card p-6 space-y-4">
            <h3 className="font-semibold mb-4">Güvenlik Ayarları</h3>
            
            <div>
              <label className="block mb-1">Oturum Zaman Aşımı (dakika)</label>
              <input
                type="number"
                name="sessionTimeout"
                value={securitySettings.sessionTimeout}
                onChange={handleSecurityChange}
                className="input w-full"
                min="5"
                max="480"
              />
            </div>

            <hr className="my-6" />

            <h4 className="font-medium">Şifre Politikası</h4>
            
            <div>
              <label className="block mb-1">Minimum şifre uzunluğu</label>
              <input
                type="number"
                name="passwordMinLength"
                value={securitySettings.passwordMinLength}
                onChange={handleSecurityChange}
                className="input w-full"
                min="4"
                max="32"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireUppercase"
                  checked={securitySettings.requireUppercase}
                  onChange={handleSecurityChange}
                  className="mr-2"
                />
                Büyük harf zorunlu
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireNumbers"
                  checked={securitySettings.requireNumbers}
                  onChange={handleSecurityChange}
                  className="mr-2"
                />
                Rakam zorunlu
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireSpecialChars"
                  checked={securitySettings.requireSpecialChars}
                  onChange={handleSecurityChange}
                  className="mr-2"
                />
                Özel karakter zorunlu
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="twoFactorAuth"
                  checked={securitySettings.twoFactorAuth}
                  onChange={handleSecurityChange}
                  className="mr-2"
                />
                İki faktörlü kimlik doğrulama
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Güncelleniyor...' : 'Güvenlik Ayarlarını Güncelle'}
            </button>
          </form>
        )}

        {activeTab === 'data' && (
          <div className="card p-6 space-y-6">
            <h3 className="font-semibold mb-4">Veri Yönetimi</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Veri Dışa Aktarma</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Tüm sistem verilerinizi yedeklemek için dışa aktarın.
                </p>
                <button onClick={exportData} className="btn btn-outline">
                  Verileri Dışa Aktar
                </button>
              </div>

              <hr />

              <div>
                <h4 className="font-medium mb-2">Veri İçe Aktarma</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Daha önce dışa aktarılmış verileri sisteme yükleyin.
                </p>
                <button onClick={importData} className="btn btn-outline">
                  Verileri İçe Aktar
                </button>
              </div>

              <hr />

              <div>
                <h4 className="font-medium mb-2 text-red-600">Tehlikeli Bölge</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Bu işlemler geri alınamaz. Dikkatli kullanın.
                </p>
                <div className="space-x-2">
                  <button className="btn btn-danger" onClick={() => setMessage('Veri temizleme özelliği yakında eklenecek')}>
                    Tüm Verileri Temizle
                  </button>
                  <button className="btn btn-danger" onClick={() => setMessage('Sistem sıfırlama özelliği yakında eklenecek')}>
                    Sistemi Sıfırla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
