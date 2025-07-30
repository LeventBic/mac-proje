# 🚀 inFlow Inventory - Deployment Guide

## Quick Start (En Hızlı Yöntem)

### 1. VPS/Sunucu Deployment

```bash
# Ubuntu sunucusuna SSH ile bağlanın
ssh user@your-server-ip

# Tek komutla kurulum
curl -fsSL https://raw.githubusercontent.com/your-repo/inflow-inventory/main/scripts/deploy.sh | bash

# .env dosyasını düzenleyin
nano /home/$USER/inflow-inventory/.env

# Uygulamayı başlatın
cd /home/$USER/inflow-inventory
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Manuel Kurulum

```bash
# 1. Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Projeyi kopyalayın
git clone <your-repo> inflow-inventory
cd inflow-inventory

# 3. Environment dosyasını oluşturun
cp env.production.example .env
nano .env  # Değerleri düzenleyin

# 4. Production modda başlatın
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Environment Değişkenleri (.env)

```env
# Database
MYSQL_ROOT_PASSWORD=güçlü_root_şifre
MYSQL_USER=inflow_user
MYSQL_PASSWORD=güçlü_db_şifre

# Security
JWT_SECRET=en_az_32_karakter_güçlü_secret

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
```

## 🌐 Domain & SSL Setup

```bash
# Nginx reverse proxy
sudo apt install nginx

# Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Maintenance

```bash
# Logları görüntüle
docker-compose -f docker-compose.prod.yml logs -f

# Container durumunu kontrol et
docker-compose -f docker-compose.prod.yml ps

# Yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Backup oluştur
./scripts/backup.sh
```

## 🔧 Deployment Seçenekleri

| Platform | Maliyet | Kolaylık | Önerilen |
|----------|---------|----------|----------|
| **DigitalOcean Droplet** | $5-10/ay | ⭐⭐⭐⭐⭐ | ✅ En İyi |
| **AWS EC2** | $8-15/ay | ⭐⭐⭐⭐ | ✅ Güvenilir |
| **Hetzner VPS** | $3-7/ay | ⭐⭐⭐⭐ | ✅ Uygun Fiyat |
| **Google Cloud** | $10-20/ay | ⭐⭐⭐ | ⚡ İleri Seviye |

## 🔐 Production Checklist

- [ ] Güçlü şifreler belirlendi
- [ ] Firewall yapılandırıldı
- [ ] SSL sertifikası kuruldu
- [ ] Backup sistemi aktif
- [ ] Monitoring kuruldu
- [ ] Domain yönlendirmesi yapıldı

## 🚨 Troubleshooting

### Container başlamıyor:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart
```

### Database bağlantı sorunu:
```bash
docker exec -it inflow_mysql_prod mysql -uroot -p
```

### Nginx konfigürasyon:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📞 Destek

- 📖 Detaylı rehber: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 Issue bildirin: GitHub Issues
- 📧 İletişim: support@yourcompany.com

---

**🎉 Başarılı deployment sonrası:** `https://yourdomain.com` adresinden sisteminize erişebilirsiniz! 