# Server PostgreSQL Bağlantı Rehberi

## 🎯 Amaç
Bu rehber, projeyi serverdaki PostgreSQL veritabanına bağlamak için gereken adımları açıklamaktadır.

## 📋 Ön Gereksinimler

### Server Tarafında Olması Gerekenler:
- ✅ PostgreSQL kurulu ve çalışır durumda
- ✅ Docker kurulu (opsiyonel, container kullanımı için)
- ✅ Firewall ayarları (5432 portu açık)
- ✅ PostgreSQL kullanıcı hesabı ve veritabanı

## 🔧 Adım Adım Bağlantı Kurulumu

### 1. Server Bilgilerini Öğrenin

Aşağıdaki bilgileri server yöneticinizden alın:

```bash
# Server IP Adresi
SERVER_IP=192.168.1.100  # Örnek IP

# PostgreSQL Port (varsayılan 5432)
DB_PORT=5432

# Veritabanı Adı
DB_NAME=inflow_db

# Kullanıcı Adı ve Şifre
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

### 2. .env Dosyasını Güncelleyin

`backend/.env` dosyasını açın ve aşağıdaki değerleri güncelleyin:

```env
# Database Configuration - Server Connection
DB_HOST=192.168.1.100          # Server IP adresinizi yazın
DB_PORT=5432                    # PostgreSQL port
DB_NAME=inflow_db              # Veritabanı adı
DB_USER=postgres               # Kullanıcı adı
DB_PASSWORD=your_secure_password # Gerçek şifrenizi yazın
```

### 3. Server'da PostgreSQL Ayarları

#### 3.1 PostgreSQL Konfigürasyonu

Server'da PostgreSQL'in dış bağlantılara izin vermesi için:

```bash
# postgresql.conf dosyasını düzenleyin
sudo nano /etc/postgresql/14/main/postgresql.conf

# Bu satırı bulun ve değiştirin:
listen_addresses = '*'  # Tüm IP'lerden bağlantıya izin ver
```

#### 3.2 pg_hba.conf Ayarları

```bash
# pg_hba.conf dosyasını düzenleyin
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Bu satırı ekleyin (güvenlik için IP aralığını sınırlayın):
host    all             all             0.0.0.0/0               md5
```

#### 3.3 PostgreSQL'i Yeniden Başlatın

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 4. Firewall Ayarları

```bash
# Ubuntu/Debian için
sudo ufw allow 5432/tcp

# CentOS/RHEL için
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

### 5. Veritabanı ve Kullanıcı Oluşturma

```sql
-- PostgreSQL'e bağlanın
psql -U postgres

-- Veritabanı oluşturun
CREATE DATABASE inflow_db;

-- Kullanıcı oluşturun (gerekirse)
CREATE USER inflow_user WITH PASSWORD 'secure_password';

-- Yetkileri verin
GRANT ALL PRIVILEGES ON DATABASE inflow_db TO inflow_user;

-- UUID extension'ını aktifleştirin
\c inflow_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 🧪 Bağlantı Testi

### 1. Backend Bağımlılıklarını Yükleyin

```bash
cd backend
npm install
```

### 2. Bağlantıyı Test Edin

```bash
# Test script'i çalıştırın
node -e "
const { testConnection } = require('./src/config/database.js');
testConnection().then(success => {
  console.log(success ? '✅ Bağlantı başarılı!' : '❌ Bağlantı başarısız!');
  process.exit(success ? 0 : 1);
});"
```

### 3. Manuel Test

Terminalden doğrudan test:

```bash
# psql ile bağlantı testi
psql -h YOUR_SERVER_IP -p 5432 -U postgres -d inflow_db
```

## 🔒 Güvenlik Önerileri

### 1. Güçlü Şifre Kullanın
```bash
# Güçlü şifre örneği
DB_PASSWORD=MyStr0ng!P@ssw0rd2024
```

### 2. IP Kısıtlaması
```bash
# pg_hba.conf'da sadece belirli IP'lere izin verin
host    inflow_db       inflow_user     192.168.1.0/24          md5
```

### 3. SSL Bağlantısı (Önerilen)
```env
# .env dosyasına ekleyin
DB_SSL=true
```

## 🐳 Docker ile PostgreSQL (Alternatif)

Eğer server'da Docker kullanmak istiyorsanız:

```bash
# PostgreSQL container'ı çalıştırın
docker run -d \
  --name postgres-server \
  -e POSTGRES_DB=inflow_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:14-alpine
```

## 🚨 Sorun Giderme

### Yaygın Hatalar ve Çözümleri:

#### 1. "Connection refused" Hatası
```bash
# PostgreSQL çalışıyor mu kontrol edin
sudo systemctl status postgresql

# Port dinleniyor mu kontrol edin
sudo netstat -tlnp | grep 5432
```

#### 2. "Authentication failed" Hatası
```bash
# Kullanıcı şifresini sıfırlayın
sudo -u postgres psql
\password postgres
```

#### 3. "Database does not exist" Hatası
```sql
-- Veritabanını oluşturun
CREATE DATABASE inflow_db;
```

#### 4. Firewall Problemi
```bash
# Firewall durumunu kontrol edin
sudo ufw status

# Gerekirse 5432 portunu açın
sudo ufw allow from YOUR_CLIENT_IP to any port 5432
```

## 📝 Kontrol Listesi

### Bağlantı Öncesi:
- [ ] Server IP adresi alındı
- [ ] PostgreSQL kullanıcı bilgileri alındı
- [ ] Firewall ayarları yapıldı
- [ ] PostgreSQL servisi çalışıyor

### Bağlantı Sonrası:
- [ ] .env dosyası güncellendi
- [ ] npm install çalıştırıldı
- [ ] Bağlantı testi başarılı
- [ ] Veritabanı şeması oluşturuldu

## 🚀 Sonraki Adımlar

Bağlantı başarılı olduktan sonra:

1. **PostgreSQL Şeması Oluşturma**: `schema_postgresql.sql` dosyasını çalıştırın
2. **Seed Data Yükleme**: `seed_postgresql.sql` dosyasını çalıştırın
3. **Backend Servisi Başlatma**: `npm run dev` ile backend'i başlatın
4. **API Testleri**: Postman veya curl ile API endpoint'lerini test edin

---

**Not**: Bu rehberdeki IP adresleri ve şifreler örnek amaçlıdır. Gerçek production ortamında güvenli değerler kullanın.