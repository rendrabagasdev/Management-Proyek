#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║  🚀 VPS DEPLOYMENT SCRIPT - PM2 (Non-Docker)                  ║
# ║  Simple, Fast, Production-Ready                                ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configuration
APP_NAME="ukk-app"
APP_PORT=3000
DB_NAME="ukk_project_management"
DB_USER="ukk_user"
DB_PASS="ukk_password"

show_banner() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║     🚀 VPS DEPLOYMENT - PM2 (Non-Docker)                      ║
╚═══════════════════════════════════════════════════════════════╝

EOF
}

# Check if running on VPS or local
check_environment() {
    if [ -f "/etc/os-release" ]; then
        . /etc/os-release
        if [[ "$NAME" == *"Ubuntu"* ]] || [[ "$NAME" == *"Debian"* ]]; then
            info "Running on: $NAME $VERSION"
            return 0
        fi
    fi
    
    warning "Not running on Ubuntu/Debian VPS"
    read -p "Continue anyway? (y/N): " confirm
    [[ $confirm == [yY] ]] || exit 1
}

# Install system dependencies
install_dependencies() {
    show_banner
    info "Installing system dependencies..."
    
    sudo apt update
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        warning "Node.js not found. Installing Node.js 22..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        NODE_VERSION=$(node -v)
        info "Node.js already installed: $NODE_VERSION"
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 not found. Installing PM2..."
        sudo npm install -g pm2
    else
        info "PM2 already installed: $(pm2 -v)"
    fi
    
    # Check MySQL
    if ! command -v mysql &> /dev/null; then
        warning "MySQL not found. Installing MySQL..."
        sudo apt install -y mysql-server
        sudo mysql_secure_installation
    else
        info "MySQL already installed"
    fi
    
    # Check Nginx
    if ! command -v nginx &> /dev/null; then
        warning "Nginx not found. Installing Nginx..."
        sudo apt install -y nginx
    else
        info "Nginx already installed"
    fi
    
    success "All dependencies installed!"
}

# Setup MySQL database
setup_database() {
    info "Setting up MySQL database..."
    
    # Check if database exists
    if sudo mysql -e "USE $DB_NAME;" 2>/dev/null; then
        warning "Database $DB_NAME already exists"
        read -p "Drop and recreate? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            sudo mysql -e "DROP DATABASE $DB_NAME;"
            sudo mysql -e "DROP USER IF EXISTS '$DB_USER'@'localhost';"
        else
            return 0
        fi
    fi
    
    # Create database and user
    sudo mysql << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    success "Database setup complete!"
}

# Deploy application
deploy_app() {
    info "Deploying application..."
    
    # Check .env file
    if [ ! -f ".env" ]; then
        error ".env file not found!"
        info "Creating .env from template..."
        
        cat > .env << EOF
# Database Configuration (Non-Docker)
DATABASE_URL="mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME"

# App Configuration
APP_PORT=$APP_PORT
NODE_ENV=production

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:$APP_PORT
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Firebase Configuration (update with your values)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_VAPID_KEY=""
NEXT_PUBLIC_FIREBASE_DATABASE_URL=""
FIREBASE_SERVICE_ACCOUNT='{}'
EOF
        
        warning "Please update .env with your Firebase credentials!"
        read -p "Press Enter when done..."
    fi
    
    # Install dependencies (include devDependencies for Tailwind CSS build)
    info "Installing Node.js dependencies..."
    npm ci
    
    # Generate Prisma Client
    info "Generating Prisma Client..."
    npx prisma generate
    
    # Run migrations
    info "Running database migrations..."
    npx prisma migrate deploy
    
    # Seed database (optional)
    read -p "Seed database with initial data? (y/N): " seed_confirm
    if [[ $seed_confirm == [yY] ]]; then
        info "Seeding database..."
        node prisma/seed.js || warning "Seeding skipped"
    fi
    
    # Build Next.js
    info "Building Next.js application..."
    npm run build
    
    success "Application deployed!"
}

# Start with PM2
start_pm2() {
    info "Starting application with PM2..."
    
    # Stop existing process if running
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start new process
    pm2 start npm --name "$APP_NAME" -- start
    
    # Save PM2 config
    pm2 save
    
    # Setup PM2 startup script
    read -p "Setup PM2 auto-start on reboot? (y/N): " startup_confirm
    if [[ $startup_confirm == [yY] ]]; then
        pm2 startup
        warning "Run the command shown above, then run: pm2 save"
    fi
    
    success "Application started with PM2!"
    pm2 status
}

# Setup Nginx reverse proxy
setup_nginx() {
    info "Setting up Nginx reverse proxy..."
    
    read -p "Enter your domain (e.g., rendrabagas.my.id): " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # Create Nginx config
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=api:10m rate=20r/s;

server {
    listen 80;
    server_name $DOMAIN;

    # ╔═══════════════════════════════════════════════════════════════╗
    # ║  Cloudflare Real IP Configuration                             ║
    # ╚═══════════════════════════════════════════════════════════════╝
    # Get real client IP from Cloudflare (for rate limiting & logs)
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    real_ip_header CF-Connecting-IP;

    client_max_body_size 100M;

    # Main app
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:$APP_PORT;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:$APP_PORT;
        access_log off;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test config
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    success "Nginx configured!"
    info "Access your app at: http://$DOMAIN"
    echo ""
    
    # ╔═══════════════════════════════════════════════════════════════╗
    # ║  Cloudflare SSL Setup Instructions                            ║
    # ╚═══════════════════════════════════════════════════════════════╝
    info "📋 Next Steps for Cloudflare SSL:"
    echo ""
    echo "1. Cloudflare Dashboard → SSL/TLS → Full (strict)"
    echo "2. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate"
    echo "3. Copy certificate and key to VPS:"
    echo "   sudo mkdir -p /etc/ssl/cloudflare"
    echo "   sudo nano /etc/ssl/cloudflare/cert.pem   # Paste certificate"
    echo "   sudo nano /etc/ssl/cloudflare/key.pem    # Paste private key"
    echo "   sudo chmod 600 /etc/ssl/cloudflare/*.pem"
    echo ""
    echo "4. Update Nginx config to use SSL:"
    echo "   sudo nano /etc/nginx/sites-available/$APP_NAME"
    echo "   (Add SSL server block - see DEPLOY_VPS_NO_DOCKER.md)"
    echo ""
    echo "5. Reload Nginx:"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
    info "Complete guide: cat DEPLOY_VPS_NO_DOCKER.md"
}

# Main menu
main_menu() {
    show_banner
    
    echo "Choose deployment mode:"
    echo ""
    echo "1) Full Setup (Fresh VPS - Install everything)"
    echo "2) Deploy App Only (Dependencies already installed)"
    echo "3) Update App (Pull code + rebuild)"
    echo "4) Setup Nginx Only"
    echo "5) PM2 Status"
    echo "6) View Logs"
    echo "7) Exit"
    echo ""
    read -p "Select option (1-7): " choice
    
    case $choice in
        1)
            check_environment
            install_dependencies
            setup_database
            deploy_app
            start_pm2
            setup_nginx
            success "Full setup complete! 🎉"
            ;;
        2)
            setup_database
            deploy_app
            start_pm2
            success "App deployed! 🚀"
            ;;
        3)
            info "Updating application..."
            git pull
            npm ci
            npx prisma generate
            npx prisma migrate deploy
            npm run build
            pm2 restart $APP_NAME
            success "App updated! ✅"
            ;;
        4)
            setup_nginx
            ;;
        5)
            pm2 status
            pm2 monit
            ;;
        6)
            pm2 logs $APP_NAME
            ;;
        7)
            exit 0
            ;;
        *)
            error "Invalid option!"
            exit 1
            ;;
    esac
}

# Run main menu
main_menu
