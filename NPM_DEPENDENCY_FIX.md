# NPM Dependency Sorunları Çözüm Rehberi

Bu rehber, inFlow projesinde karşılaşılan npm dependency conflict'lerini çözmek için hazırlanmıştır.

## 🚨 Yaygın Hata: TypeScript Versiyonu Uyumsuzluğu

### Hata Mesajı:
```
npm error ERESOLVE could not resolve
npm error While resolving: react-scripts@5.0.1
npm error Found: typescript@5.8.3
npm error Could not resolve dependency:
npm error peerOptional typescript@"^3.2.1 || ^4" from react-scripts@5.0.1
```

### Sebep:
- React Scripts 5.0.1 sadece TypeScript 4.x versiyonlarını destekler
- Package.json'da TypeScript 5.x tanımlı

### ✅ Çözüm:
Artık TypeScript 4.9.5 kullanıyoruz ve `.npmrc` dosyası ile legacy peer deps aktif.

## 🛠️ Hızlı Çözümler

### 1. Docker ile Çalıştırma (Önerilen)

```bash
# Mevcut container'ları durdur
docker-compose down

# Cache'siz yeniden build et
docker-compose build --no-cache frontend

# Başlat
docker-compose up -d
```

### 2. Manuel Kurulum

```bash
# Frontend dizinine git
cd frontend

# Node modules ve lock dosyasını sil
rm -rf node_modules package-lock.json

# Legacy peer deps ile yükle
npm install --legacy-peer-deps

# Veya force ile
npm install --force

# Başlat
npm start
```

### 3. Hazır Scriptler

```bash
# Temiz kurulum
npm run install:clean

# Force kurulum
npm run install:force
```

## 🔧 Yapılan Düzeltmeler

### 1. TypeScript Versiyonu
```json
// Eski
"typescript": "^5.3.3"

// Yeni
"typescript": "^4.9.5"
```

### 2. React Query Güncellemesi
```json
// Eski
"react-query": "^3.39.3"

// Yeni
"@tanstack/react-query": "^4.36.1"
```

### 3. .npmrc Dosyası
```
legacy-peer-deps=true
fund=false
audit=false
```

### 4. Dockerfile Güncellemesi
```dockerfile
# Legacy peer deps ile kurulum
RUN npm install --legacy-peer-deps
```

## 🚀 Alternatif Çözümler

### Yarn Kullanımı

Eğer npm sorunları devam ederse Yarn kullanabilirsiniz:

```bash
# Yarn'ı kur
npm install -g yarn

# Yarn ile dependencies'i yükle
cd frontend
yarn install

# Başlat
yarn start
```

### Node.js Versiyonu

Uyumlu Node.js versiyonu kullandığınızdan emin olun:

```bash
# Node versiyonunu kontrol et
node --version
# Önerilen: v18.x veya v20.x

# npm versiyonunu kontrol et
npm --version
# Önerilen: 9.x veya 10.x
```

## 🐳 Docker Sorun Giderme

### Container Build Hatası

```bash
# Tüm container'ları ve volume'ları temizle
docker-compose down -v

# Image'ları sil
docker rmi inflow_frontend inflow_backend

# Yeniden build et
docker-compose build --no-cache

# Başlat
docker-compose up -d
```

### Node Modules Cache Sorunu

```bash
# Docker build args ile npm cache temizle
docker-compose build --no-cache --build-arg BUILDKIT_INLINE_CACHE=1 frontend
```

## 📋 Kontrol Listesi

Kurulum öncesi kontrol edin:

- [ ] Node.js 18+ kurulu
- [ ] npm 9+ veya yarn kurulu
- [ ] Docker Desktop çalışıyor (Docker kullanıyorsanız)
- [ ] Port 3000 ve 3001 boş
- [ ] Yeterli disk alanı (min 2GB)

## 🆘 Son Çare Çözümler

### 1. Tüm npm cache'i temizle

```bash
npm cache clean --force
```

### 2. Global packages'i güncelle

```bash
npm update -g
```

### 3. Node.js'i yeniden kur

Windows: Node.js'i kaldırıp yeniden kurun
macOS: `brew uninstall node && brew install node`
Linux: `sudo apt remove nodejs npm && sudo apt install nodejs npm`

### 4. Proje dizinini yeniden klonla

```bash
# Yeni dizine klonla
git clone <repo-url> inflow-fresh
cd inflow-fresh/frontend
npm install --legacy-peer-deps
```

## 🎯 Test Komutları

Kurulum sonrası test edin:

```bash
# Backend test
cd backend
npm start
# Beklenen: Server port 3001'de başlamalı

# Frontend test
cd frontend
npm start
# Beklenen: Browser'da http://localhost:3000 açılmalı

# Docker test
docker-compose up -d
docker-compose ps
# Beklenen: Tüm servisler "Up" durumda olmalı
```

Bu rehber ile npm dependency sorunlarınızı çözebilirsiniz! 🚀 