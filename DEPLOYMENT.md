# inFlow Inventory - Deployment Guide

Bu rehber, inFlow Inventory projesini farklı ortamlara nasıl deploy edeceğinizi gösterir.

## 🚀 Deployment Seçenekleri

### 1. VPS/Sunucu Deployment (Önerilen)

#### Gereksinimler:
- Ubuntu 20.04+ veya CentOS 8+
- En az 2GB RAM
- En az 20GB disk alanı
- Docker ve Docker Compose kurulu

#### Adım Adım:

```bash
# 1. Sunucuya bağlanın
ssh root@your-server-ip

# 2. Docker kurulumu (Ubuntu için)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Projeyi klonlayın veya upload edin
git clone <your-repo-url> inflow-inventory
cd inflow-inventory

# 5. Environment dosyasını oluşturun
cp env.production.example .env
nano .env  # Değerleri düzenleyin

# 6. Production modda başlatın
docker-compose -f docker-compose.prod.yml up -d

# 7. SSL sertifikası kurulumu (Certbot ile)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. DigitalOcean Droplet Deployment

#### Hızlı Setup:

```bash
# DigitalOcean Droplet oluşturun (2GB RAM, Ubuntu 20.04)
# SSH ile bağlanın

# One-liner setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/inflow-inventory/main/scripts/deploy.sh | bash
```

### 3. AWS EC2 Deployment

#### EC2 Instance Setup:

```bash
# 1. EC2 instance oluşturun (t3.small önerilen)
# 2. Security Groups: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

# 3. SSH ile bağlanın
ssh -i your-key.pem ubuntu@ec2-instance-ip

# 4. Kurulum scriptini çalıştırın
wget https://raw.githubusercontent.com/your-repo/inflow-inventory/main/scripts/aws-deploy.sh
chmod +x aws-deploy.sh
./aws-deploy.sh
```

### 4. Docker Hub ile Deployment

#### Images'ları Docker Hub'a push etme:

```bash
# 1. Images'ları build edin
docker build -t yourusername/inflow-backend:latest ./backend
docker build -f ./frontend/Dockerfile.prod -t yourusername/inflow-frontend:latest ./frontend

# 2. Docker Hub'a push edin
docker login
docker push yourusername/inflow-backend:latest
docker push yourusername/inflow-frontend:latest

# 3. Herhangi bir sunucuda çekin
docker pull yourusername/inflow-backend:latest
docker pull yourusername/inflow-frontend:latest
```

### 5. Kubernetes Deployment (İleri Seviye)

#### K8s manifests:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inflow-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inflow-backend
  template:
    metadata:
      labels:
        app: inflow-backend
    spec:
      containers:
      - name: backend
        image: yourusername/inflow-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "mysql-service"
```

## 🔧 Production Konfigürasyonu

### Nginx Reverse Proxy Setup:

```nginx
# /etc/nginx/sites-available/inflow
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Backup Script:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec inflow_mysql_prod mysqldump -uroot -p$MYSQL_ROOT_PASSWORD inflow_db > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
rm backup_$DATE.sql
```

## 🌐 Domain Konfigürasyonu

### DNS Settings:
```
A Record: yourdomain.com → your-server-ip
A Record: api.yourdomain.com → your-server-ip
CNAME: www.yourdomain.com → yourdomain.com
```

### Cloudflare Setup (Önerilen):
1. Domain'i Cloudflare'e ekleyin
2. SSL/TLS: "Full (strict)" mode
3. Always Use HTTPS: On
4. Auto Minify: JS, CSS, HTML

## 📊 Monitoring & Logging

### Docker Logs:
```bash
# Logs görüntüleme
docker-compose -f docker-compose.prod.yml logs -f

# Sadece backend logs
docker logs inflow_backend_prod -f

# Sadece frontend logs  
docker logs inflow_frontend_prod -f
```

### Health Checks:
```bash
# API health check
curl http://yourdomain.com/api/health

# Database connection check
docker exec inflow_mysql_prod mysqladmin ping -h localhost -u root -p
```

## 🔒 Güvenlik

### Firewall Setup:
```bash
# UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001  # API port (sadece gerekirse)
```

### SSL Otomatik Yenileme:
```bash
# Crontab ekleyin
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🚨 Troubleshooting

### Yaygın Problemler:

#### 1. Container başlamıyor:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart backend
```

#### 2. Database bağlantı hatası:
```bash
# MySQL container'ı kontrol edin
docker exec -it inflow_mysql_prod mysql -uroot -p
```

#### 3. Frontend yüklenmiyor:
```bash
# Nginx konfigürasyonunu kontrol edin
docker exec inflow_frontend_prod nginx -t
```

### Log Monitoring:
```bash
# Tüm servislerin loglarını takip edin
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 📧 Destek

Herhangi bir sorun yaşarsanız:
1. Logs'ları kontrol edin
2. GitHub Issues'da sorun bildirin
3. Email: support@yourcompany.com

---

**Not:** Production'a geçmeden önce mutlaka tüm güvenlik ayarlarını yapın ve backup stratejinizi belirleyin. 