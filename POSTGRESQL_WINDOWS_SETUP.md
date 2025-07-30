# Windows'a PostgreSQL Kurulum Rehberi

## 🎯 Amaç
Bu rehber, Windows bilgisayarınıza PostgreSQL veritabanını kurmak ve ERP projesi için yapılandırmak için gereken tüm adımları açıklamaktadır.

## 📋 Sistem Gereksinimleri

- **İşletim Sistemi:** Windows 10/11 (64-bit)
- **RAM:** Minimum 2GB (Önerilen 4GB+)
- **Disk Alanı:** Minimum 1GB boş alan
- **Yönetici Yetkileri:** Kurulum için gerekli

## 🚀 Adım Adım Kurulum

### 1. PostgreSQL İndirme

#### Resmi Web Sitesinden İndirme:
1. [PostgreSQL resmi web sitesine](https://www.postgresql.org/download/windows/) gidin
2. **"Download the installer"** seçeneğine tıklayın
3. **PostgreSQL 14.x** veya **15.x** sürümünü seçin (Önerilen: 14.x)
4. **Windows x86-64** versiyonunu indirin

#### Alternatif - Chocolatey ile Kurulum:
```powershell
# PowerShell'i yönetici olarak açın
choco install postgresql14 --params '/Password:postgres123'
```

### 2. PostgreSQL Kurulumu

#### Grafik Arayüz ile Kurulum:

1. **İndirilen .exe dosyasını çalıştırın**
   - Sağ tık → "Yönetici olarak çalıştır"

2. **Kurulum Sihirbazı Adımları:**

   **Adım 1: Hoş Geldiniz**
   - "Next" butonuna tıklayın

   **Adım 2: Kurulum Dizini**
   - Varsayılan: `C:\Program Files\PostgreSQL\14`
   - Değiştirmek istemiyorsanız "Next"

   **Adım 3: Bileşen Seçimi**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (Grafik yönetim aracı)
   - ✅ Stack Builder
   - ✅ Command Line Tools
   - "Next" butonuna tıklayın

   **Adım 4: Veri Dizini**
   - Varsayılan: `C:\Program Files\PostgreSQL\14\data`
   - "Next" butonuna tıklayın

   **Adım 5: Süper Kullanıcı Şifresi**
   - Kullanıcı: `postgres`
   - Şifre: `postgres123` (veya güçlü bir şifre)
   - ⚠️ **Bu şifreyi unutmayın!**
   - "Next" butonuna tıklayın

   **Adım 6: Port Numarası**
   - Varsayılan: `5432`
   - "Next" butonuna tıklayın

   **Adım 7: Locale**
   - Varsayılan locale'i seçin
   - "Next" butonuna tıklayın

   **Adım 8: Özet**
   - Ayarları kontrol edin
   - "Next" ile kurulumu başlatın

3. **Kurulum Tamamlanması**
   - Kurulum 5-10 dakika sürebilir
   - "Finish" butonuna tıklayın

### 3. Kurulum Doğrulama

#### Command Line ile Test:

```powershell
# PowerShell'i açın
# PostgreSQL'in çalışıp çalışmadığını kontrol edin
psql --version

# Eğer komut bulunamadı hatası alırsanız, PATH'e ekleyin:
$env:PATH += ";C:\Program Files\PostgreSQL\14\bin"

# PostgreSQL'e bağlanın
psql -U postgres -h localhost
# Şifre istendiğinde kurulum sırasında belirlediğiniz şifreyi girin
```

#### pgAdmin ile Test:

1. **pgAdmin 4'ü açın**
   - Başlat menüsünden "pgAdmin 4" arayın
   - İlk açılışta master password belirleyin

2. **Server Bağlantısı**
   - Sol panelde "Servers" → "PostgreSQL 14"
   - Şifre istendiğinde `postgres123` girin
   - Bağlantı başarılı olursa veritabanları görünecek

### 4. ERP Projesi için Konfigürasyon

#### 4.1 Veritabanı Oluşturma

```sql
-- psql komut satırında çalıştırın
psql -U postgres

-- ERP veritabanını oluşturun
CREATE DATABASE inflow_db;

-- UUID extension'ını aktifleştirin
\c inflow_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bağlantıyı test edin
\l
\q
```

#### 4.2 Kullanıcı Oluşturma (Opsiyonel)

```sql
-- Özel kullanıcı oluşturun
CREATE USER inflow_user WITH PASSWORD 'inflow123';

-- Veritabanı yetkilerini verin
GRANT ALL PRIVILEGES ON DATABASE inflow_db TO inflow_user;

-- Schema yetkilerini verin
\c inflow_db
GRANT ALL ON SCHEMA public TO inflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inflow_user;
```

#### 4.3 Uzaktan Bağlantı Ayarları (Opsiyonel)

Eğer başka bilgisayarlardan bağlanmak istiyorsanız:

```powershell
# postgresql.conf dosyasını düzenleyin
notepad "C:\Program Files\PostgreSQL\14\data\postgresql.conf"

# Bu satırı bulun ve değiştirin:
# listen_addresses = 'localhost'
listen_addresses = '*'

# pg_hba.conf dosyasını düzenleyin
notepad "C:\Program Files\PostgreSQL\14\data\pg_hba.conf"

# Bu satırı ekleyin (güvenlik için IP aralığını sınırlayın):
host    all             all             0.0.0.0/0               md5
```

**PostgreSQL servisini yeniden başlatın:**
```powershell
# Servis yöneticisini açın
services.msc

# "postgresql-x64-14" servisini bulun
# Sağ tık → "Restart"
```

### 5. Windows Firewall Ayarları

Eğer uzaktan bağlantı kullanacaksanız:

```powershell
# PowerShell'i yönetici olarak açın
# PostgreSQL portu için firewall kuralı ekleyin
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

### 6. ERP Şemasını Yükleme

```powershell
# Proje dizinine gidin
cd "C:\Users\bicak\Context-Engineering-Template-2\output\project_files"

# Şemayı yükleyin
psql -U postgres -d inflow_db -f "database\schema_postgresql.sql"

# Seed data'yı yükleyin
psql -U postgres -d inflow_db -f "database\seed_postgresql.sql"
```

### 7. Backend Bağlantı Testi

#### .env Dosyasını Güncelleyin:

```env
# Database Configuration - Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inflow_db
DB_USER=postgres
DB_PASSWORD=postgres123
```

#### Backend'i Test Edin:

```powershell
# Backend dizinine gidin
cd backend

# Bağımlılıkları yükleyin
npm install

# Bağlantıyı test edin
node -e "
const { testConnection } = require('./src/config/database.js');
testConnection().then(success => {
  console.log(success ? '✅ Bağlantı başarılı!' : '❌ Bağlantı başarısız!');
  process.exit(success ? 0 : 1);
});"

# Backend'i başlatın
npm run dev
```

## 🔧 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "psql komut bulunamadı"

**Çözüm:**
```powershell
# PATH'e PostgreSQL bin dizinini ekleyin
$env:PATH += ";C:\Program Files\PostgreSQL\14\bin"

# Kalıcı olarak eklemek için:
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\PostgreSQL\14\bin", "User")
```

### Sorun 2: "Bağlantı reddedildi"

**Çözüm:**
```powershell
# PostgreSQL servisinin çalışıp çalışmadığını kontrol edin
Get-Service postgresql*

# Servis durmuşsa başlatın
Start-Service postgresql-x64-14
```

### Sorun 3: "Şifre hatası"

**Çözüm:**
```powershell
# Şifreyi sıfırlayın
psql -U postgres
\password postgres
# Yeni şifreyi girin
```

### Sorun 4: "Port zaten kullanımda"

**Çözüm:**
```powershell
# 5432 portunu kullanan uygulamayı bulun
netstat -ano | findstr :5432

# Gerekirse farklı port kullanın (postgresql.conf'da port = 5433)
```

## 🛠️ Yönetim Araçları

### pgAdmin 4 (Grafik Arayüz)
- **Konum:** Başlat Menüsü → pgAdmin 4
- **Kullanım:** Veritabanı yönetimi, sorgu çalıştırma, tablo görüntüleme
- **Bağlantı:** localhost:5432, kullanıcı: postgres

### psql (Komut Satırı)
```powershell
# Bağlanma
psql -U postgres -d inflow_db

# Temel komutlar
\l          # Veritabanlarını listele
\c dbname   # Veritabanına bağlan
\dt         # Tabloları listele
\d table    # Tablo yapısını göster
\q          # Çıkış
```

### DBeaver (Üçüncü Parti)
- **İndirme:** https://dbeaver.io/download/
- **Avantaj:** Çoklu veritabanı desteği, gelişmiş sorgu editörü

## 📊 Performans Optimizasyonu

### postgresql.conf Ayarları:

```ini
# Bellek ayarları (RAM'inize göre ayarlayın)
shared_buffers = 256MB          # RAM'in %25'i
effective_cache_size = 1GB      # RAM'in %75'i
work_mem = 4MB                  # Sorgu başına bellek
maintenance_work_mem = 64MB     # Bakım işlemleri için

# Bağlantı ayarları
max_connections = 100           # Maksimum bağlantı sayısı

# Logging ayarları
log_statement = 'all'           # Tüm sorguları logla (geliştirme için)
log_duration = on               # Sorgu sürelerini logla
```

## 🔒 Güvenlik Önerileri

### 1. Güçlü Şifreler
```sql
-- Şifre politikası
ALTER USER postgres PASSWORD 'MyStr0ng!P@ssw0rd2024';
```

### 2. Bağlantı Kısıtlamaları
```ini
# pg_hba.conf - Sadece belirli IP'lerden bağlantıya izin ver
host    inflow_db       postgres        192.168.1.0/24          md5
```

### 3. SSL Bağlantısı
```ini
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

## 📋 Kontrol Listesi

### Kurulum Sonrası:
- [ ] PostgreSQL servisi çalışıyor
- [ ] psql komut satırından bağlanabiliyor
- [ ] pgAdmin 4 ile bağlanabiliyor
- [ ] inflow_db veritabanı oluşturuldu
- [ ] UUID extension aktifleştirildi
- [ ] Schema ve seed data yüklendi
- [ ] Backend bağlantı testi başarılı
- [ ] .env dosyası güncellendi

### Güvenlik:
- [ ] Güçlü şifre belirlendi
- [ ] Gereksiz kullanıcılar kaldırıldı
- [ ] Firewall kuralları ayarlandı
- [ ] Bağlantı logları aktifleştirildi

## 🚀 Sonraki Adımlar

1. **Backend Geliştirme:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Frontend Geliştirme:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Docker ile Çalıştırma:**
   ```powershell
   docker-compose up
   ```

## 📞 Destek

**Sorun yaşarsanız:**
- PostgreSQL loglarını kontrol edin: `C:\Program Files\PostgreSQL\14\data\log`
- Windows Event Viewer'ı kontrol edin
- PostgreSQL dokümantasyonuna başvurun: https://www.postgresql.org/docs/

---

**Kurulum tamamlandı! Artık PostgreSQL ile ERP projenizi geliştirebilirsiniz.** 🎉