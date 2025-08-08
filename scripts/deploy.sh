#!/bin/bash

# inFlow Inventory - Quick Deploy Script
# This script sets up the entire application on a fresh Ubuntu server

set -e

echo "🚀 inFlow Inventory - Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
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

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install additional tools
print_status "Installing additional tools..."
sudo apt install -y nginx certbot python3-certbot-nginx ufw htop curl wget git

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Create application directory
APP_DIR="/home/$USER/inflow-inventory"
print_status "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Download or clone the application
print_status "Setting up application files..."
# If you have a Git repository, uncomment the next line:
# git clone https://github.com/yourusername/inflow-inventory.git .

# Create environment file template
if [ ! -f .env ]; then
    print_status "Creating environment file template..."
    cat > .env << EOF
# Production Environment Variables
# Update these values before running docker-compose

# Database Configuration (PostgreSQL)
POSTGRES_PASSWORD=change_this_postgres_password_now

# JWT Security - Generate a strong secret!
JWT_SECRET=change_this_jwt_secret_to_at_least_32_characters_long

# URLs (Update with your actual domain)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com

# Optional: SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
EOF
    print_warning "Environment file created at .env - PLEASE UPDATE THE VALUES!"
fi

# Create backup script
print_status "Creating backup script..."
mkdir -p $APP_DIR/scripts
cat > $APP_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash

# inFlow Inventory Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
APP_DIR="/home/$USER/inflow-inventory"

# Create backup directory
mkdir -p $BACKUP_DIR

cd $APP_DIR

# Create database backup (PostgreSQL)
echo "Creating database backup..."
docker exec devarp_postgres_prod pg_dump -U postgres -d inflow_db > $BACKUP_DIR/database_backup_$DATE.sql

# Create full application backup
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

chmod +x $APP_DIR/scripts/backup.sh

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh >> /var/log/inflow-backup.log 2>&1") | crontab -

print_status "Installation completed successfully!"
echo ""
print_warning "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Edit the .env file with your actual values:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Copy your application files to: $APP_DIR"
echo ""
echo "3. Start the application:"
echo "   cd $APP_DIR"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. Set up SSL certificate:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
print_status "🎉 inFlow Inventory deployment setup complete!" 