# Şirket İçi Stok, Reçete ve Proje Yönetimi Sistemi

Bu uygulama, şirketlerin stok takibi, reçete (BOM) yönetimi ve proje süreçlerini entegre bir şekilde yöneten web tabanlı bir çözümdür. Özellikle üretim yapan firmaların iç süreçlerini optimize etmek için tasarlanmıştır.

## 🚀 Ana Özellikler

### 📦 Stok Yönetimi

- Ürün ekleme/düzenleme/silme (SKU, barkod, konum bilgileriyle)
- Gerçek zamanlı stok takibi ve düşük stok uyarıları
- Stok hareketleri ve geçmiş takibi
- Stok sayım ve transfer işlemleri
- Barkod tarayıcı desteği

### 🔧 Reçete (BOM) Yönetimi

- Malzeme Listesi (Bill of Materials) oluşturma ve yönetimi
- Çok seviyeli BOM yapısı desteği
- Maliyet hesaplama ve analizi
- Versiyon kontrolü
- Üretim planlaması entegrasyonu

### 📋 Proje Yönetimi

- Proje oluşturma ve takibi
- Görev atama ve ilerleme takibi
- Proje maliyetleri ve bütçe kontrolü
- Müşteri bazlı proje organizasyonu
- Gantt chart ve zaman çizelgesi
- Proje raporlama ve analitik

### 🏭 Üretim Modülü

- Üretim emri oluşturma ve takibi
- BOM bazlı malzeme ihtiyaç planlaması
- Devam eden üretim (WIP) takibi
- Üretim maliyeti ve süre analizi
- Kalite kontrol entegrasyonu

### 👥 Kullanıcı ve Müşteri Yönetimi

- Rol tabanlı erişim kontrolü (Admin, Operatör, Görüntüleyici)
- Müşteri bilgileri ve CRM entegrasyonu
- Kullanıcı girişi ve yetkilendirme
- Güvenli oturum yönetimi

### 📊 Dashboard ve Raporlama

- Gerçek zamanlı stok ve üretim göstergeleri
- Proje performans metrikleri
- Maliyet analizi ve karlılık raporları
- Interaktif grafikler ve tablolar
- Özelleştirilebilir dashboard

## 🛠 Teknoloji Stack

### 💻 Programlama Dilleri

- **JavaScript**, **TypeScript**, **SQL**, **HTML5**, **CSS3**

### 🏗️ Framework'ler

- **Frontend**: React 18 Ekosistemi
- **Backend**: Node.js + Express.js
- **CSS**: Tailwind CSS

### 🔄 State Management

- **Redux Toolkit**, **React Query (@tanstack/react-query)**

### 🔐 Güvenlik ve Kimlik Doğrulama

- **JWT**, **bcryptjs**, **helmet**, **CORS**

### 🗄️ Veritabanı

- **PostgreSQL**

### 🐳 DevOps ve Deployment

- **Docker**, **Docker Compose**, **Nginx**

### 🛠️ Geliştirme Araçları

- **NPM**, **ESLint**, **Prettier**, **Jest**

### 📊 Veri Görselleştirme

- **Recharts**, **QR Code**

### 🌐 HTTP ve API

- **Axios**, **Swagger**, **RESTful API**

## 📁 Proje Yapısı

```
inflow-app/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── database/           # Database scripts
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Sample data
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store (opsiyonel)
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── docs/                   # Documentation
└── docker-compose.yml      # Docker configuration
```

## 🚦 Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Adım Adım Kurulum

1. **Repository'yi klonlayın:**

```bash
git clone <repository-url>
cd inflow-app
```

2. **Backend kurulumu:**

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run migrate
npm run seed
npm run dev
```

3. **Frontend kurulumu:**

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm start
```

4. **Docker ile kurulum (opsiyonel):**

```bash
docker-compose up -d
```

## 📖 API Dokümantasyonu

API dokümantasyonu: `http://localhost:3001/api/docs`

## 🧪 Test

```bash
# Backend testleri
cd backend && npm test

# Frontend testleri
cd frontend && npm test
```

## 🚀 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Start production backend
cd backend && npm run start:prod
```

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Herhangi bir sorun için issue oluşturun veya iletişime geçin.
