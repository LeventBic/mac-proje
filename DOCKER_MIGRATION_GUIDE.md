# Docker Container Manager ile Proje Aktarım Rehberi

## Mevcut Durumdan Export İşlemi

### 1. Docker Images Export
```bash
# Mevcut image'ları listele
docker images

# Her bir image'ı export et
docker save -o inflow_frontend.tar inflow_frontend:latest
docker save -o inflow_backend.tar inflow_backend:latest
docker save -o mysql.tar mysql:8.0
```

### 2. Volume Backup
```bash
# Volume'ları listele
docker volume ls

# MySQL veritabanı backup
docker exec inflow_mysql mysqldump -u root -pmysql123 inflow_db > inflow_db_backup.sql

# Volume backup (alternatif)
docker run --rm -v project_files_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_backup.tar.gz -C /data .
```

### 3. Proje Dosyalarını Hazırla
```bash
# Tüm proje dosyalarını zip'le
tar -czf inflow_project_files.tar.gz backend/ frontend/ database/ docker-compose.yml .env
```

## Container Manager'da Import İşlemi

### 1. Image Import
```bash
# Export edilen image'ları yükle
docker load -i inflow_frontend.tar
docker load -i inflow_backend.tar
docker load -i mysql.tar
```

### 2. Proje Dosyalarını Yerleştir
```bash
# Proje dosyalarını extract et
tar -xzf inflow_project_files.tar.gz
```

### 3. Container Manager Konfigürasyonu

#### Docker Compose Dosyası (Container Manager Uyumlu)
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: inflow_mysql
    environment:
      MYSQL_ROOT_PASSWORD: mysql123
      MYSQL_DATABASE: inflow_db
      MYSQL_USER: inflow_user
      MYSQL_PASSWORD: mysql123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    restart: unless-stopped
    networks:
      - inflow_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: inflow_backend
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=inflow_db
      - DB_USER=inflow_user
      - DB_PASSWORD=mysql123
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    restart: unless-stopped
    networks:
      - inflow_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: inflow_frontend
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    restart: unless-stopped
    networks:
      - inflow_network

volumes:
  mysql_data:
    driver: local

networks:
  inflow_network:
    driver: bridge
```

### 4. Veritabanı Restore
```bash
# MySQL container başladıktan sonra
docker exec -i inflow_mysql mysql -u root -pmysql123 inflow_db < inflow_db_backup.sql
```

## Container Manager Özel Ayarları

### Portainer ile Yönetim
```bash
# Portainer kurulumu
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

### Watchtower ile Otomatik Güncelleme
```bash
# Watchtower ekleme
docker run -d --name watchtower -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 30
```

## Adım Adım Aktarım Süreci

1. **Mevcut Sistemde Export:**
   - Docker images export et
   - Volume backup al
   - Proje dosyalarını arşivle

2. **Yeni Sisteme Transfer:**
   - Export dosyalarını kopyala
   - Container manager kur
   - Docker images import et

3. **Konfigürasyon:**
   - docker-compose.yml düzenle
   - Environment variables ayarla
   - Network ve volume ayarları yap

4. **Başlatma:**
   - `docker-compose up -d`
   - Veritabanı restore
   - Health check kontrolü

5. **Test:**
   - Frontend erişim testi
   - Backend API testi
   - Database bağlantı testi

## Troubleshooting

### Yaygın Sorunlar
- **Port çakışması:** Port mapping'leri kontrol et
- **Volume mount hatası:** Path'leri doğrula
- **Network bağlantı sorunu:** Container network ayarlarını kontrol et
- **Environment variables:** .env dosyası konfigürasyonunu kontrol et

### Log Kontrolü
```bash
# Container loglarını kontrol et
docker logs inflow_frontend
docker logs inflow_backend
docker logs inflow_mysql
```

## Güvenlik Notları

- Production ortamında güçlü şifreler kullan
- Sensitive data'yı environment variables ile yönet
- SSL/TLS sertifikalarını yapılandır
- Firewall kurallarını ayarla
- Regular backup stratejisi oluştur