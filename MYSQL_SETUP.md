# MySQL Kurulum Rehberi

Bu rehber, inFlow uygulaması için MySQL veritabanının nasıl kurulacağını ve yapılandırılacağını açıklar.

## 🔧 MySQL Kurulumu

### Windows

1. **MySQL Community Server İndirme:**
   - [MySQL Downloads](https://dev.mysql.com/downloads/mysql/) sayfasına gidin
   - "MySQL Community Server" seçin
   - Windows için MSI installer'ı indirin

2. **Kurulum:**
   - İndirilen `.msi` dosyasını çalıştırın
   - "Developer Default" seçeneğini seçin (MySQL Server + Workbench + diğer araçlar)
   - Root şifresini güçlü bir şifre yapın (örn: `mysql123`)
   - Port: `3306` (varsayılan)

3. **MySQL Workbench:**
   - Kurulumla birlikte gelir
   - Görsel veritabanı yönetimi için kullanılır

### macOS

```bash
# Homebrew ile kurulum
brew install mysql

# MySQL'i başlat
brew services start mysql

# Güvenlik ayarları
mysql_secure_installation
```

### Ubuntu/Debian

```bash
# Paket listesini güncelle
sudo apt update

# MySQL Server'ı kur
sudo apt install mysql-server

# MySQL'i başlat
sudo systemctl start mysql
sudo systemctl enable mysql

# Güvenlik ayarları
sudo mysql_secure_installation
```

### CentOS/RHEL/Fedora

```bash
# MySQL repository ekle
sudo dnf install mysql-server

# MySQL'i başlat
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Root şifresini al
sudo grep 'temporary password' /var/log/mysqld.log

# Güvenlik ayarları
mysql_secure_installation
```

## 🛠️ Veritabanı Kurulumu

### 1. MySQL'e Bağlan

```bash
# Root kullanıcısı ile bağlan
mysql -u root -p
```

### 2. Veritabanı ve Kullanıcı Oluştur

```sql
-- Veritabanı oluştur
CREATE DATABASE inflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kullanıcı oluştur (opsiyonel)
CREATE USER 'inflow_user'@'localhost' IDENTIFIED BY 'inflow123';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON inflow_db.* TO 'inflow_user'@'localhost';
FLUSH PRIVILEGES;

-- Veritabanını seç
USE inflow_db;
```

### 3. Şema ve Verileri Yükle

```sql
-- Şemayı yükle
SOURCE database/schema_mysql.sql;

-- Örnek verileri yükle
SOURCE database/seed_mysql.sql;

-- Kontrol et
SHOW TABLES;
SELECT COUNT(*) FROM products;
```

## 🐳 Docker ile MySQL

Eğer Docker kullanıyorsanız, MySQL otomatik olarak kurulur:

```bash
# Docker compose ile başlat
docker-compose up -d mysql

# MySQL container'ına bağlan
docker-compose exec mysql mysql -u root -pmysql123 inflow_db

# Veya MySQL Workbench ile bağlan:
# Host: localhost
# Port: 3306
# Username: root
# Password: mysql123
```

## 🔍 Bağlantı Testi

### Komut Satırından

```bash
# Bağlantıyı test et
mysql -h localhost -P 3306 -u root -p inflow_db

# Basit sorgu çalıştır
mysql> SELECT 'MySQL bağlantısı başarılı!' as status;
mysql> SELECT COUNT(*) as user_count FROM users;
```

### Node.js Backend ile

Backend'inizi başlattığınızda console'da şu mesajı görmelisiniz:

```
Database connection successful: { current_time: '2024-12-15T10:30:00.000Z' }
```

## ⚙️ Konfigürasyon

### Environment Variables

`.env` dosyanızda şu ayarları yapın:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inflow_db
DB_USER=root
DB_PASSWORD=mysql123
```

### Docker Environment

`docker-compose.yml` dosyasında:

```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: mysql123
    MYSQL_DATABASE: inflow_db
    MYSQL_USER: inflow_user
    MYSQL_PASSWORD: inflow123
```

## 🚨 Yaygın Sorunlar ve Çözümler

### 1. "Access denied for user" Hatası

```bash
# MySQL'e root ile bağlan
sudo mysql

# Kullanıcı şifresini sıfırla
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yeni_sifre';
FLUSH PRIVILEGES;
```

### 2. "Can't connect to MySQL server" Hatası

```bash
# MySQL servisinin durumunu kontrol et
sudo systemctl status mysql

# MySQL'i başlat
sudo systemctl start mysql

# Port'un açık olduğunu kontrol et
netstat -tlnp | grep :3306
```

### 3. Character Set Sorunları

```sql
-- Veritabanı character set'ini kontrol et
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'inflow_db';

-- Düzelt
ALTER DATABASE inflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Docker Container'ı Başlamıyor

```bash
# Container loglarını kontrol et
docker-compose logs mysql

# Volume'ları temizle
docker-compose down -v
docker-compose up -d mysql
```

## 🔧 Performans Ayarları

### my.cnf Dosyası

MySQL konfigürasyon dosyasını düzenleyin:

**Linux:** `/etc/mysql/my.cnf` veya `/etc/mysql/mysql.conf.d/mysqld.cnf`
**Windows:** `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`

```ini
[mysqld]
# Temel ayarlar
max_connections = 200
innodb_buffer_pool_size = 1G
query_cache_size = 64M
query_cache_limit = 2M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Timezone
default-time-zone = '+00:00'
```

### Index Optimizasyonu

```sql
-- Önemli indeksleri kontrol et
SHOW INDEX FROM products;
SHOW INDEX FROM inventory;
SHOW INDEX FROM stock_movements;

-- Query performance'ını analiz et
EXPLAIN SELECT * FROM products WHERE sku = 'HM001';
```

## 📊 Monitoring

### Temel Sorgular

```sql
-- Veritabanı boyutu
SELECT 
    table_schema as 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'inflow_db';

-- Aktif bağlantılar
SHOW PROCESSLIST;

-- Sistem durumu
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
```

## 🔒 Güvenlik

### Kullanıcı Yetkileri

```sql
-- Minimum yetkili kullanıcı oluştur
CREATE USER 'inflow_app'@'localhost' IDENTIFIED BY 'güçlü_şifre';
GRANT SELECT, INSERT, UPDATE, DELETE ON inflow_db.* TO 'inflow_app'@'localhost';

-- Gereksiz kullanıcıları sil
DROP USER 'test'@'localhost';

-- Anonim kullanıcıları sil
DELETE FROM mysql.user WHERE User='';
FLUSH PRIVILEGES;
```

### SSL Bağlantısı

```sql
-- SSL durumunu kontrol et
SHOW STATUS LIKE 'Ssl_cipher';

-- SSL'i etkinleştir
ALTER USER 'inflow_user'@'localhost' REQUIRE SSL;
```

## 📋 Backup ve Restore

### Backup

```bash
# Tüm veritabanını yedekle
mysqldump -u root -p inflow_db > inflow_backup.sql

# Sadece yapıyı yedekle
mysqldump -u root -p --no-data inflow_db > inflow_structure.sql

# Sadece verileri yedekle
mysqldump -u root -p --no-create-info inflow_db > inflow_data.sql
```

### Restore

```bash
# Veritabanını geri yükle
mysql -u root -p inflow_db < inflow_backup.sql

# Veya MySQL içinden
mysql> SOURCE /path/to/inflow_backup.sql;
```

Bu rehber ile MySQL'i başarıyla kurabilir ve inFlow uygulamanızı çalıştırabilirsiniz! 🚀 