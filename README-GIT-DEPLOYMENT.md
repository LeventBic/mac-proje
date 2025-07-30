# 🚀 inFlow Inventory - Git-Based Deployment

## **⚡ En Kolay Yöntem - Git Repository'den Deployment**

### **1. Repository'yi GitHub/GitLab'a Push Edin**

```bash
# Windows'ta (VS Code Terminal veya GitHub Desktop kullanın)
git add .
git commit -m "Add production deployment files"
git push origin main
```

### **2. Sunucuda Tek Komutla Deployment**

```bash
# Ubuntu sunucusuna SSH ile bağlanın
ssh user@your-server-ip

# Repository URL'i ile deployment yapın
curl -fsSL https://raw.githubusercontent.com/YOURUSERNAME/YOURREPO/main/output/project_files/scripts/git-deploy.sh | bash -s https://github.com/YOURUSERNAME/YOURREPO.git
```

**Örnek:**
```bash
curl -fsSL https://raw.githubusercontent.com/bicak/inflow-inventory/main/output/project_files/scripts/git-deploy.sh | bash -s https://github.com/bicak/inflow-inventory.git
```

### **3. Deployment Sonrası Adımlar**

```bash
# .env dosyasını düzenleyin
nano /home/$USER/inflow-inventory/output/project_files/.env

# Uygulamayı başlatın
cd /home/$USER/inflow-inventory/output/project_files
docker-compose -f docker-compose.prod.yml up -d

# SSL kurulumu
sudo certbot --nginx -d yourdomain.com
```

---

## **🔄 Güncelleme (Update) Süreci**

Projenizi güncelledikten sonra sunucuda:

```bash
cd /home/$USER/inflow-inventory
git pull origin main
cd output/project_files
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## **📋 Git Repository Yapısı**

Projenizin git repository'sinde şu dosyalar olmalı:

```
your-repo/
├── output/
│   └── project_files/
│       ├── backend/
│       ├── frontend/
│       ├── database/
│       ├── scripts/
│       │   ├── git-deploy.sh      # Ana deployment script
│       │   └── backup.sh          # Backup script
│       ├── docker-compose.prod.yml
│       ├── env.production.example
│       └── DEPLOYMENT.md
├── context/
├── prompts/
└── README.md
```

---

## **🌟 Git-Based Deployment Avantajları**

✅ **Version Control** - Tüm değişiklikleri takip edebilirsiniz  
✅ **Kolay Güncelleme** - `git pull` ile anında güncelleyebilirsiniz  
✅ **Rollback** - Eski versiyona kolayca dönebilirsiniz  
✅ **Collaboration** - Ekip çalışması için idealdir  
✅ **CI/CD Ready** - GitHub Actions ile otomatik deployment  
✅ **Backup** - Git repository doğal backup görevi görür  

---

## **🔧 Platform-Specific Örnekler**

### **GitHub Repository:**
```bash
# Deploy command
curl -fsSL https://raw.githubusercontent.com/USERNAME/REPO/main/output/project_files/scripts/git-deploy.sh | bash -s https://github.com/USERNAME/REPO.git
```

### **GitLab Repository:**
```bash
# Deploy command  
curl -fsSL https://gitlab.com/USERNAME/REPO/-/raw/main/output/project_files/scripts/git-deploy.sh | bash -s https://gitlab.com/USERNAME/REPO.git
```

### **Private Repository:**
```bash
# SSH key gerekir
curl -fsSL https://raw.githubusercontent.com/USERNAME/REPO/main/output/project_files/scripts/git-deploy.sh | bash -s git@github.com:USERNAME/REPO.git
```

---

## **🔒 Private Repository için SSH Setup**

```bash
# Sunucuda SSH key oluşturun
ssh-keygen -t rsa -b 4096 -C "server@yourdomain.com"

# Public key'i GitHub/GitLab'a ekleyin
cat ~/.ssh/id_rsa.pub

# Private repo clone edin
git clone git@github.com:USERNAME/PRIVATE-REPO.git
```

---

## **🤖 GitHub Actions ile Otomatik Deployment**

`.github/workflows/deploy.yml` dosyası:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /home/$USER/inflow-inventory
          git pull origin main
          cd output/project_files
          docker-compose -f docker-compose.prod.yml up -d --build
```

---

## **💡 Pro Tips**

1. **Branch Strategy:** Production için `main`, development için `dev` branch kullanın
2. **Environment Files:** Her ortam için ayrı `.env` dosyası
3. **Database Migration:** Güncellemeler için migration scriptleri hazırlayın
4. **Health Checks:** Deployment sonrası sistem sağlığını kontrol edin
5. **Monitoring:** Logs ve performansı takip edin

---

## **🚨 Troubleshooting**

### Git pull hatası:
```bash
cd /home/$USER/inflow-inventory
git reset --hard origin/main
git pull origin main
```

### Docker build hatası:
```bash
cd output/project_files
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d --build
```

### Permission hatası:
```bash
sudo chown -R $USER:$USER /home/$USER/inflow-inventory
chmod +x output/project_files/scripts/*.sh
```

---

**🎯 Sonuç:** Git-based deployment ile projenizi professional bir şekilde yönetebilir, kolayca güncelleyebilir ve ekip çalışması yapabilirsiniz! 