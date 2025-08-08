#!/bin/bash

# inFlow Inventory - Git-Based Deployment Script
# This script clones from git repository and deploys

set -e

echo "🚀 inFlow Inventory - Git Deployment Script"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Repository URL (user needs to set this)
REPO_URL="${1:-https://github.com/yourusername/inflow-inventory.git}"
APP_DIR="/home/$USER/inflow-inventory"

print_status "Starting deployment from repository: $REPO_URL"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not exists
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not exists
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install Git if not exists
print_status "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    print_status "Git installed successfully"
else
    print_status "Git is already installed"
fi

# Install additional tools
print_status "Installing additional tools..."
sudo apt install -y nginx certbot python3-certbot-nginx ufw htop curl wget

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    print_status "Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Navigate to project files
cd $APP_DIR/output/project_files

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating environment file from template..."
    cp env.production.example .env
    print_warning "⚠️  IMPORTANT: Edit .env file with your actual values!"
    print_warning "   nano .env"
fi

# Make scripts executable
print_status "Setting up scripts..."
chmod +x scripts/*.sh 2>/dev/null || true

# Create backup script
print_status "Setting up backup system..."
mkdir -p scripts
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# inFlow Inventory Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
APP_DIR="/home/$USER/inflow-inventory/output/project_files"

mkdir -p $BACKUP_DIR
cd $APP_DIR

# Database backup (PostgreSQL)
echo "Creating database backup..."
docker exec devarp_postgres_prod pg_dump -U postgres -d inflow_db > $BACKUP_DIR/database_backup_$DATE.sql

# Application backup
echo "Creating application backup..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    .

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t database_backup_*.sql | tail -n +8 | xargs -r rm
ls -t app_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: $DATE"
EOF

chmod +x scripts/backup.sh

# Setup automated backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/output/project_files/scripts/backup.sh >> /var/log/inflow-backup.log 2>&1") | crontab -

# Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/inflow-inventory.service > /dev/null << EOF
[Unit]
Description=inFlow Inventory Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR/output/project_files
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable inflow-inventory.service

print_status "🎉 Git-based deployment setup completed!"
echo ""
print_warning "📋 NEXT STEPS:"
echo "1. Edit environment file:"
echo "   nano $APP_DIR/output/project_files/.env"
echo ""
echo "2. Start the application:"
echo "   cd $APP_DIR/output/project_files"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Setup SSL certificate:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
print_status "📁 Application directory: $APP_DIR/output/project_files"
print_status "📋 Check logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "🔄 Update command: cd $APP_DIR && git pull && cd output/project_files && docker-compose -f docker-compose.prod.yml up -d --build" 