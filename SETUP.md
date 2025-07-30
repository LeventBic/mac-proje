# inFlow Stok ve Üretim Yönetimi Uygulaması - Kurulum Rehberi

Bu doküman, inFlow benzeri stok ve üretim yönetimi uygulamasının nasıl kurulacağını ve çalıştırılacağını anlatmaktadır.

## 🔧 Gereksinimler

### Sistem Gereksinimleri
- **Node.js** 18+ (LTS önerilen)
- **MySQL** 8.0+
- **npm** veya **yarn** paket yöneticisi
- **Docker** (opsiyonel, kolay kurulum için)

### Tarayıcı Desteği
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Kurulum Yöntemleri

### Yöntem 1: Docker ile Kurulum (Önerilen)

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd inflow-app
```

2. **Docker ile başlatın:**
```bash
# İlk kurulum için
docker-compose build --no-cache
docker-compose up -d

# Veya tek komutla
docker-compose up -d --build
```

3. **Uygulamaya erişin:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Dokümantasyonu: http://localhost:3001/api/docs

**⚠️ Sorun yaşıyorsanız:** `DOCKER_TROUBLESHOOTING.md` dosyasına bakın!

### Yöntem 2: Manuel Kurulum

#### 1. MySQL Kurulumu

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

**Windows:**
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) indirin ve kurun
- MySQL Workbench'i de kurmanız önerilir

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
PostgreSQL'i resmi sitesinden indirin ve kurun.

#### 2. Veritabanı Oluşturma

```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Veritabanı ve kullanıcı oluşturun
CREATE DATABASE inflow_db;
CREATE USER inflow_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE inflow_db TO inflow_user;
\q
```

#### 3. Backend Kurulumu

```bash
cd backend

# Bağımlılıkları yükleyin
npm install

# Environment dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin (veritabanı bilgileri, JWT secret, vb.)
nano .env
```

**Örnek .env dosyası:**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inflow_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

```bash
# MySQL'de veritabanı ve kullanıcı oluşturun
mysql -u root -p
> CREATE DATABASE inflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> SOURCE database/schema_mysql.sql;
> SOURCE database/seed_mysql.sql;
> EXIT;

# Backend'i başlatın
npm run dev
```

#### 4. Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Environment dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin
nano .env
```

**Örnek .env dosyası:**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

```bash
# Frontend'i başlatın
npm start
```

## 🔐 Varsayılan Kullanıcılar

Sistem ilk kurulumda aşağıdaki demo kullanıcılarla gelir:

| Rol | Kullanıcı Adı | Şifre | E-posta |
|-----|---------------|-------|---------|
| Admin | admin | password123 | admin@inflow.com |
| Operatör | operator1 | password123 | operator@inflow.com |
| Görüntüleyici | viewer1 | password123 | viewer@inflow.com |

## 📊 Özellikler

### ✅ Tamamlanan Özellikler
- ✅ Kullanıcı girişi ve yetkilendirme
- ✅ Responsive dashboard
- ✅ Modern UI/UX tasarımı
- ✅ Veritabanı şeması ve ilişkiler
- ✅ REST API altyapısı
- ✅ Docker konfigürasyonu

### 🚧 Geliştirme Aşamasında
- 🚧 Ürün yönetimi CRUD işlemleri
- 🚧 Stok takibi ve hareket kayıtları
- 🚧 Üretim emri yönetimi
- 🚧 BOM (Bill of Materials) yönetimi
- 🚧 Barkod okuyucu entegrasyonu
- 🚧 Gerçek zamanlı bildirimler
- 🚧 Raporlama ve analitik

### 📋 Planlanan Özellikler
- 📋 Mobil uygulama
- 📋 E-posta bildirimleri
- 📋 Çoklu dil desteği
- 📋 İleri düzey raporlama
- 📋 API rate limiting
- 📋 Audit log

## 🛠 Geliştirme

### Geliştirme Ortamı

```bash
# Backend geliştirme modu
cd backend
npm run dev

# Frontend geliştirme modu
cd frontend
npm start

# Veritabanı migration
cd backend
npm run migrate

# Test çalıştırma
npm test
```

### API Dokümantasyonu

Backend çalıştırıldığında Swagger dokümantasyonu şu adreste erişilebilir:
http://localhost:3001/api/docs

### Kod Kalitesi

```bash
# ESLint kontrolü
npm run lint

# ESLint otomatik düzeltme
npm run lint:fix

# Prettier formatlaması
npm run format
```

## 🚀 Production Deployment

### 1. Environment Variables

Production ortamında aşağıdaki değişkenleri ayarlayın:

```env
NODE_ENV=production
DB_SSL=true
JWT_SECRET=production_secret_here
CORS_ORIGIN=https://your-domain.com
```

### 2. Build ve Deploy

```bash
# Frontend build
cd frontend
npm run build

# Backend production başlatma
cd backend
npm run start:prod
```

### 3. Nginx Konfigürasyonu (Opsiyonel)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Port zaten kullanımda hatası:**
```bash
# Port'u kullanan process'i bulun
lsof -i :3001
# Process'i sonlandırın
kill -9 <PID>
```

2. **Veritabanı bağlantı hatası:**
- PostgreSQL servisinin çalıştığından emin olun
- Bağlantı bilgilerini kontrol edin
- Firewall ayarlarını kontrol edin

3. **CORS hatası:**
- Backend .env dosyasında CORS_ORIGIN'in doğru olduğundan emin olun
- Frontend ve backend port'larının uyumlu olduğunu kontrol edin

### Log Dosyaları

```bash
# Backend logları
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Docker logları
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:

1. Bu dokümanı tekrar kontrol edin
2. GitHub Issues bölümünde sorunuzu arayın
3. Yeni bir issue oluşturun

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasını inceleyin.