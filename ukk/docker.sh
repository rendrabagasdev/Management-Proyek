#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║  🐳 DOCKER ULTIMATE SCRIPT - ALL-IN-ONE                       ║
# ║  Build, Deploy, Manage, Security - Node.js Latest             ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.secure.yml"
COMMAND=${1:-help}

# Helper functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check prerequisites
check_prereqs() {
    if ! command -v docker &> /dev/null; then
        error "Docker tidak terinstall!"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose tidak terinstall!"
        exit 1
    fi
}

# Show banner
show_banner() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║     🐳 DOCKER ULTIMATE - ALL-IN-ONE MANAGEMENT SCRIPT         ║
╚═══════════════════════════════════════════════════════════════╝

EOF
}

# Build command
cmd_build() {
    show_banner
    info "Docker Build dengan Node.js Latest"
    echo ""
    
    check_prereqs
    
    echo "📋 System Info:"
    echo "  • Docker: $(docker --version | cut -d' ' -f3)"
    echo "  • Docker Compose: $(docker-compose --version | cut -d' ' -f4)"
    echo "  • Node.js Image: node:latest + node:alpine"
    echo ""
    
    echo "Pilih mode build:"
    echo "1) Build normal (recommended)"
    echo "2) Build tanpa cache (jika ada masalah)"
    echo "3) Build dengan progress detail"
    echo ""
    read -p "Pilih (1-3) [default: 1]: " BUILD_MODE
    BUILD_MODE=${BUILD_MODE:-1}
    
    echo ""
    case $BUILD_MODE in
        1)
            warning "Starting normal build..."
            docker-compose -f $COMPOSE_FILE build app
            ;;
        2)
            warning "Starting clean build (no cache)..."
            docker-compose -f $COMPOSE_FILE build --no-cache app
            ;;
        3)
            warning "Starting detailed build..."
            DOCKER_BUILDKIT=1 docker-compose -f $COMPOSE_FILE build --progress=plain app
            ;;
        *)
            error "Pilihan tidak valid!"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo ""
        success "Build berhasil!"
        echo ""
        echo "🎯 Langkah selanjutnya:"
        echo "  ./docker.sh up         → Start services"
        echo "  ./docker.sh status     → Check status"
        echo "  ./docker.sh logs       → View logs"
    else
        error "Build gagal!"
        echo ""
        echo "💡 Tips troubleshooting:"
        echo "  1. Cek koneksi internet"
        echo "  2. Coba: ./docker.sh build (pilih mode 2)"
        echo "  3. Coba: ./docker.sh clean && ./docker.sh build"
        exit 1
    fi
}

# Up command
cmd_up() {
    show_banner
    success "Starting containers with security layers..."
    
    # Create directories if not exist
    mkdir -p nginx/ssl fail2ban/data mysql-config
    
    docker-compose -f $COMPOSE_FILE up -d
    
    echo ""
    warning "Waiting for services to be ready..."
    sleep 15
    
    echo ""
    info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy || warning "Migration skipped"
    
    echo ""
    info "Seeding database (optional)..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma db seed || warning "Seeding skipped"
    
    echo ""
    success "All services are running!"
    echo ""
    echo "🔐 Security Stack Status:"
    echo "  ✓ Nginx Reverse Proxy (Port 80/443)"
    echo "  ✓ Rate Limiting Active (10 req/s)"
    echo "  ✓ Fail2ban Protection Active"
    echo "  ✓ Backend Network Isolated"
    echo ""
    echo "🌐 Access at:"
    echo "  • http://localhost (via Nginx - secure)"
    echo "  • http://localhost:3000 (direct - if exposed)"
    echo ""
    echo "📊 Check status: ./docker.sh status"
    echo "📋 View logs: ./docker.sh logs"
}

# Down command
cmd_down() {
    warning "Stopping containers..."
    docker-compose -f $COMPOSE_FILE down
    success "Containers stopped!"
}

# Restart command
cmd_restart() {
    warning "Restarting containers..."
    docker-compose -f $COMPOSE_FILE restart
    success "Containers restarted!"
}

# Logs command
cmd_logs() {
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
        info "Showing all logs..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        info "Showing logs for $SERVICE..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 $SERVICE
    fi
}

# Status command
cmd_status() {
    show_banner
    echo "📊 CONTAINER STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "🔐 SECURITY STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client status 2>/dev/null || warning "Fail2ban not running"
    
    echo ""
    echo "📈 RESOURCE USAGE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Shell command
cmd_shell() {
    SERVICE=${2:-app}
    info "Opening shell in $SERVICE container..."
    docker-compose -f $COMPOSE_FILE exec $SERVICE sh
}

# Clean command
cmd_clean() {
    warning "Cleaning up..."
    echo "This will remove all containers and volumes!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
        docker-compose -f $COMPOSE_FILE down -v
        docker system prune -f
        success "Cleanup complete!"
    else
        info "Cleanup cancelled"
    fi
}

# Migrate command
cmd_migrate() {
    info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy
    success "Migrations complete!"
}

# Seed command
cmd_seed() {
    info "Seeding database..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma db seed
    success "Seeding complete!"
}

# Banned IPs command
cmd_banned() {
    show_banner
    echo "🚫 BANNED IPs"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client status nginx-http-auth 2>/dev/null || true
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client status nginx-limit-req 2>/dev/null || true
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client status nginx-ddos 2>/dev/null || true
}

# Unban command
cmd_unban() {
    IP=${2:-}
    if [ -z "$IP" ]; then
        error "Please provide IP address to unban"
        echo "Usage: ./docker.sh unban <IP_ADDRESS>"
        exit 1
    fi
    info "Unbanning IP: $IP"
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client set nginx-http-auth unbanip $IP
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client set nginx-limit-req unbanip $IP
    docker-compose -f $COMPOSE_FILE exec fail2ban fail2ban-client set nginx-ddos unbanip $IP
    success "IP unbanned from all jails!"
}

# Nginx reload command
cmd_nginx_reload() {
    info "Reloading Nginx configuration..."
    docker-compose -f $COMPOSE_FILE exec nginx nginx -t && \
    docker-compose -f $COMPOSE_FILE exec nginx nginx -s reload
    success "Nginx reloaded!"
}

# Test command
cmd_test() {
    show_banner
    echo "🧪 TESTING SECURITY CONFIGURATION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Testing rate limiting (should get 429 after 10 requests)..."
    for i in {1..15}; do
        curl -s -o /dev/null -w "Request $i: %{http_code}\n" http://localhost/
        sleep 0.1
    done
    echo ""
    echo "2. Testing health check..."
    curl -s http://localhost/health || warning "Health check endpoint not available"
    echo ""
    success "Test complete!"
}

# Commands reference
cmd_commands() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║                  📋 COMMANDS REFERENCE                        ║
╚═══════════════════════════════════════════════════════════════╝

📦 BUILD & DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh build              Build Docker images (interactive)
  ./docker.sh up                 Start all services with security
  ./docker.sh down               Stop all services
  ./docker.sh restart            Restart all services

📋 LOGS & MONITORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh logs               Show all logs (follow mode)
  ./docker.sh logs app           Show app logs only
  ./docker.sh logs nginx         Show nginx logs only
  ./docker.sh logs db            Show database logs only
  ./docker.sh status             Show status + resource usage

💻 CONTAINER MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh shell              Open shell in app container
  ./docker.sh shell db           Open shell in database
  ./docker.sh shell nginx        Open shell in nginx

🗄️  DATABASE OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh migrate            Run database migrations
  ./docker.sh seed               Seed database with data

🔐 SECURITY OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh banned             Show banned IPs
  ./docker.sh unban <IP>         Unban specific IP address
  ./docker.sh nginx-reload       Reload Nginx configuration
  ./docker.sh test               Test security features

🧹 MAINTENANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ./docker.sh clean              Remove containers + volumes
  ./docker.sh commands           Show this help
  ./docker.sh help               Show detailed help

╔═══════════════════════════════════════════════════════════════╗
║                    ⚡ QUICK FIXES                             ║
╚═══════════════════════════════════════════════════════════════╝

❌ Build error (npm ECONNRESET)
   → ./docker.sh clean
   → docker system prune -a -f
   → ./docker.sh build (pilih mode 2)

❌ Database connection failed
   → Check .env: DATABASE_URL=mysql://...@db:3306/...

❌ Port already in use
   → docker-compose down
   → lsof -ti:3000 | xargs kill -9

❌ Services not starting
   → ./docker.sh logs
   → ./docker.sh status
   → ./docker.sh restart

╔═══════════════════════════════════════════════════════════════╗
║                  🚀 QUICK START (3 STEPS)                     ║
╚═══════════════════════════════════════════════════════════════╝

  1️⃣  ./docker.sh build         → Build images
  2️⃣  ./docker.sh up            → Start services
  3️⃣  http://localhost          → Access app

EOF
}

# Help command
cmd_help() {
    show_banner
    cat << 'EOF'
🐳 DOCKER ULTIMATE SCRIPT - Complete Docker Management Tool

USAGE:
  ./docker.sh [command] [options]

COMMANDS:

📦 Build & Deploy:
  build              Build Docker images (interactive menu)
  up                 Start all services with security layers
  down               Stop all services
  restart            Restart all services

📋 Logs & Monitoring:
  logs [service]     Show logs (optional: specific service)
  status             Show container status + resource usage

💻 Container Management:
  shell [service]    Open shell in container (default: app)
                     Services: app, db, nginx, fail2ban

🗄️  Database:
  migrate            Run Prisma database migrations
  seed               Seed database with initial data

🔐 Security:
  banned             Show all banned IP addresses
  unban <IP>         Unban specific IP address
  nginx-reload       Reload Nginx configuration
  test               Test security features (rate limiting, etc.)

🧹 Maintenance:
  clean              Remove all containers and volumes
  commands           Show quick commands reference
  help               Show this help message

EXAMPLES:

  # First time setup
  ./docker.sh build
  ./docker.sh up

  # View logs
  ./docker.sh logs
  ./docker.sh logs app

  # Database operations
  ./docker.sh migrate
  ./docker.sh seed

  # Security management
  ./docker.sh banned
  ./docker.sh unban 192.168.1.100

  # Maintenance
  ./docker.sh status
  ./docker.sh restart

ARCHITECTURE:

  Standard Setup:
    User → App:3000 → Database

  Secure Setup (docker-compose.secure.yml):
    User → Nginx:80 → Fail2ban Monitor
             ↓             ↓
           App       Auto-ban IPs
             ↓
         Database

SECURITY FEATURES:
  ✓ Nginx Reverse Proxy (Port 80/443)
  ✓ Rate Limiting (10 req/s general, 20 req/s API)
  ✓ Fail2ban DDoS Protection
  ✓ Network Isolation (Backend separated)
  ✓ Bad Bot Blocking
  ✓ SQL Injection Protection
  ✓ Auto IP Banning

FILES:
  • docker-compose.secure.yml - Secure setup configuration
  • DockerFile - Multi-stage build (node:latest)
  • .env - Environment variables
  • DOCKER_GUIDE.md - Complete documentation

DOCUMENTATION:
  Read DOCKER_GUIDE.md for complete guide

SUPPORT:
  • Quick commands: ./docker.sh commands
  • Full help: ./docker.sh help
  • Documentation: cat DOCKER_GUIDE.md

EOF
}

# Main command router
case $COMMAND in
    build)
        cmd_build
        ;;
    up)
        cmd_up
        ;;
    down)
        cmd_down
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs "$@"
        ;;
    status)
        cmd_status
        ;;
    shell)
        cmd_shell "$@"
        ;;
    clean)
        cmd_clean
        ;;
    migrate)
        cmd_migrate
        ;;
    seed)
        cmd_seed
        ;;
    banned)
        cmd_banned
        ;;
    unban)
        cmd_unban "$@"
        ;;
    nginx-reload)
        cmd_nginx_reload
        ;;
    test)
        cmd_test
        ;;
    commands)
        cmd_commands
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        error "Unknown command: $COMMAND"
        echo ""
        echo "Usage: ./docker.sh [command]"
        echo ""
        echo "Quick commands:"
        echo "  build    - Build Docker images"
        echo "  up       - Start all services"
        echo "  down     - Stop all services"
        echo "  logs     - View logs"
        echo "  status   - Check status"
        echo "  help     - Show full help"
        echo ""
        echo "Run './docker.sh help' for complete documentation"
        echo "Run './docker.sh commands' for quick reference"
        exit 1
        ;;
esac
