# Docker Sorun Giderme Rehberi

Bu rehber, inFlow uygulamasını Docker ile çalıştırırken karşılaşabileceğiniz yaygın sorunları ve çözümlerini içerir.

## 🚀 Hızlı Çözüm

Eğer herhangi bir hata alıyorsanız, önce şunu deneyin:

```bash
# Mevcut container'ları durdurun ve temizleyin
docker-compose down -v

# Image'ları yeniden build edin
docker-compose build --no-cache

# Servisleri başlatın
docker-compose up -d
```

## ❌ Yaygın Hatalar ve Çözümleri

### 1. "npm ci" Hatası

**Hata:** `npm ERR! The package-lock.json file is not found`

**Çözüm:** Dockerfile'larda `npm ci` yerine `npm install` kullanıyoruz.

```dockerfile
# ✅ Doğru
RUN npm install

# ❌ Yanlış  
RUN npm ci
```

### 2. "curl: command not found" Hatası

**Hata:** Health check sırasında curl bulunamıyor

**Çözüm:** Alpine Linux'ta curl'ü yüklüyoruz:

```dockerfile
RUN apk update && apk add --no-cache curl
```

### 3. Permission Denied Hatası

**Hata:** `EACCES: permission denied`

**Çözüm:** Node user'ına geçiş yapıyoruz:

```dockerfile
RUN chown -R node:node /app
USER node
```

### 4. Database Connection Hatası

**Hata:** `Connection refused` veya `Database not ready`

**Çözüm:** 
- PostgreSQL container'ının tamamen başlamasını bekleyin
- Health check'leri kontrol edin

```bash
# PostgreSQL durumunu kontrol edin
docker-compose ps postgres

# Logları kontrol edin
docker-compose logs postgres
```

### 5. Port Already in Use

**Hata:** `Port 3000/3001 is already in use`

**Çözüm:**
```bash
# Hangi process port'u kullanıyor kontrol edin
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Veya Windows'ta:
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Process'i sonlandırın veya farklı port kullanın
```

### 6. Volume Mount Sorunları

**Hata:** Kod değişiklikleri yansımıyor

**Çözüm:**
```bash
# Volume'ları yeniden mount edin
docker-compose down
docker-compose up -d
```

## 🔍 Debug Komutları

### Container Loglarını Kontrol Etme

```bash
# Tüm servislerin logları
docker-compose logs

# Belirli bir servisin logları
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Canlı log takibi
docker-compose logs -f backend
```

### Container İçine Girme

```bash
# Backend container'ına girin
docker-compose exec backend sh

# Frontend container'ına girin  
docker-compose exec frontend sh

# PostgreSQL container'ına girin
docker-compose exec postgres psql -U postgres -d inflow_db
```

### Container Durumunu Kontrol Etme

```bash
# Çalışan container'ları listele
docker-compose ps

# Container resource kullanımı
docker stats

# Container detayları
docker inspect inflow_backend
```

## 🛠️ Temizlik Komutları

### Geliştirme Sırasında Temizlik

```bash
# Container'ları durdur ve sil
docker-compose down

# Volume'larla birlikte sil
docker-compose down -v

# Image'ları da sil
docker-compose down --rmi all
```

### Sistem Geneli Temizlik

```bash
# Kullanılmayan container'ları sil
docker container prune

# Kullanılmayan image'ları sil
docker image prune

# Kullanılmayan volume'ları sil
docker volume prune

# Tüm kullanılmayan Docker objelerini sil
docker system prune -a
```

## ⚡ Performans İpuçları

### 1. Build Cache Kullanımı

```bash
# Cache'li build
docker-compose build

# Cache'siz build (sorun varsa)
docker-compose build --no-cache
```

### 2. Multi-stage Build (Gelecek İyileştirme)

Production için daha küçük image'lar:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

## 🌐 Network Sorunları

### Container'lar Arası İletişim

```bash
# Network'ü kontrol edin
docker network ls
docker network inspect inflow_inflow_network

# Container'ın network bağlantısını test edin
docker-compose exec backend ping postgres
docker-compose exec frontend ping backend
```

## 📊 Monitoring

### Health Check'leri

```bash
# Health durumunu kontrol edin
docker-compose ps

# Manuel health check
curl http://localhost:3001/health
curl http://localhost:3000
```

### Resource Monitoring

```bash
# CPU ve Memory kullanımı
docker stats --no-stream

# Disk kullanımı
docker system df
```

## 🆘 Son Çare Çözümler

### Tamamen Temizlik

```bash
# Tüm container'ları durdur
docker stop $(docker ps -aq)

# Tüm container'ları sil
docker rm $(docker ps -aq)

# Tüm image'ları sil
docker rmi $(docker images -q)

# Tüm volume'ları sil
docker volume rm $(docker volume ls -q)

# Docker'ı yeniden başlat
sudo systemctl restart docker  # Linux
# veya Docker Desktop'ı yeniden başlatın
```

### Docker Desktop Sıfırlama

Windows/Mac'te Docker Desktop:
1. Docker Desktop'ı açın
2. Settings > Troubleshoot > Reset to factory defaults
3. Apply & Restart

## 📞 Destek

Eğer sorunlar devam ederse:

1. **Logları toplayın:**
   ```bash
   docker-compose logs > docker-logs.txt
   ```

2. **Sistem bilgilerini toplayın:**
   ```bash
   docker version
   docker-compose version
   ```

3. **Issue açın** veya destek isteyin

Bu rehber sayesinde Docker sorunlarınızı kolayca çözebilirsiniz! 🚀 